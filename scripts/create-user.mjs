import { PrismaClient } from "../app/generated/prisma/index.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/create-user.mjs <email> <password>");
  process.exit(1);
}

const prisma = new PrismaClient();

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.error(`User ${email} already exists.`);
  await prisma.$disconnect();
  process.exit(1);
}

const password_hash = await bcrypt.hash(password, 12);
const user = await prisma.user.create({
  data: { id: crypto.randomUUID(), email, password_hash },
});

console.log(`Created user: ${user.email} (${user.id})`);
await prisma.$disconnect();
