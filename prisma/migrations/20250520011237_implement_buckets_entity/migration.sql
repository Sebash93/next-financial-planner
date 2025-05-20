-- CreateTable
CREATE TABLE "Bucket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Record" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" BIGINT,
    "sheetId" INTEGER NOT NULL,
    "bucketId" INTEGER,
    CONSTRAINT "Record_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Record_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "Bucket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Record" ("amount", "date", "id", "name", "sheetId") SELECT "amount", "date", "id", "name", "sheetId" FROM "Record";
DROP TABLE "Record";
ALTER TABLE "new_Record" RENAME TO "Record";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
