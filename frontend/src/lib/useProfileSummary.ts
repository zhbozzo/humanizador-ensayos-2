import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useSession } from "./useSession";

type Summary = {
  plan: string | null;
  words_balance: number | null;
  billing_period?: 'monthly' | 'annual' | null;
  plan_started_at?: string | null;
  plan_renews_at?: string | null;
  auto_renew?: boolean | null;
  next_reset_at?: string | null;
  email?: string | null;
};

export function useProfileSummary() {
  const { user } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) {
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("plan,words_balance,email,billing_period,plan_started_at,plan_renews_at,auto_renew,next_reset_at")
        .eq('email', user.email)
        .maybeSingle();

      const quotas: Record<'free'|'basic'|'pro'|'ultra', number> = { free: 600, basic: 5000, pro: 15000, ultra: 30000 };

      if (!error && data) {
        const currentPlan = ((data.plan as string | null) || 'free').toLowerCase() as 'free'|'basic'|'pro'|'ultra';
        const expected = quotas[currentPlan] ?? 600;
        const needsFix = !data.words_balance || data.words_balance <= 0 || !data.plan;
        if (needsFix) {
          const updateRow = {
            plan: currentPlan,
            words_balance: expected,
            billing_period: (data as any).billing_period || 'monthly',
          } as any;
          await supabase.from('user_profiles').update(updateRow).eq('email', user.email as string);
          setSummary({
            ...(data as any),
            plan: currentPlan,
            words_balance: expected,
            billing_period: updateRow.billing_period,
          });
        } else {
          setSummary(data as Summary);
        }
      } else {
        // Inicializar perfil si no existe: plan free y 600 palabras
        const defaults: Summary & { email?: string|null } = {
          plan: 'free',
          words_balance: 600,
          email: user.email || null,
        } as any;
        await supabase.from('user_profiles').insert(defaults);
        setSummary({ plan: defaults.plan, words_balance: defaults.words_balance, email: defaults.email, billing_period: 'monthly' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  return { summary, loading, reloadProfileSummary: load };
}


