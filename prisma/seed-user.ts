import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create dummy admin user
  const hashedPassword = await bcrypt.hash('123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin123@plniconplus.com' },
    update: {},
    create: {
      email: 'admin123@plniconplus.com',
      name: 'admin123',
      password: hashedPassword,
    },
  });

  console.log('✅ Dummy user created:');
  console.log('   Email: admin123@plniconplus.com');
  console.log('   Password: 123');
  console.log('   User:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
