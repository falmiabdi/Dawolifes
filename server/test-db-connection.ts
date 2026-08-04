import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connection successful');
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
