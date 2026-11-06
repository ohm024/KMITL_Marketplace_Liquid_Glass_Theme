"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, MessageCircle, Plus, ShoppingBag, UserRound } from "lucide-react";
import { api, User } from "@/lib/api";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const load = () => { api<User>("/users/me").then(setUser).catch(() => setUser(null)); };
    load(); window.addEventListener("authChanged", load);
    return () => window.removeEventListener("authChanged", load);
  }, []);
  return <header className="sticky top-0 z-30 border-b border-[#f1e3d5] bg-white/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-4">
      <Link href="/" className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24160d] text-white"><ShoppingBag size={20} /></span>
        <span className="text-[1.1rem] font-bold tracking-[-.04em] text-[#2a1b12]">KMITL<span className="font-normal text-[#d16d23]">Market</span><span className="ml-1.5 text-[10px] font-semibold tracking-widest text-[#b89a83]">.</span></span></Link>
      <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-[#695447] md:gap-6" aria-label="เมนูหลัก">
        <Link className="hover:text-[#bb5c12]" href="/#browse">ค้นหาสินค้า</Link>
        {user && <><Link title="ข้อความ" aria-label="ข้อความ" href="/messages"><MessageCircle size={19}/></Link><Link title="การแจ้งเตือน" aria-label="การแจ้งเตือน" href="/notifications"><Bell size={19}/></Link></>}
        {user?.is_admin && <Link href="/admin">ผู้ดูแล</Link>}
        <Link href={user ? "/profile" : "/login"} className="flex items-center gap-1.5 hover:text-[#bb5c12]"><UserRound size={17}/>{user ? user.display_name : "เข้าสู่ระบบ"}</Link>
        <ThemeToggle />
        <Link href={user ? "/sell" : "/login"} className="btn flex items-center gap-1 !px-4 !py-2.5"><Plus size={16}/>ลงขาย</Link>
      </nav>
    </div>
  </header>;
}
