"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, PackagePlus } from "lucide-react";
import { api, categories, Listing, locations } from "@/lib/api";

export default function SellPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", price: "", category: categories[0],
    condition: "used", condition_percent: "90", pickup_location: locations[0] });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm(p => ({ ...p, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const item = await api<Listing>("/listings", { method: "POST", body: JSON.stringify({
        ...form, price: Number(form.price), condition_percent: Number(form.condition_percent),
      }) });
      for (const file of files) {
        const data = new FormData(); data.set("file", file);
        await api(`/listings/${item.id}/images`, { method: "POST", body: data });
      }
      router.push(`/listings/${item.id}`);
    } catch (e) { setError((e as Error).message + " หากสร้างประกาศแล้ว สามารถเข้าหน้าสินค้าเพื่ออัปโหลดรูปต่อได้"); }
    finally { setSaving(false); }
  }
  return <main className="page max-w-[800px]"><div className="mb-7"><span className="text-xs font-bold uppercase tracking-widest text-orange-600">Start selling</span><h1 className="mt-2 text-3xl font-black">ลงขายสินค้าของคุณ</h1><p className="small mt-2">ใส่รายละเอียด → เพิ่มรูปภาพ → กดเผยแพร่</p></div>
    <form onSubmit={submit} className="panel space-y-6 p-6 md:p-9">
      <div><h2 className="mb-4 text-lg font-bold">01 / รายละเอียดสินค้า</h2><div className="space-y-4">
        <div><label className="label">ชื่อสินค้า *</label><input required minLength={3} maxLength={150} className="field" value={form.title} onChange={e => update("title", e.target.value)} placeholder="เช่น หนังสือ Python สภาพดี"/></div>
        <div><label className="label">รายละเอียดสินค้า *</label><textarea required minLength={5} maxLength={5000} className="field min-h-28" value={form.description} onChange={e => update("description", e.target.value)} placeholder="อธิบายสภาพ อุปกรณ์เสริม จุดเด่น..."/></div>
        <div className="grid gap-4 md:grid-cols-2"><div><label className="label">ราคา (บาท) *</label><input required type="number" min="1" max="10000000" className="field" value={form.price} onChange={e => update("price", e.target.value)}/></div>
        <div><label className="label">หมวดหมู่</label><select className="field" value={form.category} onChange={e => update("category", e.target.value)}>{categories.map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label className="label">สภาพสินค้า</label><select className="field" value={form.condition} onChange={e => update("condition", e.target.value)}><option value="used">มือสอง</option><option value="new">มือหนึ่ง</option></select></div>
        <div><label className="label">สภาพ (%)</label><input type="number" min="1" max="100" className="field" value={form.condition_percent} onChange={e => update("condition_percent", e.target.value)}/></div></div>
        <div><label className="label">จุดนัดรับ</label><select className="field" value={form.pickup_location} onChange={e => update("pickup_location", e.target.value)}>{locations.map(x => <option key={x}>{x}</option>)}</select></div>
      </div></div>
      <div className="border-t border-slate-100 pt-6"><h2 className="mb-4 text-lg font-bold">02 / รูปภาพสินค้า</h2>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center hover:border-orange-300"><ImagePlus size={33} className="text-orange-500"/><strong>เลือกรูปภาพสินค้า</strong><span className="small">สูงสุด 10 รูป JPEG / PNG / WEBP ไม่เกินรูปละ 5 MB</span>
          <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => setFiles(Array.from(e.target.files || []).slice(0, 10))}/></label>
        {files.length > 0 && <p className="mt-3 text-sm text-green-700">เลือกรูปภาพ {files.length} รูปแล้ว</p>}</div>
      {error && <div className="alert">{error}</div>}
      <button disabled={saving} className="btn flex w-full items-center justify-center gap-2"><PackagePlus size={18}/>{saving ? "กำลังสร้างประกาศ..." : "03 / เผยแพร่ประกาศ"}</button>
    </form>
  </main>;
}
