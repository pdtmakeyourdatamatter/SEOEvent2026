-- =====================================================================
--  SEO Business Growth Workshop · Predictive
--  วางทั้งไฟล์นี้ใน Supabase → SQL Editor → New query แล้วกด Run ครั้งเดียว
-- =====================================================================

-- 1) บริษัทที่ส่งคำตอบ (1 แถว = 1 บริษัท)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(trim(company)) between 1 and 200),
  -- ใช้กันชื่อซ้ำ: ไม่สนตัวพิมพ์เล็กใหญ่และช่องว่างเกิน
  company_key text generated always as
    (lower(regexp_replace(trim(company), '\s+', ' ', 'g'))) stored,
  website text,
  contact_name text,
  logo_data text check (logo_data is null or char_length(logo_data) < 60000),  -- โลโก้ (ย่อขนาดแล้ว)
  recommendation text,                                                          -- Admin ใส่ตอนคุย 1:1
  recommendation_updated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint submissions_company_unique unique (company_key)
);

-- 2) คำตอบรายข้อ (1 บริษัท = 18 แถว)
create table if not exists public.answers (
  submission_id uuid not null references public.submissions(id) on delete cascade,
  stage smallint not null check (stage between 1 and 18),
  finding text not null default '',
  output  text not null default '',
  primary key (submission_id, stage)
);

-- 3) ชื่อ Stage ไว้อ่านง่ายเวลาเปิดดูใน Supabase
create table if not exists public.stages (
  stage smallint primary key,
  phase text not null,
  stage_name text not null,
  output_name text not null
);
insert into public.stages (stage, phase, stage_name, output_name) values
 (1,'วางเป้าหมาย','Business Goal','SEO Business Goal'),
 (2,'วางเป้าหมาย','Customer Journey','Search Journey Map'),
 (3,'วางเป้าหมาย','Search Demand','Search Opportunity'),
 (4,'เข้าใจการค้นหา','Search Intent','Intent Map'),
 (5,'เข้าใจการค้นหา','Search Visibility','SERP Visibility Map'),
 (6,'เข้าใจการค้นหา','Competitor Gap','Competitor Gap'),
 (7,'เข้าใจการค้นหา','Content Gap','Content Opportunity'),
 (8,'Content & Experience','Content Quality','Content Gap Score'),
 (9,'Content & Experience','AI Search','AI Visibility Check'),
 (10,'Content & Experience','Website Experience','Intent-to-Experience'),
 (11,'Content & Experience','Technical Foundation','Technical Opportunity Snapshot'),
 (12,'Business Impact','Conversion','SEO Conversion Map'),
 (13,'Business Impact','Lead Quality','Lead Quality Funnel'),
 (14,'Business Impact','Attribution','SEO Attribution Map'),
 (15,'Business Impact','Revenue','SEO Revenue Model'),
 (16,'Business Impact','ROI','SEO ROI Model'),
 (17,'จัดลำดับ & วัดผล','Prioritization','SEO Priority Matrix'),
 (18,'จัดลำดับ & วัดผล','Measurement Loop','SEO Growth Loop')
on conflict (stage) do nothing;

-- 4) ปิดไม่ให้หน้าเว็บอ่าน/เขียนตรง
--    (ไม่มี policy = ไม่มีใครเข้าถึงได้ ยกเว้น API บน Vercel ที่ใช้ Secret key)
alter table public.submissions enable row level security;
alter table public.answers     enable row level security;
alter table public.stages      enable row level security;

-- 5) ส่งคำตอบแบบ "ครบหรือไม่บันทึกเลย" และต้องตอบครบ 18 ข้อ
create or replace function public.submit_workshop(
  p_company text, p_website text, p_contact text, p_answers jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  n int;
begin
  select count(distinct (a->>'stage')::int) into n
  from jsonb_array_elements(p_answers) a
  where (a->>'stage')::int between 1 and 18
    and (coalesce(trim(a->>'finding'), '') <> '' or coalesce(trim(a->>'output'), '') <> '');
  if n < 18 then
    raise exception 'INCOMPLETE';
  end if;

  insert into submissions (company, website, contact_name)
  values (trim(p_company), nullif(trim(p_website), ''), nullif(trim(p_contact), ''))
  returning id into new_id;          -- ชื่อซ้ำ → error 23505 แล้ว API จะแนะนำชื่อใหม่

  insert into answers (submission_id, stage, finding, output)
  select new_id, (a->>'stage')::smallint, coalesce(a->>'finding', ''), coalesce(a->>'output', '')
  from jsonb_array_elements(p_answers) a
  where (a->>'stage')::int between 1 and 18;

  return new_id;
end $$;

revoke execute on function public.submit_workshop(text, text, text, jsonb) from public, anon, authenticated;
grant  execute on function public.submit_workshop(text, text, text, jsonb) to service_role;

-- 6) ตารางสรุปสำหรับเปิดดู/Export ใน Supabase (1 แถวต่อบริษัท)
create or replace view public.submission_overview with (security_invoker = true) as
select s.created_at, s.company, s.website, s.contact_name,
       count(a.*) filter (where trim(a.finding) <> '' or trim(a.output) <> '') as answered,
       s.recommendation, s.id
from public.submissions s
left join public.answers a on a.submission_id = s.id
group by s.id
order by s.created_at desc;
