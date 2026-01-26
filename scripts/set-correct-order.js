const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setCorrectOrder() {
    try {
        console.log('\n🔧 Setting correct sortOrder for workflows...\n');

        // Urutan yang benar berdasarkan gambar:
        // 1. Arsenal (no: 1) - id: 14
        // 2. Juara UCL (sub) - id: 15
        // 3. Arsenal (no: 2) - id: 16
        // 4. Juara PL (sub) - id: 17

        const correctOrder = [
            { id: 14, sortOrder: 0, name: 'Arsenal (no: 1)' },
            { id: 15, sortOrder: 1, name: 'Juara UCL (sub)' },
            { id: 16, sortOrder: 2, name: 'Arsenal (no: 2)' },
            { id: 17, sortOrder: 3, name: 'Juara PL (sub)' }
        ];

        for (const item of correctOrder) {
            await prisma.workflow.update({
                where: { id: item.id },
                data: { sortOrder: item.sortOrder }
            });
            console.log(`✅ ${item.sortOrder}. ${item.name} - sortOrder set to ${item.sortOrder}`);
        }

        console.log('\n✨ All workflows updated! Refresh your browser to see the correct order.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setCorrectOrder();
