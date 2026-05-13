-- Add lifecycle status to skills (active → deprecated → deleted)
-- Inspired by the MCP registry's active/deprecated/deleted status model.

create type skill_status as enum ('active', 'deprecated', 'deleted');

alter table skills
  add column status         skill_status not null default 'active',
  add column status_message text;

-- Filter active-only by default in the index (deleted skills are hidden)
create index skills_status_idx on skills (status);

-- Extend public read policy to allow filtering by status
-- (no change needed — the existing "public read" policy already covers all rows;
--  filtering is applied at query time in the edge function)
