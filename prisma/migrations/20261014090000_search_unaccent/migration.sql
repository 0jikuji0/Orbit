-- Recherche insensible aux accents : « deplacable » trouve « déplaçable ».
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() n'est pas IMMUTABLE ; cette version à dictionnaire explicite l'est (usage documenté).
CREATE OR REPLACE FUNCTION orbit_unaccent(text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$
  SELECT public.unaccent('public.unaccent'::regdictionary, $1)
$$;

DROP INDEX IF EXISTS "Issue_search_idx";
ALTER TABLE "Issue" DROP COLUMN "search";
ALTER TABLE "Issue" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('french', orbit_unaccent(coalesce("title", ''))), 'A') ||
  setweight(to_tsvector('french', orbit_unaccent(orbit_doc_text("descriptionJson"))), 'B')
) STORED;
CREATE INDEX "Issue_search_idx" ON "Issue" USING GIN ("search");
