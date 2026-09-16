-- AlterTable
ALTER TABLE "Questionario" ADD COLUMN "resultadosVisiveis" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Questionario" ALTER COLUMN "anonimo" SET DEFAULT true;