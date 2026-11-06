"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import { API_URL, api, json, User } from "@/lib/api";

type Thread = { listing_id: number; title: string; partner_id: number; partner_name: string; last_message: string };
type Msg = { id: number; sender_id: number; recipient_id: number; content: string; kind: string; created_at: string };
function MessagesView() {
  const params = useSearchParams();
  const listing = Number(params.get("listing"));
  const partner = Number(params.get("partner"));
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [content, setContent] = useState("");
  const [kind, setKind] = useState("text");
  const [error, setError] = useState("");
  const load = useCallback(() => {
    api<Thread[]>("/chats").then(setThreads).catch(e => setError(e.message));
    if (listing && partner) api<Msg[]>(`/listings/${listing}/messages?partner_id=${partner}`).then(setMessages).catch(e => setError(e.message));
  }, [listing, partner]);
  useEffect(() => { api<User>("/users/me").then(setUser).catch(() => setError("กรุณาเข้าสู่ระบบ")); load(); }, [load]);
  useEffect(() => {
    if (!user) return;
    const ws = new WebSocket(`${API_URL.replace(/^http/, "ws")}/ws`);
    ws.onmessage = () => load();
    return () => ws.close();
  }, [user, load]);
  async function send(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try { await api(`/listings/${listing}/messages`, json({partner_id: partner, content, kind})); setContent(""); load(); }
    catch (e) { setError((e as Error).message); }
  }
  return <main className="page"><h1 className="mb-6 text-3xl font-black">ข้อความของฉัน</h1>
    {error && <div className="alert mb-5">{error}</div>}
    <div className="panel grid min-h-[570px] overflow-hidden md:grid-cols-[300px_1fr]">
      <aside className="border-b border-slate-100 md:border-b-0 md:border-r"><h2 className="border-b border-slate-100 p-5 font-bold">บทสนทนา ({threads.length})</h2>
        {threads.map(t => <Link key={`${t.listing_id}-${t.partner_id}`} href={`/messages?listing=${t.listing_id}&partner=${t.partner_id}`} className={`block border-b border-slate-50 p-4 hover:bg-orange-50 ${listing === t.listing_id && partner === t.partner_id ? "bg-orange-50" : ""}`}><p className="font-bold">{t.partner_name}</p><p className="small line-clamp-1">{t.title}</p><p className="mt-1 truncate text-xs text-slate-400">{t.last_message}</p></Link>)}
        {!threads.length && <p className="small p-5">ยังไม่มีบทสนทนา เริ่มแชตจากหน้าสินค้าได้เลย</p>}
      </aside><section className="flex min-h-[500px] flex-col">
        {listing && partner ? <><div className="border-b border-slate-100 px-6 py-4 font-bold">พูดคุยเกี่ยวกับสินค้า #{listing}</div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50/50 p-5">{messages.length ? messages.map(msg => <div key={msg.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.sender_id === user?.id ? "ml-auto bg-orange-500 text-white" : "mr-auto bg-white text-slate-700 shadow-sm"}`}>
            {msg.kind === "image" ? <a href={msg.content} target="_blank" rel="noopener noreferrer" className="underline">เปิดรูปภาพที่ส่งมา</a> : msg.kind === "location" ? `📍 ${msg.content}` : msg.content}</div>) : <p className="small text-center">เริ่มส่งข้อความทักทายกันได้เลย</p>}</div>
          <form onSubmit={send} className="flex flex-wrap gap-2 border-t border-slate-100 p-4"><select className="field !w-auto" value={kind} onChange={e => setKind(e.target.value)}><option value="text">ข้อความ</option><option value="location">จุดนัดรับ</option><option value="image">ลิงก์ภาพ HTTPS</option></select>
            <input required maxLength={2000} className="field min-w-[150px] flex-1" value={content} onChange={e => setContent(e.target.value)} placeholder={kind === "image" ? "https://..." : "พิมพ์ข้อความ..."}/>
            <button className="btn flex items-center gap-2"><Send size={17}/>ส่ง</button></form></> : <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-400"><MessageCircle size={50}/><p>เลือกบทสนทนาหรือกดแชตจากหน้าสินค้า</p></div>}
      </section>
    </div>
  </main>;
}
export default function MessagesPage() { return <Suspense fallback={<main className="page">กำลังโหลดข้อความ...</main>}><MessagesView/></Suspense>; }
