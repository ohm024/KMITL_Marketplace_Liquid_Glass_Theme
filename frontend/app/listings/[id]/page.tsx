"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MapPin, MessageCircle, ShieldCheck, Star, Upload } from "lucide-react";
import { api, Listing, money, statusThai, User } from "@/lib/api";

type Booking = { id: number; buyer_id: number; status: string } | null;
export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Listing | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [booking, setBooking] = useState<Booking>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState({ stars: 5, content: "" });
  const [upload, setUpload] = useState<File | null>(null);
  const refresh = useCallback(async () => {
    const listing = await api<Listing>(`/listings/${id}`); setItem(listing);
    api<{reservation: Booking}>(`/listings/${id}/reservation`).then(x => setBooking(x.reservation)).catch(() => {});
  }, [id]);
  useEffect(() => { refresh().catch(e => setError(e.message)); api<User>("/users/me").then(setUser).catch(() => {}); }, [refresh]);
  async function action(path: string, body?: unknown, method = "POST") {
    setBusy(true); setError(""); setMessage("");
    try { await api(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }); setMessage("ดำเนินการเรียบร้อย"); await refresh(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function sendImage() {
    if (!upload) return;
    setBusy(true); setError("");
    try { const form = new FormData(); form.set("file", upload); await api(`/listings/${id}/images`, { method: "POST", body: form }); await refresh(); setUpload(null); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  if (!item) return <main className="page">{error ? <p className="alert">{error}</p> : "กำลังโหลดสินค้า..."}</main>;
  const seller = user?.id === item.seller_id;
  const buyer = !!user && !seller;
  const canReview = buyer && booking?.buyer_id === user?.id && booking?.status === "completed";
  return <main className="page"><Link href="/" className="small hover:text-orange-600">← กลับไปหน้าสินค้า</Link>
    <div className="mt-6 grid gap-8 md:grid-cols-[1.15fr_1fr]">
      <div><div className="panel flex aspect-[5/4] items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 to-slate-100">
        {item.images.length ? <img alt={item.title} src={item.images[0]} className="h-full w-full object-contain"/> : <span className="text-8xl">📦</span>}</div>
        {item.images.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2">{item.images.slice(1).map((src, i) => <img key={i} src={src} alt={`รูปสินค้า ${i+2}`} className="aspect-square rounded-lg object-cover"/>)}</div>}
        {seller && item.images.length < 10 && <div className="panel mt-4 flex flex-wrap items-center gap-3 p-4"><input aria-label="เพิ่มรูปภาพ" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setUpload(e.target.files?.[0] || null)}/><button disabled={!upload || busy} onClick={sendImage} className="btn-outline flex items-center gap-2"><Upload size={16}/>เพิ่มรูป</button></div>}
      </div>
      <div><span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{item.category}</span>
        <h1 className="mt-4 text-3xl font-black leading-tight">{item.title}</h1><div className="mt-4 text-4xl font-black text-orange-600">{money(item.price)}</div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-slate-100 px-3 py-2">{item.condition === "new" ? "มือหนึ่ง" : "มือสอง"} • {item.condition_percent}%</span><span className="rounded-full bg-slate-100 px-3 py-2">{statusThai[item.status]}</span></div>
        <div className="panel my-6 p-5"><div className="small mb-2">รายละเอียดสินค้า</div><p className="whitespace-pre-wrap leading-7">{item.description}</p>
          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600"><MapPin size={18} className="text-orange-500"/> นัดรับ: {item.pickup_location}</div></div>
        <div className="panel mb-5 flex items-center gap-3 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl">👩🏻‍🎓</div><div><div className="flex items-center gap-2 font-bold">{item.seller_name}{item.seller_verified && <ShieldCheck size={17} className="text-blue-600"/>}</div><div className="small">ผู้ขาย • {item.seller_rating ? `⭐ ${item.seller_rating}/5` : "ยังไม่มีรีวิว"}</div></div></div>
        {error && <div className="alert mb-3">{error}</div>}{message && <div className="success mb-3">{message}</div>}
        {!user && <Link href="/login" className="btn block text-center">เข้าสู่ระบบเพื่อจองหรือแชต</Link>}
        {buyer && <div className="grid gap-3 sm:grid-cols-2">
          {item.status === "available" && <button disabled={busy} className="btn" onClick={() => action(`/listings/${id}/reserve`)}>จองสินค้านี้</button>}
          {booking?.buyer_id === user?.id && booking.status === "reserved" && <button className="btn-outline" disabled={busy} onClick={() => action(`/listings/${id}/cancel`)}>ยกเลิกการจอง</button>}
          <button className="btn-outline flex items-center justify-center gap-2" onClick={() => router.push(`/messages?listing=${id}&partner=${item.seller_id}`)}><MessageCircle size={18}/>แชตกับผู้ขาย</button>
          <button disabled={busy} className="btn-outline flex items-center justify-center gap-2" onClick={() => action(`/listings/${id}/favorite`)}><Heart size={17}/>บันทึกสินค้า</button>
          <button className="btn-outline" onClick={() => { const reason = prompt("เหตุผลในการรายงานสินค้า (อย่างน้อย 10 ตัวอักษร)"); if (reason) action("/reports", { listing_id: item.id, reason }); }}>รายงานสินค้า</button>
        </div>}
        {seller && <div className="grid gap-3 sm:grid-cols-2">
          {item.status === "reserved" && <><button className="btn" disabled={busy} onClick={() => action(`/listings/${id}/complete`)}>ยืนยันขายเสร็จ</button><button className="btn-outline" disabled={busy} onClick={() => action(`/listings/${id}/cancel`)}>ยกเลิกการจอง</button></>}
          {booking?.buyer_id && <Link className="btn-outline text-center" href={`/messages?listing=${id}&partner=${booking.buyer_id}`}>แชตกับผู้จอง</Link>}
          {item.status !== "sold" && <button className="btn-outline" disabled={busy} onClick={() => {
            const price = prompt("แก้ไขราคาสินค้า (บาท)", String(item.price));
            if (price && Number(price) > 0) action(`/listings/${id}`, { price: Number(price) }, "PATCH");
          }}>แก้ไขราคา</button>}
          <button className="btn-outline !text-rose-700" disabled={busy} onClick={() => { if (confirm("ซ่อนประกาศนี้หรือไม่")) action(`/listings/${id}`, undefined, "DELETE"); }}>ลบประกาศ</button>
        </div>}
        {canReview && <div className="panel mt-6 p-5"><h2 className="mb-4 font-bold">รีวิวผู้ขายหลังซื้อขายเสร็จ</h2><select className="field mb-3" value={review.stars} onChange={e => setReview(p => ({...p, stars: Number(e.target.value)}))}>{[5,4,3,2,1].map(s => <option key={s} value={s}>{"⭐".repeat(s)} ({s} ดาว)</option>)}</select>
          <textarea className="field mb-3" minLength={3} placeholder="ความประทับใจในการซื้อขาย" value={review.content} onChange={e => setReview(p => ({...p,content:e.target.value}))}/>
          <button className="btn flex items-center gap-2" disabled={busy || review.content.length < 3} onClick={() => action("/reviews", { reservation_id: booking!.id, ...review })}><Star size={16}/>ส่งรีวิว</button></div>}
      </div></div>
  </main>;
}
