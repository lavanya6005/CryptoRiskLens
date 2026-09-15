/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - Added the required column `buyPrice` to the `holdings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "holdings" ADD COLUMN     "buyPrice" DECIMAL(20,8) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role";
