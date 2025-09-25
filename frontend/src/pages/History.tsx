import { useEffect, useState } from "react";
import { useSession } from "../lib/useSession";
import { fetchHistory, HistoryItem, deleteHistoryItem } from "../services/history";
import { detectLocale, type Locale } from "../lib/i18n";

export default function History() {
  const { user, loading } = useSession();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [locale, setLocale] = useState<Locale>(detectLocale());

  useEffect(() => {
    const handler = (e: any) => setLocale((e?.detail as Locale) || detectLocale());
    window.addEventListener('locale-changed', handler as any);
    return () => window.removeEventListener('locale-changed', handler as any);
  }, []);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      setBusy(true);
      const data = await fetchHistory(100);
      setItems(data);
      setBusy(false);
    })();
  }, [user, loading]);

  if (loading) return <div className="text-center py-12 text-gray-600">{locale==='es' ? 'Cargando…' : 'Loading…'}</div>;
  if (!user) return <div className="text-center py-12 text-gray-600">{locale==='es' ? 'Inicia sesión para ver tu historial' : 'Log in to view your history'}</div>;

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const ok = await deleteHistoryItem(id);
    if (ok) setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCopy = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(()=>{});
  };

  const handleRehumanize = (text?: string) => {
    if (!text) return;
    // Guardamos el texto en localStorage y mandamos a Humanize
    localStorage.setItem('rehumanize_text', text);
    window.location.hash = 'home';
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-up bg-[radial-gradient(1200px_600px_at_-10%_-10%,#00E5FF12,transparent),radial-gradient(900px_500px_at_110%_20%,#007BFF14,transparent)] p-1 rounded-2xl">
      <h2 className="text-2xl font-bold text-brand-gradient mb-4">{locale==='es' ? 'Historial' : 'History'}</h2>
      {busy ? (
        <div className="text-gray-600">{locale==='es' ? 'Cargando…' : 'Loading…'}</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">{locale==='es' ? 'No hay registros aún.' : 'No items yet.'}</div>
      ) : (
        <div className="space-y-6">
          {items.map((h) => (
            <div key={h.id} className="relative rounded-2xl p-[2px] animated-border">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-xs text-gray-500 flex items-center justify-between">
                <span>{new Date(h.created_at || '').toLocaleString()}</span>
                <span className="inline-flex px-2 py-0.5 rounded bg-brand-gradient text-white">{h.level}</span>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{locale==='es' ? `Entrada (${h.input_len} tokens aprox)` : `Input (${h.input_len} tokens approx)`}</div>
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 rounded p-2 max-h-56 overflow-auto">{h.input}</pre>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{locale==='es' ? `Resultado (${h.result_len} tokens aprox)` : `Result (${h.result_len} tokens approx)`}</div>
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 rounded p-2 max-h-56 overflow-auto">{h.result}</pre>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs">
                <button onClick={()=>handleCopy(h.result)} className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">{locale==='es' ? 'Copiar resultado' : 'Copy result'}</button>
                <button onClick={()=>handleRehumanize(h.input)} className="px-3 py-1 rounded btn-brand">{locale==='es' ? 'Re‑humanizar' : 'Re‑humanize'}</button>
                <button onClick={()=>handleDelete(h.id)} className="px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50">{locale==='es' ? 'Eliminar' : 'Delete'}</button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


