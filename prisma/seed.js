const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log('⚠️  Note: User accounts should be imported from PLN database by DevOps');

  // Seed Master PIC
  const pics = ['Ilma', 'Bella', 'Dhea', 'Iqbal', 'Aca', 'Gisda', 'Agung', 'Azka', 'Bu TL Anza', '(ALL)', '(MIX)', 'Helwa', 'Vrian'];
  for (const name of pics) {
    await prisma.masterPIC.upsert({
      where: { name },
      update: {},
      create: { name, email: `${name.toLowerCase().replace(' ', '.')}@pln.co.id` },
    });
  }
  console.log('✅ Master PIC seeded');

  // Seed Master Branch
  const branches = ["Aplikasi Digital", "Aset", "Co-Branding", "Contact Center", "Content", "DSA", "E Score", "E Transport", "IoT EV", "Lisensi", "SaaS", "Smart System", "Start Up", "VPP PVR"];
  for (const name of branches) {
    await prisma.masterBranch.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Master Branch seeded');

  // Seed Master Prioritas
  const prioritas = ['High', 'Medium', 'Low', 'Done'];
  for (const name of prioritas) {
    await prisma.masterPrioritas.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Master Prioritas seeded');

  // Seed Master Status
  const statuses = ['Not Started', 'On Progress', 'Done', 'Not Required', 'Planning', 'Pending', 'Cancelled'];
  for (const name of statuses) {
    await prisma.masterStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Master Status seeded');

  // Seed Master Kode
  const kodes = ['BAK', 'MoU', 'NDA', 'Ops', 'PKS', 'Rekon'];
  for (const name of kodes) {
    await prisma.masterKode.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Master Kode seeded');

  // Seed Master BnP
  const bnps = ['Ilma', 'Bella', 'Dhea', 'Iqbal', 'Aca', 'Gisda', 'Agung', 'Azka', 'Bu TL Anza', '(ALL)', '(MIX)', 'Helwa'];
  for (const name of bnps) {
    await prisma.masterBnP.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Master BnP seeded');

  // Seed Master SO
  const sos = ['Ilma', 'Bella', 'Dhea', 'Iqbal', 'Aca', 'Gisda', 'Agung', 'Azka', 'Bu TL Anza', '(ALL)', '(MIX)', 'Helwa'];
  for (const name of sos) {
    await prisma.masterSO.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Master SO seeded');

  // Seed Master Activity Type
  const activityTypes = ['Action Plan', 'Action Update', 'Meeting Plan', 'Meeting Update'];
  for (const name of activityTypes) {
    await prisma.masterActivityType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Master Activity Type seeded');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
