"use client";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import AetherFlowHero from "@/components/ui/aether-flow-hero";
import { type LiquidAccordionItem } from "@/components/ui/liquid-glass-accordion";
import MarketplaceFAQ from "@/components/marketplace-faq";
import ListingCard from "@/components/ListingCard";
import GlassSelect from "@/components/ui/glass-select";
import { api, categories, Listing } from "@/lib/api";


const marketplaceFAQ: LiquidAccordionItem[] = [
  {
    id: "access",
    question: "ใครสามารถใช้งาน KMITL Marketplace ได้?",
    answer: "ระบบออกแบบสำหรับนักศึกษาและบุคลากร สจล. โดยใช้อีเมล @kmitl.ac.th เพื่อขอรหัส OTP ยืนยันตัวตน",
  },
  {
    id: "sell",
    question: "ต้องทำอย่างไรถึงจะลงขายสินค้าได้?",
    answer: "เข้าสู่ระบบ แล้วเลือก 'ลงขาย' กรอกข้อมูลสินค้า ราคา รูปภาพ และจุดนัดรับ ก่อนเผยแพร่ประกาศ",
  },
  {
    id: "meeting",
    question: "ผู้ซื้อและผู้ขายนัดรับสินค้าที่ไหน?",
    answer: "ระบุจุดนัดรับภายในบริเวณ สจล. และตกลงรายละเอียดกันผ่านแชต ควรนัดรับในพื้นที่สาธารณะที่ปลอดภัย",
  },
  {
    id: "otp",
    question: "ไม่ได้รับรหัส OTP ต้องทำอย่างไร?",
    answer: "ตรวจอีเมลและโฟลเดอร์สแปมก่อน หากยังไม่พบให้ลองขอรหัสอีกครั้ง โดยการส่งอีเมลจริงขึ้นอยู่กับการตั้งค่า SMTP ของระบบ",
  },
  {
    id: "report",
    question: "หากพบประกาศที่น่าสงสัยต้องทำอย่างไร?",
    answer: "ใช้เมนูรายงานประกาศหรือผู้ใช้งานเพื่อให้ผู้ดูแลตรวจสอบ และหลีกเลี่ยงการโอนเงินหากยังไม่มั่นใจในผู้ขาย",
  },
];

export default function HomePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [filters, setFilters] = useState({ q: "", category: "", condition: "", pickup_location: "", sort: "newest", max_price: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    let active = true;
    api<Listing[]>(`/listings?${params}`).then(data => { if (active) { setItems(data.filter(x => x.status !== "removed")); setError(""); } })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);
  const change = (key: keyof typeof filters, value: string) => { setLoading(true); setFilters(prev => ({ ...prev, [key]: value })); };
  return <main>
    <AetherFlowHero />
    <section className="border-b border-[#f0e1d1] bg-white py-6">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-4 px-6 text-center text-xs font-medium tracking-wide text-[#736051] sm:grid-cols-4">
        <span>CURATED CAMPUS FINDS</span><span>LOCAL PICKUP</span><span>STUDENT COMMUNITY</span><span>BUY & SELL EASILY</span>
      </div>
    </section>
    <div className="page !max-w-[1240px] !pt-20" id="browse">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-3 text-xs font-bold uppercase tracking-[.24em] text-[#c26018]">The campus edit</p>
          <h2 className="text-3xl font-semibold tracking-[-.045em] text-[#2a1a10] md:text-5xl">ค้นพบสิ่งที่ใช่ <span className="font-normal italic text-[#c56a23]">ใกล้ตัวคุณ</span></h2>
          <p className="small mt-4">ค้นหาและเลือกซื้อสินค้าที่เพื่อน ๆ ในมหาวิทยาลัยส่งต่อ</p>
        </div>
        <Link href="/sell" className="inline-flex items-center gap-2 text-sm font-semibold text-[#b45309] hover:text-[#843b0a]">ลงประกาศสินค้า <ArrowUpRight size={17}/></Link>
      </div>
      <div className="liquid-glass-filter mb-10 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] xl:items-center">
        <label className="glass-input relative flex items-center gap-2"><Search size={18} className="shrink-0 text-orange-500"/><input aria-label="ค้นหาสินค้า" className="min-w-0 w-full bg-transparent outline-none" placeholder="ค้นหาสินค้า..." value={filters.q} onChange={e => change("q", e.target.value)} /></label>
        <GlassSelect label="หมวดหมู่" value={filters.category} onChange={value=>change("category",value)} options={[{value:"",label:"ทุกหมวดหมู่"},...categories.map(x=>({value:x,label:x}))]}/>
        <GlassSelect label="สภาพสินค้า" value={filters.condition} onChange={value=>change("condition",value)} options={[{value:"",label:"ทุกสภาพสินค้า"},{value:"new",label:"มือหนึ่ง"},{value:"used",label:"มือสอง"}]}/>
        <input aria-label="จุดนัดรับ" className="glass-input w-full" placeholder="จุดนัดรับ" value={filters.pickup_location} onChange={e => change("pickup_location", e.target.value)}/>
        <input aria-label="ราคาสูงสุด" className="glass-input w-full" type="number" min="0" placeholder="ราคาสูงสุด (฿)" value={filters.max_price} onChange={e => change("max_price", e.target.value)} />
        <GlassSelect label="เรียงลำดับ" value={filters.sort} onChange={value=>change("sort",value)} options={[{value:"newest",label:"มาใหม่ล่าสุด"},{value:"price_asc",label:"ราคาต่ำ → สูง"},{value:"price_desc",label:"ราคาสูง → ต่ำ"}]}/>
      </div>
      {error && <p className="alert mb-5" role="alert">{error}</p>}
      {loading ? <p className="small py-12 text-center" role="status">กำลังโหลดสินค้า...</p> : items.length ?
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map(x => <ListingCard key={x.id} item={x}/>)}</div> :
        <div className="panel flex flex-col items-center gap-3 px-5 py-20 text-center"><SlidersHorizontal className="text-[#c78243]" size={30}/><h3 className="font-bold">ยังไม่มีสินค้าที่ตรงกับคำค้นหา</h3><p className="small">ลองเปลี่ยนตัวกรองหรือเริ่มลงขายสินค้าชิ้นแรก</p></div>}
    </div>
    <section aria-labelledby="faq-heading" className="mt-20 border-t border-[#f0e1d1] bg-[#f8efe6] px-5 py-20 md:py-24">
      <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
        <div className="lg:pt-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-[#bd641e]">HERE TO HELP</p>
          <h2 id="faq-heading" className="text-3xl font-semibold tracking-[-.045em] text-[#2a1a10] md:text-5xl">คำถามที่พบบ่อย<span className="block italic font-normal text-[#c46f2e]">เกี่ยวกับ Marketplace</span></h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#806c5d]">รวมวิธีใช้งานและคำแนะนำสำหรับการซื้อขายภายในชุมชน สจล.</p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <MarketplaceFAQ items={marketplaceFAQ} />
        </div>
      </div>
    </section>
  </main>;
}
