/*
  Warnings:

  - A unique constraint covering the columns `[name,planId]` on the table `Sheet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Sheet_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_name_planId_key" ON "Sheet"("name", "planId");
