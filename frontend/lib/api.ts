export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Listing {
  id: number; seller_id: number; seller_name: string; seller_verified: boolean;
  seller_rating: number | null; title: string; description: string; price: number;
  category: string; condition: "new" | "used"; condition_percent: number;
  pickup_location: string; status: string; images: string[]; created_at: string;
}
export interface User {
  id: number; email: string; display_name: string; verified: boolean;
  avatar_url: string | null; phone: string | null; line_id: string | null;
  faculty: string | null; pickup_zone: string | null; seller_rating: number | null;
  is_admin: boolean;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
  if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options, credentials: "include", headers, cache: "no-store",
    });
  } catch {
    throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่า Backend เปิดอยู่");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail = data.detail;
    throw new Error(typeof detail === "string" ? detail : response.status === 401
      ? "กรุณาเข้าสู่ระบบก่อน" : `เกิดข้อผิดพลาด (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const json = (value: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(value) });
export const money = (price: number) => new Intl.NumberFormat("th-TH").format(price) + " ฿";
export const categories = ["หนังสือ/ชีทเรียน", "ไอที/อิเล็กทรอนิกส์", "เครื่องแต่งกาย/ชุดนักศึกษา", "อุปกรณ์หอพัก", "อื่น ๆ"];
export const locations = ["ตึก ECC", "โรงอาหารพระเทพ", "คณะวิศวกรรมศาสตร์", "หอพักสถาบัน", "คณะเทคโนโลยีสารสนเทศ", "อื่น ๆ"];
export const statusThai: Record<string, string> = {
  available: "พร้อมขาย", reserved: "ติดจอง", sold: "ขายแล้ว", removed: "ระงับประกาศ",
};
