import React, { useState, useEffect, useMemo, useRef } from 'react';
import { humanizeText, detectAI } from '../services/api';
import { saveHistoryItem } from '../services/history';
import ProgressBar from './ProgressBar';
import { useProfileSummary } from '../lib/useProfileSummary';
import { useSession } from '../lib/useSession';
import { supabase } from '../lib/supabaseClient';
import { detectLocale, type Locale } from '../lib/i18n';

interface HumanizeRequest {
  text: string;
  budget: number;
  preserve_entities: boolean;
  respect_style: boolean;
  style_sample: string | null;
  level?: string;
  voice?: string;
  plan?: 'free'|'basic'|'pro'|'ultra';
  max_words?: number;
}

const HumanizerInterface: React.FC = () => {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<'standard' | 'ultimate'>('standard');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [progressStep, setProgressStep] = useState<number | undefined>(undefined);
  const [progressTotal, setProgressTotal] = useState<number | undefined>(undefined);
  const [progressPhase, setProgressPhase] = useState<string | undefined>(undefined);
  const [partial, setPartial] = useState<string>("");
  const [detecting, setDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const { summary, reloadProfileSummary } = useProfileSummary();
  const { user } = useSession();
  const currentPlan = (summary?.plan || 'free') as 'free'|'basic'|'pro'|'ultra'|'free';
  const canUseUltimate = currentPlan === 'basic' || currentPlan === 'pro' || currentPlan === 'ultra';
  const [showUpsell, setShowUpsell] = useState<boolean>(false);
  const [locale, setLocale] = useState<Locale>(detectLocale());
  // Reaccionar a cambio de idioma global
  useEffect(() => {
    const handler = (e: any) => setLocale((e?.detail as Locale) || detectLocale());
    window.addEventListener('locale-changed', handler as any);
    return () => window.removeEventListener('locale-changed', handler as any);
  }, []);
  const maxWords = (() => {
    if (currentPlan === 'ultra') return 1800;
    if (currentPlan === 'pro') return 1200;
    if (currentPlan === 'basic') return 800;
    return 600;
  })();

  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-brand-gradient';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-cyan-600';
    return 'text-red-600';
  };

  const barColor = (score: number) => {
    if (score >= 85) return 'bg-brand-gradient';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-cyan-500';
    return 'bg-red-500';
  };

  const handleSubmit = async () => {
    if (!user) {
      try { window.dispatchEvent(new CustomEvent('open-signup')); } catch {}
      return;
    }
    if (!text.trim()) {
      setError('Por favor, ingresa el texto a humanizar');
      return;
    }
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (wordCount > maxWords) {
      setError(`Supera el tope de ${maxWords} palabras para tu plan.`);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProgressStatus('processing');
    setProgressMessage('Iniciando proceso...');

    try {
      const request: HumanizeRequest = {
        text,
        budget: level === 'ultimate' ? 0.85 : 0.75,
        preserve_entities: true,
        respect_style: false,
        style_sample: null,
        level,
        voice: 'collective',
        plan: currentPlan,
        max_words: maxWords
      };

      // Iniciar proceso con seguimiento de progreso
      const response = await humanizeText(request, (update: any) => {
        if (update.progress !== undefined) {
          setProgress(update.progress);
        }
        if (update.status) {
          setProgressStatus(update.status);
        }
        if (update.message) {
          setProgressMessage(update.message);
        }
        if (update.step !== undefined) setProgressStep(update.step);
        if (update.total_steps !== undefined) setProgressTotal(update.total_steps);
        if (update.phase !== undefined) setProgressPhase(update.phase);
        if (update.partial !== undefined && typeof update.partial === 'string') setPartial(update.partial);
      });
      
      setResult(response);
      // Descontar palabras del balance y refrescar perfil (evitar poner 0 si el summary aún no cargó)
      try {
        if (user?.email) {
          const wordsUsed = text.trim().split(/\s+/).length;
          const { data: row } = await supabase
            .from('user_profiles')
            .select('words_balance')
            .eq('email', user.email)
            .maybeSingle();
          const currentBalance = typeof row?.words_balance === 'number' ? row.words_balance : (summary?.words_balance ?? 0);
          const newBalance = Math.max(0, currentBalance - wordsUsed);
          await supabase
            .from('user_profiles')
            .update({ words_balance: newBalance })
            .eq('email', user.email);
          if (reloadProfileSummary) await reloadProfileSummary();
          window.dispatchEvent(new CustomEvent('profile-summary-refresh'));
          // animar delta en header sin esperar fetch
          window.dispatchEvent(new CustomEvent('balance-delta', { detail: -wordsUsed } as any));
        }
      } catch {}
      setProgress(100);
      setProgressStatus('completed');
      setProgressMessage('¡Proceso completado!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando el texto');
      setProgressStatus('error');
      setProgressMessage('Error en el proceso');
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = async () => {
    if (!text.trim()) {
      setError('Por favor, ingresa el texto a analizar');
      return;
    }
    setDetecting(true);
    setDetectResult(null);
    try {
      const res = await detectAI({ text, language: 'es' } as any, (u:any)=>{
        // despliega de inmediato el contenedor derecho durante el progreso
        if (!detectResult) setDetectResult({});
      });
      setDetectResult(res);
    } catch (e:any) {
      setDetectResult({
        ai_probability: 0,
        human_score: 0,
        classification: 'N/D',
        analysis: 'No se pudo completar la detección. Intenta nuevamente.'
      });
      setError(e?.message || 'Error en la detección');
    } finally {
      setDetecting(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  
  // Overlay con highlight para palabras que exceden el máximo por request
  const highlightedHtml = useMemo(() => {
    const tokens = (text || '').split(/(\s+)/); // conserva espacios
    let idx = 0;
    const out: string[] = [];
    for (const t of tokens) {
      if (/^\s+$/.test(t)) { out.push(t.replace(/</g,'&lt;').replace(/>/g,'&gt;')); continue; }
      idx += 1;
      const safe = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      if (idx > maxWords) {
        out.push(`<span style=\"background-color: rgba(255,0,0,0.18); color: transparent; border-radius: 4px;\">${safe}</span>`);
      } else {
        out.push(safe);
      }
    }
    return out.join('');
  }, [text, maxWords]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  let raf = 0 as any;
  const syncScroll = () => {
    try {
      const ta = textareaRef.current; const ov = overlayRef.current;
      if (!ta || !ov) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        ov.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
      });
    } catch {}
  };
  useEffect(()=>{ syncScroll(); }, [text]);
  // Re-humanizar desde History (una sola vez)
  useEffect(() => {
    const seed = localStorage.getItem('rehumanize_text');
    if (seed) {
      setText(seed);
      localStorage.removeItem('rehumanize_text');
    }
  }, []);

  const showRight = loading || detecting || !!result || !!detectResult;

  return (
    <div className="max-w-6xl mx-auto animate-fade-up bg-[radial-gradient(1200px_600px_at_-10%_-10%,#00E5FF12,transparent),radial-gradient(900px_500px_at_110%_20%,#007BFF14,transparent)] p-1 rounded-2xl">
      {/* Contenedor estilo 2 columnas (inicio ocupa todo y aparece panel derecho al ejecutar) */}
      <div className={`grid grid-cols-1 ${showRight ? 'md:grid-cols-2' : ''} gap-6`}>
        {/* Izquierda: Your Text */}
        <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl p-4 md:p-5 card-appear">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-800">{locale==='es' ? 'Tu texto' : 'Your text'}</div>
            <div className="flex items-center gap-2 relative">
              <div className="hidden md:flex rounded-lg border border-gray-300 overflow-hidden text-xs">
                <button onClick={()=>setLevel('standard')} className={`px-2 py-1 ${level==='standard'?'animated-bg text-white':'text-gray-600 hover:bg-gray-50'}`}>{locale==='es' ? 'Estándar' : 'Standard'}</button>
                <button
                  onClick={()=> {
                    if (canUseUltimate) {
                      setShowUpsell(false);
                      setLevel('ultimate');
                    } else {
                      setShowUpsell(true);
                      setLevel('standard');
                    }
                  }}
                  className={`px-2 py-1 ${level==='ultimate'?'animated-bg text-white':'text-gray-600 hover:bg-gray-50'}`}
                >
                  Ultimate
                </button>
                {showUpsell && !canUseUltimate && (
                  <div className="absolute right-0 top-8 z-20 w-72 bg-white/90 backdrop-blur rounded-lg border border-red-200 shadow-lg p-3">
                    <div className="text-sm font-semibold text-red-600 mb-1">{locale==='es' ? 'Ultimate no disponible' : 'Ultimate not available'}</div>
                    <div className="text-xs text-gray-700">{locale==='es' ? (
                      <>Requiere un plan <span className="font-medium">Basic, Pro o Ultra</span> para activar el modo Ultimate.</>
                    ) : (
                      <>Requires a <span className="font-medium">Basic, Pro or Ultra</span> plan to activate Ultimate mode.</>
                    )}</div>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button onClick={()=>setShowUpsell(false)} className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50">{locale==='es' ? 'Cerrar' : 'Close'}</button>
                      <button onClick={()=>{ window.dispatchEvent(new CustomEvent('open-pricing')); setShowUpsell(false); }} className="px-3 py-1 text-xs rounded btn-brand">{locale==='es' ? 'Mejorar plan' : 'Upgrade plan'}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="relative">
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-lg">
                <div ref={overlayRef} style={{ color: 'transparent' }} className="px-4 py-3 whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
              </div>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e)=>setText(e.target.value)}
                onScroll={syncScroll}
                placeholder={locale==='es' ? 'Pega tu texto aquí...' : 'Paste your text here...'}
                className="relative z-10 w-full h-72 md:h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-800 caret-gray-800 selection:bg-blue-200 overflow-auto"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`${wordCount>maxWords ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{wordCount}</span>
                <span className="text-gray-400">/ {maxWords} {locale==='es' ? 'palabras' : 'words'}</span>
                {wordCount>maxWords && currentPlan !== 'ultra' && (
                  <button
                    onClick={()=>window.dispatchEvent(new CustomEvent('open-pricing'))}
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-brand-gradient text-white"
                  >{locale==='es' ? 'Obtener más palabras' : 'Unlock more words'}</button>
                )}
              </div>
              {error && <span className="text-red-600">{error}</span>}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">{locale==='es' ? 'Cada palabra ingresada descuenta 1 de tu balance.' : 'Each input word deducts 1 from your balance.'}</div>
            <div className="flex items-center gap-2">
              {!result && (
                <button
                  onClick={handleDetect}
                  disabled={detecting || !text.trim()}
                  className={`px-2.5 py-1.5 rounded-md border text-xs transition ${detecting||!text.trim()? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  {detecting ? (locale==='es' ? 'Analizando…' : 'Analyzing…') : (locale==='es' ? 'Detectar IA' : 'Detect AI')}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || !text.trim() || wordCount>maxWords}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${(loading||!text.trim()||wordCount>maxWords)? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-brand'}`}
              >
                {loading ? (locale==='es' ? 'Procesando…' : 'Processing…') : (locale==='es' ? 'Humanizar' : 'Humanize')}
              </button>
            </div>
          </div>
        </div>

        {/* Derecha: Result */}
        {showRight && (
        <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl p-4 md:p-5 min-h-[22rem] card-appear">
          <div className="text-sm font-semibold text-gray-800 mb-3">{locale==='es' ? 'Resultado' : 'Result'}</div>
          {loading ? (
            <div className="text-sm text-gray-600">
              <ProgressBar 
                progress={progress}
                status={progressStatus}
                message={progressMessage}
                step={progressStep}
                total_steps={progressTotal}
                phase={progressPhase}
                showPercentage={true}
              />
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 min-h-40 max-h-[28rem] overflow-auto">{partial || (locale==='es' ? 'Esperando tokens...' : 'Waiting for tokens...')}</pre>
              </div>
            </div>
          ) : detecting ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                <div className="text-xs text-gray-500">Analizando…</div>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-3">
              <div className="flex items-center justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.result).then(()=>{
                      const t = document.createElement('div');
                      t.textContent = locale==='es' ? 'Copiado al portapapeles' : 'Copied to clipboard';
                      t.style.position = 'fixed';
                      t.style.top = '50%';
                      t.style.left = '50%';
                      t.style.transform = 'translate(-50%, -50%)';
                      t.style.background = 'linear-gradient(90deg, var(--brand-start), var(--brand-end))';
                      t.style.color = 'white';
                      t.style.padding = '10px 16px';
                      t.style.borderRadius = '10px';
                      t.style.zIndex = '10000';
                      document.body.appendChild(t);
                      setTimeout(()=>{ try { document.body.removeChild(t); } catch {} }, 1200);
                    }).catch(()=>{});
                  }}
                  className="px-3 py-1.5 bg-gray-700 text-white rounded-md text-xs hover:bg-gray-800"
                >
                  {locale==='es' ? 'Copiar' : 'Copy'}
                </button>
                <button
                  disabled={saved}
                  onClick={async () => {
                    try {
                      await saveHistoryItem({
                        email: user?.email || undefined,
                        level,
                        input: text,
                        result: (result as any)?.result,
                        input_len: text.trim().split(/\s+/).length,
                        result_len: ((result as any)?.result || '').trim().split(/\s+/).length,
                      });
                      setSaved(true);
                      const t = document.createElement('div');
                      t.textContent = locale==='es' ? 'Guardado en historial' : 'Saved to history';
                      t.style.position = 'fixed';
                      t.style.top = '50%';
                      t.style.left = '50%';
                      t.style.transform = 'translate(-50%, -50%)';
                      t.style.background = 'linear-gradient(90deg, var(--brand-start), var(--brand-end))';
                      t.style.color = 'white';
                      t.style.padding = '10px 16px';
                      t.style.borderRadius = '10px';
                      t.style.zIndex = '10000';
                      document.body.appendChild(t);
                      setTimeout(()=>{ try { document.body.removeChild(t); } catch {} }, 1200);
                    } catch {}
                  }}
                  className={`ml-2 px-3 py-1.5 rounded-md text-xs ${saved? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'btn-brand'}`}
                >
                  {saved ? (locale==='es' ? 'Guardado' : 'Saved') : (locale==='es' ? 'Guardar en historial' : 'Save to history')}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm min-h-40">{result.result}</pre>
            </div>
          ) : detectResult ? (
            <div>
              <div className="flex items-end justify-between">
                <div>
                  <div className={`text-3xl font-bold ${scoreColor(Math.round(detectResult.human_score||0))}`}>{Math.round(detectResult.human_score||0)}%</div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">{locale==='es' ? 'Score Humano' : 'Human Score'}</div>
                </div>
                <div className="text-sm font-medium text-gray-700">{detectResult.classification}</div>
              </div>
              <div className="mt-3 w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className={`${barColor(Math.round(detectResult.human_score||0))} h-3`} style={{ width: `${Math.round(detectResult.human_score||0)}%` }} />
              </div>
              {detectResult.analysis && (
                <pre className="mt-3 whitespace-pre-wrap text-xs text-gray-700">{detectResult.analysis}</pre>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">{locale==='es' ? 'El resultado aparecerá aquí.' : 'The result will appear here.'}</div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default HumanizerInterface;
