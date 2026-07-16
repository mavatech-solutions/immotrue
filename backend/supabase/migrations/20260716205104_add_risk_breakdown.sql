-- 5-category risk breakdown (0-100 each, higher = more risk), genuinely
-- assessed by the AI per analysis rather than derived from other columns
-- after the fact — some categories (e.g. rechtliches) have no dedicated
-- structured field to derive from at all.
alter table analyses
  add column risk_breakdown jsonb;
