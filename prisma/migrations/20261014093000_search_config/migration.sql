-- Configuration de recherche française insensible aux accents :
-- les mots passent par « unaccent » puis par la racinisation française.
-- Les extraits (ts_headline) gardent ainsi leurs accents d'origine.
CREATE TEXT SEARCH CONFIGURATION orbit_fr (COPY = french);
ALTER TEXT SEARCH CONFIGURATION orbit_fr
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem;

DROP INDEX IF EXISTS "Issue_search_idx";
ALTER TABLE "Issue" DROP COLUMN "search";
ALTER TABLE "Issue" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('orbit_fr', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('orbit_fr', orbit_doc_text("descriptionJson")), 'B')
) STORED;
CREATE INDEX "Issue_search_idx" ON "Issue" USING GIN ("search");

DROP FUNCTION IF EXISTS orbit_unaccent(text);
