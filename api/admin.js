// หน้า Admin: ดึงคำตอบทั้งหมด / บันทึกโลโก้และ Recommendation
import { guard, roleOf, sleep, send, readBody, db } from '../lib/server.js';

const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  const b = readBody(req);
  if (roleOf(b.key) !== 'admin') {
    await sleep(800);
    return send(res, 401, { error: 'รหัส Admin ไม่ถูกต้อง' });
  }

  if (b.action === 'list') {
    const { data, error } = await db
      .from('submissions')
      .select('id, company, website, contact_name, logo_data, recommendation, recommendation_updated_at, created_at, answers(stage, finding, output)')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return send(res, 500, { error: 'โหลดข้อมูลไม่สำเร็จ' }); }

    const rows = data.map((s) => {
      const answers = {};
      let answered = 0;
      for (const a of s.answers || []) {
        answers[a.stage] = { finding: a.finding || '', output: a.output || '' };
        if ((a.finding || '').trim() || (a.output || '').trim()) answered++;
      }
      return {
        id: s.id,
        company: s.company,
        website: s.website || '',
        name: s.contact_name || '',
        createdAt: s.created_at,
        updatedAt: s.created_at,
        answered,
        answers,
        logo: s.logo_data || '',
        recommendation: s.recommendation || '',
        recUpdatedAt: s.recommendation_updated_at || '',
      };
    });
    const ref = (process.env.SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/);
    return send(res, 200, { rows, sheetUrl: ref ? `https://supabase.com/dashboard/project/${ref[1]}/editor` : '' });
  }

  if (b.action === 'notes') {
    const id = String(b.id || '');
    if (!UUID_RE.test(id)) return send(res, 400, { error: 'ไม่พบคำตอบของบริษัทนี้' });
    const patch = {};
    if (b.logo !== undefined) {
      const logo = String(b.logo || '');
      if (logo && (!LOGO_RE.test(logo) || logo.length > 55000)) return send(res, 400, { error: 'ไฟล์โลโก้ไม่ถูกต้องหรือใหญ่เกินไป' });
      patch.logo_data = logo || null;
    }
    const now = new Date().toISOString();
    if (b.recommendation !== undefined) {
      patch.recommendation = String(b.recommendation || '').slice(0, 20000);
      patch.recommendation_updated_at = now;
    }
    if (!Object.keys(patch).length) return send(res, 400, { error: 'ไม่มีข้อมูลให้บันทึก' });

    const { data, error } = await db.from('submissions').update(patch).eq('id', id).select('id');
    if (error) { console.error(error); return send(res, 500, { error: 'บันทึกไม่สำเร็จ' }); }
    if (!data || !data.length) return send(res, 404, { error: 'ไม่พบคำตอบของบริษัทนี้' });
    return send(res, 200, { ok: true, updatedAt: now });
  }

  send(res, 400, { error: 'ไม่รู้จักคำสั่งนี้' });
}
