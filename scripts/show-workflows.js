const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showWorkflows() {
    try {
        const workflows = await prisma.workflow.findMany({
            where: { pageId: 1 },
            orderBy: [
                { sortOrder: 'asc' },
                { id: 'asc' }
            ]
        });

        console.log('\n📋 Current workflows for page 1:');
        workflows.forEach((w, i) => {
            console.log(`${i}. ID:${w.id} | No:${w.no} | Activity:"${w.activity}" | sortOrder:${w.sortOrder}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

showWorkflows();
