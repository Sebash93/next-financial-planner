/*
  Warnings:

  - You are about to alter the column `endDate` on the `Plan` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `initialDate` on the `Plan` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "initialDate" BIGINT NOT NULL,
    "endDate" BIGINT NOT NULL
);
INSERT INTO "new_Plan" ("endDate", "id", "initialDate", "name") SELECT "endDate", "id", "initialDate", "name" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
