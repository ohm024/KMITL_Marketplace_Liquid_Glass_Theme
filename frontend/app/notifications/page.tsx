"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
type Note = { id: number; content: string; link: string; read: boolean; created_at: string };
export default function NotificationsPage() {
  const [items, setItems] = useState<Note[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api<Note[]>("/notifications").then(setItems).catch(e => setError(e.message)); }, []);
  async function mark(id: number) { await api(`/notifications/${id}/read`, {method: "POST"}); setItems(old => old.map(n => n.id === id ? {...n, read: true} : n)); }
  return <main className="page max-w-[830px]"><h1 className="mb-7 flex items-center gap-3 text-3xl font-black"><Bell className="text-orange-500"/>การแจ้งเตือน</h1>
    {error && <p className="alert">{error}</p>}
    <div className="panel divide-y divide-slate-100">{items.length ? items.map(note => <div key={note.id} className={`flex flex-wrap items-center justify-between gap-4 p-5 ${note.read ? "opacity-60" : ""}`}>
      <div><Link href={note.link} className="font-semibold hover:text-orange-600">{note.content}</Link><p className="small mt-1">{new Date(note.created_at).toLocaleString("th-TH")}</p></div>
      {!note.read && <button onClick={() => mark(note.id)} className="btn-outline !px-3 !py-2 text-xs">ทำเครื่องหมายอ่านแล้ว</button>}</div>) : <p className="small p-10 text-center">ยังไม่มีการแจ้งเตือน</p>}</div>
  </main>;
}
