-- Texte brut d'un document Tiptap : tous les nœuds « text », sans balisage.
-- IMMUTABLE pour pouvoir servir dans une colonne générée.
CREATE OR REPLACE FUNCTION orbit_doc_text(doc jsonb) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT coalesce(string_agg(t #>> '{}', ' '), '')
  FROM jsonb_path_query(doc, 'strict $.**.text') AS t
$$;

-- Recherche plein texte : titre (poids A) + description (poids B), dictionnaire français.
ALTER TABLE "Issue" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('french', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('french', orbit_doc_text("descriptionJson")), 'B')
) STORED;

-- CreateIndex
CREATE INDEX "Issue_search_idx" ON "Issue" USING GIN ("search");

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "actorId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
