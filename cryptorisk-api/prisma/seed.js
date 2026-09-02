'use strict';

/**
 * prisma/seed.js — Admin account seeder
 *
 * Creates or updates the designated admin account.
 * Password is read from ADMIN_SEED_PASSWORD in .env — never hardcoded here.
 *
 * Run with:
 *   node prisma/seed.js
 *
 * Or add to package.json:
 *   "prisma": { "seed": "node prisma/seed.js" }
 * then run: npx prisma db seed
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'lavanyasharma6005@gmail.com';
const ADMIN_NAME  = 'Lavanya Sharma';
const BCRYPT_ROUNDS = 12;

async function main() {
  // Read password from environment — never from a hardcoded string in source
  const plainPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!plainPassword) {
    console.error(
      '❌  ADMIN_SEED_PASSWORD is not set in your .env file.\n' +
      '    Add: ADMIN_SEED_PASSWORD=<your-password>'
    );
    process.exit(1);
  }

  console.log(`🌱  Seeding admin account: ${ADMIN_EMAIL}`);

  // Hash the password exactly like every other user in the system
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  // Upsert — if account exists: update role + rehash password.
  //          if account doesn't exist: create it.
  const user = await prisma.user.upsert({
    where:  { email: ADMIN_EMAIL },
    update: { role: 'admin', passwordHash, name: ADMIN_NAME },
    create: { email: ADMIN_EMAIL, name: ADMIN_NAME, passwordHash, role: 'admin' },
  });

  console.log(`✅  Admin account ready — id: ${user.id}, role: ${user.role}`);
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
