-- AlterTable
ALTER TABLE "Questionario" ADD COLUMN "codigoAcesso" TEXT;

-- Backfill: gera código de 6 caracteres (sem I, O, 0, 1) para questionários existentes
DO $$
DECLARE
  rec RECORD;
  novo TEXT;
  alfabeto TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INT;
BEGIN
  FOR rec IN SELECT id FROM "Questionario" WHERE "codigoAcesso" IS NULL LOOP
    LOOP
      novo := '';
      FOR i IN 1..6 LOOP
        novo := novo || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM "Questionario" WHERE "codigoAcesso" = novo
      );
    END LOOP;
    UPDATE "Questionario" SET "codigoAcesso" = novo WHERE id = rec.id;
  END LOOP;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "Questionario_codigoAcesso_key" ON "Questionario"("codigoAcesso");
