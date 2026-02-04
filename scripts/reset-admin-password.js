const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // Hash password 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update user
    const user = await prisma.user.upsert({
      where: { email: 'admin123@plniconplus.com' },
      update: { 
        password: hashedPassword,
        name: 'admin123'
      },
      create: {
        email: 'admin123@plniconplus.com',
        password: hashedPassword,
        name: 'admin123'
      }
    });
    
    console.log('✅ Admin user updated/created:');
    console.log('   Email:', user.email);
    console.log('   Password: admin123');
    console.log('   Hash:', hashedPassword);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
