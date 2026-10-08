// ผู้เข้าร่วมกดส่งคำตอบ (ต้องครบ 18 ข้อ และชื่อบริษัทต้องไม่ซ้ำ)
import { guard, roleOf, send, readBody, suggestName, takenNames, db } from '../lib/server.js';

const clip = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  const b = readBody(req);
  if (!roleOf(b.code)) return send(res, 401, { error: 'รหัสเข้าใช้งานไม่ถูกต้อง กรุณาโหลดหน้าใหม่แล้วใส่รหัสอีกครั้ง' });

  const company = clip(b.company, 200);
  if (!company) return send(res, 400, { error: 'กรุณากรอกชื่อบริษัท' });

  const src = b.answers && typeof b.answers === 'object' ? b.answers : {};
  const answers = [];
  let answered = 0;
  for (let i = 1; i <= 18; i++) {
    const a = src[i] || src[String(i)] || {};
    const finding = clip(a.finding, 5000), output = clip(a.output, 1000);
    if (finding || output) answered++;
    answers.push({ stage: i, finding, output });
  }
  if (answered < 18) return send(res, 400, { error: `กรุณาตอบให้ครบทั้ง 18 stages ก่อนส่ง (ตอบแล้ว ${answered} ข้อ)` });

  const { data, error } = await db.rpc('submit_workshop', {
    p_company: company,
    p_website: clip(b.website, 500),
    p_contact: clip(b.name, 200),
    p_answers: answers,
  });

  if (error) {
    if (error.code === '23505') {
      try {
        const taken = await takenNames();
        return send(res, 409, { error: 'DUPLICATE', suggestion: suggestName(company, taken) });
      } catch { return send(res, 409, { error: 'DUPLICATE', suggestion: company + ' 1' }); }
    }
    if (/INCOMPLETE/.test(error.message || '')) return send(res, 400, { error: 'กรุณาตอบให้ครบทั้ง 18 stages ก่อนส่ง' });
    console.error(error);
    return send(res, 500, { error: 'บันทึกไม่สำเร็จ ลองกดส่งอีกครั้ง' });
  }
  send(res, 200, { ok: true, id: data, answered, updatedAt: new Date().toISOString() });
}
