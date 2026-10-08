// โค้ดส่วนกลางที่ API ทุกตัวใช้ร่วมกัน (ทำงานบน server ของ Vercel เท่านั้น)
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

export const db = url && secret
  ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export function roleOf(code) {
  const c = String(code || '').trim();
  const admin = String(process.env.ADMIN_CODE || '').trim();
  const attendee = String(process.env.ATTENDEE_CODE || '').trim();
  if (!c) return null;
  if (admin && c === admin) return 'admin';
  if (attendee && c === attendee) return 'attendee';
  return null;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function normName(s) {
  return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

// Company A → Company A 1 → Company A 2 ... (ถ้ามีเลขท้ายอยู่แล้ว นับต่อจากชื่อหลัก)
export function suggestName(company, taken) {
  const base = String(company).trim().replace(/\s+/g, ' ').replace(/\s\d+$/, '');
  let n = 1;
  while (taken.has(normName(base + ' ' + n))) n++;
  return base + ' ' + n;
}

export async function takenNames() {
  const { data, error } = await db.from('submissions').select('company_key');
  if (error) throw error;
  return new Set(data.map((r) => r.company_key));
}

export function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

export function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  return b && typeof b === 'object' ? b : {};
}

// ตรวจพื้นฐานที่ทุก API ต้องผ่าน
export function guard(req, res) {
  if (req.method !== 'POST') { send(res, 405, { error: 'Method not allowed' }); return false; }
  if (!db) { send(res, 500, { error: 'ยังไม่ได้ตั้งค่า SUPABASE_URL / SUPABASE_SECRET_KEY ใน Vercel' }); return false; }
  if (!process.env.ATTENDEE_CODE || !process.env.ADMIN_CODE) {
    send(res, 500, { error: 'ยังไม่ได้ตั้งค่า ATTENDEE_CODE / ADMIN_CODE ใน Vercel' }); return false;
  }
  return true;
}
