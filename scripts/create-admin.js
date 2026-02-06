const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@plniconplus.com';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin';

  console.log(`Creating user: ${email}`);
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      name,
      password: hashedPassword,
    },
  });

  console.log('✅ User created/updated:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   ID: ${user.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
