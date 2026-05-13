-- skillpm registry schema
-- One row per named skill (mutable — tracks the latest published version)
create table skills (
  name            text primary key,
  description     text not null,
  current_version text not null,
  digest          text not null,   -- sha256:hex of the latest tarball
  storage_path    text not null,   -- path inside the "artifacts" Storage bucket
  published_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Append-only version history per skill (immutable once inserted)
create table skill_versions (
  id           bigint generated always as identity primary key,
  skill_name   text not null references skills(name),
  version      text not null,
  digest       text not null,
  storage_path text not null,
  published_at timestamptz not null default now(),
  unique (skill_name, version)   -- enforces immutability at the DB level
);

-- Registry-level release snapshots
-- A release captures the state of ALL skills at a point in time.
-- index_json is stored as JSONB so the snapshot is frozen and fast to serve
-- without re-querying skills at request time.
create table releases (
  version     text primary key,
  index_json  jsonb not null,
  released_at timestamptz not null default now()
);

-- Maps which skill versions are included in each release
create table release_skills (
  release_version text not null references releases(version),
  skill_name      text not null,
  skill_version   text not null,
  primary key (release_version, skill_name)
);

-- RLS: public read, no public write (publish function uses service_role which bypasses RLS)
alter table skills        enable row level security;
alter table skill_versions enable row level security;
alter table releases       enable row level security;
alter table release_skills enable row level security;

create policy "public read" on skills         for select using (true);
create policy "public read" on skill_versions for select using (true);
create policy "public read" on releases       for select using (true);
create policy "public read" on release_skills for select using (true);
