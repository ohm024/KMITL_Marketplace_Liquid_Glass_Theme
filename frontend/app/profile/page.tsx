/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { api, Listing, User } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [form, setForm] = useState({ display_name: "", phone: "", line_id: "", faculty: "", pickup_zone: "" });
  const [message, setMessage] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<User>("/users/me").then(u => { setUser(u); setForm({display_name: u.display_name, phone: u.phone || "", line_id: u.line_id || "", faculty: u.faculty || "", pickup_zone: u.pickup_zone || ""});
      return api<Listing[]>(`/listings?seller_id=${u.id}`);
    }).then(setItems).catch(() => router.push("/login"));
  }, [router]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMessage(""); setError("");
    try { const u = await api<User>("/users/me", {method: "PATCH", body: JSON.stringify(form)}); setUser(u); setMessage("บันทึกข้อมูลแล้ว"); window.dispatchEvent(new Event("authChanged")); }
    catch (e) { setError((e as Error).message); }
  }
  async function saveAvatar() {
    if (!avatarFile) return;
    setError("");
    try { const data = new FormData(); data.set("file", avatarFile); await api("/users/me/avatar", {method: "POST", body: data});
      const latest = await api<User>("/users/me"); setUser(latest); setMessage("เปลี่ยนรูปโปรไฟล์แล้ว"); setAvatarFile(null);
    } catch(e) { setError((e as Error).message); }
  }
  async function logout() { await api("/auth/logout", {method: "POST"}); window.dispatchEvent(new Event("authChanged")); router.push("/"); router.refresh(); }
  if (!user) return <main className="page">กำลังโหลดข้อมูลบัญชี...</main>;
  return <main className="page"><div className="mb-7 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">โปรไฟล์ของฉัน</h1><p className="small mt-2">{user.email}</p></div><button onClick={logout} className="btn-outline">ออกจากระบบ</button></div>
    <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]"><div className="panel flex flex-col items-center p-8 text-center"><div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-5xl">{user.avatar_url ? <img src={user.avatar_url} alt="รูปโปรไฟล์" className="h-full w-full object-cover"/> : "🎓"}</div><h2 className="text-xl font-black">{user.display_name}</h2>
      <div className="mt-2 flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700"><ShieldCheck size={16}/> Verified Student/Staff</div>
      <p className="small mt-4">คะแนนร้านค้า: {user.seller_rating ? `⭐ ${user.seller_rating}/5` : "ยังไม่มีรีวิว"}</p>
      <div className="mt-5 max-w-full space-y-2"><label className="label">รูปโปรไฟล์ (JPEG / PNG / WEBP)</label><input className="text-xs" aria-label="รูปโปรไฟล์" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setAvatarFile(e.target.files?.[0] || null)}/><button className="btn-outline !px-3 !py-2 text-xs" disabled={!avatarFile} onClick={saveAvatar}>เปลี่ยนรูปโปรไฟล์</button></div>
      <Link className="btn mt-7" href="/sell">+ ลงขายสินค้าใหม่</Link></div>
      <form className="panel space-y-4 p-6" onSubmit={save}><h2 className="text-lg font-bold">แก้ไขข้อมูลส่วนตัว</h2>
        {([ ["display_name", "ชื่อที่แสดง"], ["phone", "เบอร์โทรศัพท์"], ["line_id", "LINE ID"], ["faculty", "คณะ/สาขา"], ["pickup_zone", "โซนนัดรับสะดวก"] ] as const).map(([key, label]) =>
          <div key={key}><label className="label">{label}</label><input className="field" value={form[key]} onChange={e => setForm(p => ({...p,[key]:e.target.value}))}/></div>)}
        {error && <p className="alert">{error}</p>}{message && <p className="success">{message}</p>}
        <button className="btn">บันทึกข้อมูล</button></form></div>
    <div className="mt-12 flex items-center justify-between"><h2 className="section-title">ประกาศของฉัน ({items.length})</h2><Link href="/sell" className="text-sm font-semibold text-orange-600">ลงขายเพิ่ม →</Link></div>
    {items.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{items.map(item => <ListingCard key={item.id} item={item}/>)}</div> : <p className="small mt-6">ยังไม่ได้ลงประกาศสินค้า</p>}
  </main>;
}
