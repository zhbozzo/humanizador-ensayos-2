import { useRef, useState } from "react";
import { useSession } from "../lib/useSession";

export default function Humanize() {
  const { token, user } = useSession();
  const [input, setInput] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState<string|null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const API = "http://localhost:4000";

  const onHumanize = async () => {
    setOut(""); setErr(null);
    const res = await fetch(`${API}/api/humanize`, {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: input })
    });
    if (!res.ok || !res.body) {
      const j = await res.json().catch(()=>({error:"Error"}));
      setErr(j.error || "Error");
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let received = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      received += chunk;
      setOut(prev => prev + chunk);
      const pct = Math.min(99, Math.floor((received.length/Math.max(1, input.length*1.1))*100));
      if (bar.current) bar.current.style.width = pct + "%";
    }
    if (bar.current) bar.current.style.width = "100%";
  };

  if (!user) return <div>Debes iniciar sesión</div>;

  return (
    <div style={{maxWidth:720, margin:"2rem auto"}}>
      <h2>Humanize</h2>
      <textarea value={input} onChange={e=>setInput(e.target.value)} style={{width:"100%", height:180}} />
      <div style={{background:"#eee", height:8, borderRadius:4, overflow:"hidden", margin:"8px 0"}}>
        <div ref={bar} style={{background:"#000", height:8, width:"0%"}} />
      </div>
      <button onClick={onHumanize} disabled={!input.trim()}>Humanizar</button>
      {err && <p style={{color:"red"}}>{err}</p>}
      {out && <pre style={{whiteSpace:"pre-wrap"}}>{out}</pre>}
    </div>
  );
}
