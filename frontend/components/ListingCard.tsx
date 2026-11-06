import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { Listing, money, statusThai } from "@/lib/api";

export default function ListingCard({ item }: { item: Listing }) {
  return <Link href={`/listings/${item.id}`} className="panel group block overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(132,66,19,.12)]">
    <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff0dd] via-[#fffaf4] to-[#f7dcbc]">
      {item.images?.[0] ? <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        : <div className="text-center"><span className="text-5xl">📦</span><p className="mt-2 text-sm text-[#b08c6a]">รูปภาพสินค้า</p></div>}
      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${item.status === "available" ? "bg-[#ecf8ef] text-[#32704c]" : "bg-white/90 text-[#785d47]"}`}>{statusThai[item.status] || item.status}</span>
    </div><div className="p-5"><div className="mb-2 text-xs font-medium text-[#b65a17]">{item.category}</div>
      <h3 className="line-clamp-2 min-h-[44px] font-semibold text-[#322217] group-hover:text-[#bd5f13]">{item.title}</h3>
      <div className="mt-2 text-xl font-semibold tracking-tight text-[#2a1a10]">{money(item.price)}</div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#8c7563]"><MapPin size={13}/>{item.pickup_location}</div>
      <div className="mt-4 flex items-center gap-1.5 border-t border-[#f3e4d5] pt-3 text-xs text-[#8c7563]">{item.seller_name}{item.seller_verified && <ShieldCheck className="text-[#c4671f]" size={15}/>}</div>
    </div></Link>;
}
