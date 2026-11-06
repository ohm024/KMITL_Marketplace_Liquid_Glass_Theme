"use client";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
type Report = { id: number; reporter_id: number; listing_id: number | null; user_id: number | null; reason: string; status: string };
export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const load = () => { api<Report[]>("/admin/reports").then(setReports).catch(e => setError(e.message)); };
  useEffect(() => { load(); }, []);
  async function action(path: string) {
    setError("");
    try { await api(path, { method: "POST" }); load(); }
    catch (e) { setError((e as Error).message); }
  }
  return <main className="page"><h1 className="mb-2 flex items-center gap-2 text-3xl font-black"><ShieldAlert className="text-orange-600"/>แผงควบคุมผู้ดูแลระบบ</h1><p className="small mb-7">จัดการรายงานการกระทำผิดและประกาศที่ไม่เหมาะสม</p>
    {error && <p className="alert mb-5">{error}</p>}
    <div className="panel overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50"><tr>{["ID", "ผู้แจ้ง", "เป้าหมาย", "เหตุผล", "สถานะ", "จัดการ"].map(h => <th key={h} className="p-4">{h}</th>)}</tr></thead>
      <tbody>{reports.map(r => <tr key={r.id} className="border-b border-slate-100"><td className="p-4">#{r.id}</td><td className="p-4">#{r.reporter_id}</td><td className="p-4">{r.listing_id ? `สินค้า #${r.listing_id}` : `ผู้ใช้ #${r.user_id}`}</td><td className="max-w-xs p-4">{r.reason}</td><td className="p-4">{r.status}</td><td className="p-4"><div className="flex flex-wrap gap-2">
        {r.status === "open" && <button className="btn-outline !p-2 text-xs" onClick={() => action(`/admin/reports/${r.id}/resolve`)}>ปิดรายงาน</button>}
        {r.listing_id && <button className="btn-outline !p-2 text-xs !text-red-600" onClick={() => {if(confirm("ระงับประกาศนี้?")) action(`/admin/listings/${r.listing_id}/remove`);}}>ลบโพสต์</button>}
        {r.user_id && <button className="btn-outline !p-2 text-xs !text-red-600" onClick={() => {if(confirm("แบนผู้ใช้นี้?")) action(`/admin/users/${r.user_id}/ban`);}}>แบน</button>}
      </div></td></tr>)}
      {!reports.length && <tr><td colSpan={6} className="p-10 text-center text-slate-500">ไม่มีรายงาน</td></tr>}</tbody></table></div>
  </main>;
}
