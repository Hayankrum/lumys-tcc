-- CreateTable
CREATE TABLE "Denuncia" (
    "id" SERIAL NOT NULL,
    "motivo" TEXT NOT NULL,
    "detalhes" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionarioId" INTEGER NOT NULL,
    "denuncianteId" INTEGER,

    CONSTRAINT "Denuncia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Denuncia_questionarioId_idx" ON "Denuncia"("questionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Denuncia_questionarioId_denuncianteId_key" ON "Denuncia"("questionarioId", "denuncianteId");

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_questionarioId_fkey" FOREIGN KEY ("questionarioId") REFERENCES "Questionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_denuncianteId_fkey" FOREIGN KEY ("denuncianteId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;