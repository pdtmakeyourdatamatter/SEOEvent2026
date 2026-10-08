// ตรวจรหัสจาก Pop up: ผู้เข้าร่วม หรือ Admin
import { guard, roleOf, sleep, send, readBody } from '../lib/server.js';

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  const { code } = readBody(req);
  const role = roleOf(code);
  if (!role) await sleep(800); // ชะลอการเดารหัส
  send(res, 200, { role });
}
