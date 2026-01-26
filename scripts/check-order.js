const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixSortOrder() {
    try {
        console.log('\n🔍 Checking workflows for page 1...\n');

        const workflows = await prisma.workflow.findMany({
            where: { pageId: 1 },
            orderBy: [
                { sortOrder: 'asc' },
                { id: 'asc' }
            ]
        });

        console.log('Current order (by sortOrder):');
        workflows.forEach((w, i) => {
            const typeLabel = w.no > 0 ? `MAIN(${w.no})` : 'SUB';
            console.log(`  ${i}. [${typeLabel}] "${w.activity}" | sortOrder:${w.sortOrder} | id:${w.id}`);
        });

        console.log('\n❓ Apakah urutan di atas BENAR?');
        console.log('   Jika TIDAK, urutan yang benar adalah berdasarkan ID (creation order):\n');

        const workflowsByCreation = await prisma.workflow.findMany({
            where: { pageId: 1 },
            orderBy: { id: 'asc' }
        });

        console.log('Order by creation (ID):');
        workflowsByCreation.forEach((w, i) => {
            const typeLabel = w.no > 0 ? `MAIN(${w.no})` : 'SUB';
            console.log(`  ${i}. [${typeLabel}] "${w.activity}" | id:${w.id}`);
        });

        console.log('\n💡 Untuk memperbaiki, jalankan: node scripts/fix-by-creation.js');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndFixSortOrder();
