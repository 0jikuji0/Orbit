-- La racinisation française empêchait la recherche par préfixe pendant la frappe
-- (« deplacab » ne trouvait pas « déplaçables », indexé sous la racine « deplac »).
-- Nouvelle configuration : mots entiers sans accents, sans racinisation.
CREATE TEXT SEARCH CONFIGURATION orbit_search (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION orbit_search
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;

DROP INDEX IF EXISTS "Issue_search_idx";
ALTER TABLE "Issue" DROP COLUMN "search";
ALTER TABLE "Issue" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('orbit_search', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('orbit_search', orbit_doc_text("descriptionJson")), 'B')
) STORED;
CREATE INDEX "Issue_search_idx" ON "Issue" USING GIN ("search");

DROP TEXT SEARCH CONFIGURATION IF EXISTS orbit_fr;
