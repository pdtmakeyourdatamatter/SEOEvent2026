// หน้าแรก: ชื่อบริษัทนี้ถูกใช้แล้วหรือยัง
import { guard, roleOf, send, readBody, normName, suggestName, takenNames } from '../lib/server.js';

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  const b = readBody(req);
  if (!roleOf(b.code)) return send(res, 401, { error: 'รหัสเข้าใช้งานไม่ถูกต้อง กรุณาโหลดหน้าใหม่แล้วใส่รหัสอีกครั้ง' });
  const company = String(b.company || '').trim().slice(0, 200);
  if (!company) return send(res, 400, { error: 'กรุณากรอกชื่อบริษัท' });
  try {
    const taken = await takenNames();
    if (taken.has(normName(company))) return send(res, 200, { taken: true, suggestion: suggestName(company, taken) });
    send(res, 200, { taken: false });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'ตรวจชื่อบริษัทไม่สำเร็จ ลองใหม่อีกครั้ง' });
  }
}
