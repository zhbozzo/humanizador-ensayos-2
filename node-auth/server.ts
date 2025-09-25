import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const app = express();
// Permitir CORS desde origen configurado o cualquiera en dev
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : true; // refleja origen del request
app.use(cors({ origin: corsOrigin as any, credentials: true }));
// Capturar rawBody para verificación de firma en /api/webhooks/paddle
app.use(express.json({
  verify: (req: Request & { rawBody?: string }, _res: Response, buf: Buffer) => {
    try {
      if ((req as any).originalUrl === '/api/webhooks/paddle') {
        (req as any).rawBody = buf.toString();
      }
    } catch {}
  }
}));

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE!;
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRole
);

async function verifyUser(req: Request) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')? auth.slice(7): null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
}

app.get('/health', (_req: Request, res: Response) => res.status(200).send('ok'));

// Verificar si un email existe en auth o en perfiles (para UX de reset)
app.get('/api/auth/email-exists', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.json({ exists: false });
    }
    // Buscar en user_profiles por email (más barato que listar usuarios de auth)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    if (profile?.email) return res.json({ exists: true });

    // Como fallback, consultar directamente al Auth Admin por email (preciso y eficiente)
    try {
      const { data, error } = await (supabaseAdmin as any).auth.admin.getUserByEmail(email);
      if (error) return res.json({ exists: false });
      return res.json({ exists: !!data?.user });
    } catch {
      return res.json({ exists: false });
    }
  } catch {
    return res.json({ exists: false });
  }
});

// --- Paddle Webhooks ---
const PRICE_TO_PLAN: Record<string, { plan: 'basic'|'pro'|'ultra', billing: 'monthly'|'annual' }> = {
  'pri_01k5wq6b65vmkve97p0btjfr5x': { plan: 'basic', billing: 'monthly' },
  'pri_01k5wqbb5bwz3ezmqd7dp7y2ef': { plan: 'basic', billing: 'annual' },
  'pri_01k5wr9nmmcb5w7j1c4ss6rf47': { plan: 'pro',   billing: 'monthly' },
  'pri_01k5wrcmwnktar6q34vx5w5ppb': { plan: 'pro',   billing: 'annual' },
  'pri_01k5xvtqxsy26ga7ve67ee8dae': { plan: 'ultra', billing: 'monthly' },
  'pri_01k5xvx9y01d1dy90e907ftk8h': { plan: 'ultra', billing: 'annual' },
};

function parsePaddleSignature(header: string | undefined) {
  if (!header) return null;
  const parts = header.split(/[;,]/).map((s) => s.trim());
  const kv: Record<string, string> = {};
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k && v) kv[k] = v;
  }
  const ts = kv['ts'] || kv['t'];
  const h1 = kv['h1'] || kv['v1'];
  if (!ts || !h1) return null;
  return { ts, h1 };
}

function timingSafeEqualHex(a: string, b: string) {
  try {
    const aBuf = Buffer.from(a, 'hex');
    const bBuf = Buffer.from(b, 'hex');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

app.post('/api/webhooks/paddle', async (req: Request & { rawBody?: string }, res: Response) => {
  try {
    const secret = process.env.PADDLE_WEBHOOK_SECRET || '';
    if (!secret) return res.status(500).send('Missing webhook secret');

    const signatureHeader = req.get('paddle-signature') || req.get('Paddle-Signature') || '';
    const parsed = parsePaddleSignature(signatureHeader);
    const raw = req.rawBody || JSON.stringify(req.body || {});
    if (!parsed || !raw) return res.status(400).send('Bad signature header');

    // ts:unix + ':' + rawBody
    const toSign = `${parsed.ts}:${raw}`;
    const expected = crypto.createHmac('sha256', secret).update(toSign).digest('hex');
    const ok = timingSafeEqualHex(expected, parsed.h1);
    const tsNum = Number(parsed.ts) || 0;
    const skewOk = Math.abs(Date.now() - tsNum * 1000) < 5 * 60 * 1000; // 5 minutos
    if (!ok || !skewOk) return res.status(400).send('Invalid signature');

    const body = (() => { try { return JSON.parse(raw); } catch { return req.body || {}; } })();
    const type = body?.event?.type || body?.event_type || body?.type || '';
    const data = body?.data || body;

    const subscriptionId = data?.subscription?.id || data?.id || null;
    const priceId = data?.items?.[0]?.price?.id || data?.price?.id || null;
    const customerEmail = data?.customer?.email || null;
    const customerId = data?.customer?.id || null;
    const status = data?.status || null;
    const nextBill = data?.next_billed_at || data?.current_billing_period_ends_at || null;
    const startedAt = data?.start_date || data?.created_at || null;

    if (!customerEmail) {
      console.warn('[paddle] webhook sin email, type=', type, 'data.customer=', data?.customer);
      return res.status(200).send('ok');
    }

    const mapping = priceId ? PRICE_TO_PLAN[priceId] : undefined;
    const update: any = {
      status: status || undefined,
      price_id: priceId || undefined,
      paddle_customer_id: customerId || undefined,
      paddle_subscription_id: subscriptionId || undefined,
    };
    if (mapping) {
      update.plan = mapping.plan;
      update.billing_period = mapping.billing;
    }
    if (startedAt) update.plan_started_at = startedAt;
    if (nextBill) update.plan_renews_at = nextBill;

    // Upsert básico por email
    const { data: updated, error: upErr } = await supabaseAdmin
      .from('user_profiles')
      .update(update)
      .eq('email', customerEmail)
      .select('email')
      .maybeSingle();

    if (upErr || !updated) {
      await supabaseAdmin.from('user_profiles').insert({ email: customerEmail, ...update });
    }

    return res.status(200).send('ok');
  } catch (e: any) {
    console.error('[paddle] error:', e?.message || e);
    return res.status(500).send('error');
  }
});

app.post('/api/account/set-plan', async (req: Request, res: Response) => {
  try {
    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: 'No auth' });
    const { plan } = req.body as { plan: 'free'|'basic'|'pro'|'ultra' };
    if (!plan) return res.status(400).json({ error: 'Falta plan' });
    const { error } = await supabaseAdmin.rpc('set_plan_and_topup', { p_user: user.id, p_plan: plan });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true });
  } catch (e:any) {
    res.status(500).json({ error: e.message || 'Error' });
  }
});

app.post('/api/humanize', async (req: Request, res: Response) => {
  try {
    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: 'No auth' });
    const { text } = req.body as { text: string };
    if (!text?.trim()) return res.status(400).json({ error: 'Falta texto' });

    const { data: profile, error: pErr } = await supabaseAdmin
      .from('user_profiles').select('words_balance').eq('user_id', user.id).single();
    if (pErr) return res.status(400).json({ error: pErr.message });

    const wordsIn = (text.trim().match(/[^\s]+/g) ?? []).length;
    if ((profile?.words_balance ?? 0) < wordsIn) {
      return res.status(402).json({ error: 'Saldo insuficiente' });
    }

    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        messages: [
          { role: 'system', content: 'Eres un editor experto. Humaniza el texto manteniendo significado y naturalidad.' },
          { role: 'user', content: text },
        ],
      }),
    } as any);

    if (!(upstream as any).ok || !(upstream as any).body) {
      return res.status(500).json({ error: `DeepSeek ${(upstream as any).status}` });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = ((upstream as any).body as any).getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let buffer = '';
    let out = '';

    async function debit(words: number) {
      if (!user) return; // Type guard para TS
      await supabaseAdmin.rpc('debit_words', { p_user: user.id, p_words: words });
    }

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith('data:')) continue;
        const payload = s.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            out += delta;
            res.write(encoder.encode(delta));
          }
        } catch {}
      }
    }

    const wordsOut = (out.trim().match(/[^\s]+/g) ?? []).length;
    await debit(wordsOut);

    res.end();
  } catch (e:any) {
    res.status(500).json({ error: e.message || 'Error' });
  }
});

// Crear sesión del Portal de Paddle (Customer Portal)
app.post('/api/paddle/portal', async (req: Request, res: Response) => {
  try {
    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: 'No auth' });

    const returnUrl = process.env.PORTAL_RETURN_URL || 'http://localhost:5173/#profile';

    // Intentar encontrar paddle_customer_id por user_id o por email
    let paddleCustomerId: string | null = null;
    {
      const { data } = await supabaseAdmin
        .from('user_profiles')
        .select('paddle_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();
      paddleCustomerId = (data as any)?.paddle_customer_id || null;
    }
    if (!paddleCustomerId && user.email) {
      const { data } = await supabaseAdmin
        .from('user_profiles')
        .select('paddle_customer_id')
        .eq('email', user.email)
        .maybeSingle();
      paddleCustomerId = (data as any)?.paddle_customer_id || null;
    }

    if (!paddleCustomerId) {
      return res.status(400).json({ error: 'No Paddle customer id' });
    }

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing PADDLE_API_KEY' });

    const response = await fetch('https://api.paddle.com/portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customer_id: paddleCustomerId, return_url: returnUrl }),
    } as any);

    const json = await (response as any).json().catch(() => ({}));
    if (!(response as any).ok) {
      return res.status(400).json({ error: json?.error || 'Portal session failed' });
    }

    const url = json?.data?.url || json?.url || json?.data?.attributes?.url;
    if (!url) return res.status(400).json({ error: 'No portal URL' });
    return res.json({ url });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error' });
  }
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`node-auth listening on :${port}`));
