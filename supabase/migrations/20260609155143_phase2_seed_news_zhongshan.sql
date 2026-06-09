-- ============================================================
-- Seed: the single existing 中山開幕 announcement from news.html.
-- No invented announcements. §九 + 中山「敬請期待」 status still apply.
-- author_id := the single admin (profiles.id = auth.users.id), if present.
-- Idempotent: skip if a row with this title already exists.
-- ============================================================
insert into public.news (title, body, clinic, date, image_path, status, author_id, published_at)
select
  '中山大豐院區・2026 年 10 月開幕・敬請期待',
  '大豐耳鼻喉科第四個據點——中山大豐院區，預計於 2026 年 10 月在臺北市中山區開幕。我們將延續一貫的耳鼻喉與睡眠健康照護，陪伴更多家庭。詳細門診時間與開幕資訊將於近期陸續公布，敬請期待。',
  'zhongshan',
  '2026-06-01',
  null,
  'published',
  (select id from public.profiles where role = 'admin' and active order by created_at limit 1),
  '2026-06-01T00:00:00+08:00'
where not exists (
  select 1 from public.news where title = '中山大豐院區・2026 年 10 月開幕・敬請期待'
);
