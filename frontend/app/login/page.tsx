"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, MailCheck, ShieldCheck } from "lucide-react";
import { api, json } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (!sent) {
        const res = await api<{message: string; dev_otp?: string}>("/auth/request-otp", json({ email }));
        setSent(true); setDevCode(res.dev_otp || "");
      } else {
        await api("/auth/verify-otp", json({ email, otp: code }));
        window.dispatchEvent(new Event("authChanged")); router.push("/profile"); router.refresh();
      }
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="page flex min-h-[70vh] items-center justify-center"><div className="panel w-full max-w-[460px] p-8 md:p-10">
    <div className="mb-5 inline-flex rounded-xl bg-orange-100 p-3 text-orange-600">{sent ? <MailCheck size={28}/> : <LockKeyhole size={28}/>}</div>
    <h1 className="mb-2 text-3xl font-black">{sent ? "ยืนยันรหัส OTP" : "ยินดีต้อนรับกลับ"}</h1>
    <p className="small mb-7">{sent ? `กรอกรหัส 6 หลักที่ส่งไปยัง ${email}` : "เข้าสู่ระบบด้วยอีเมลสถาบัน @kmitl.ac.th"}</p>
    <form onSubmit={submit} className="space-y-4">
      {!sent ? <div><label className="label">อีเมลสถาบัน</label><input required className="field" type="email" placeholder="student@kmitl.ac.th" value={email} onChange={e => setEmail(e.target.value)}/></div> :
      <div><label className="label">รหัส OTP (6 หลัก)</label><input required minLength={6} maxLength={6} inputMode="numeric" className="field text-center text-2xl tracking-widest" placeholder="000000" value={code} onChange={e => setCode(e.target.value)}/></div>}
      {devCode && <div className="success text-sm">โหมดทดสอบในเครื่อง: OTP คือ <strong>{devCode}</strong> (โหมด Production จะไม่แสดงรหัส)</div>}
      {error && <div className="alert text-sm">{error}</div>}
      <button className="btn w-full" type="submit" disabled={busy}>{busy ? "กำลังดำเนินการ..." : sent ? "ยืนยันและเข้าสู่ระบบ" : "ส่งรหัส OTP"}</button>
      {sent && <button type="button" className="w-full text-sm font-semibold text-slate-500 hover:text-orange-600" onClick={() => { setSent(false); setCode(""); }}>เปลี่ยนอีเมล</button>}
    </form>
    <p className="mt-7 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500"><ShieldCheck className="text-green-600" size={18}/> เปิดให้ใช้เฉพาะอีเมลสถาบัน สจล.</p>
  </div></main>;
}
