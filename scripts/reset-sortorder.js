const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetSortOrder() {
    try {
        console.log('🔧 Resetting sortOrder for all workflows and daily progress...\n');

        // Get all pages
        const pages = await prisma.page.findMany();

        for (const page of pages) {
            console.log(`\n📄 Page: ${page.pageNumber} - ${page.partnershipName}`);

            // Get workflows for this page, ordered by ID (creation order)
            const workflows = await prisma.workflow.findMany({
                where: { pageId: page.id },
                orderBy: { id: 'asc' }
            });

            console.log(`  Resetting ${workflows.length} workflows...`);
            for (let i = 0; i < workflows.length; i++) {
                await prisma.workflow.update({
                    where: { id: workflows[i].id },
                    data: { sortOrder: i }
                });
                console.log(`    ✅ ${i}. "${workflows[i].activity}" (id:${workflows[i].id}) -> sortOrder: ${i}`);
            }

            // Get daily progress for this page, ordered by ID (creation order)
            const progress = await prisma.dailyProgress.findMany({
                where: { pageId: page.id },
                orderBy: { id: 'asc' }
            });

            console.log(`  Resetting ${progress.length} daily progress...`);
            for (let i = 0; i < progress.length; i++) {
                await prisma.dailyProgress.update({
                    where: { id: progress[i].id },
                    data: { sortOrder: i }
                });
                console.log(`    ✅ ${i}. "${progress[i].activityType}" (id:${progress[i].id}) -> sortOrder: ${i}`);
            }
        }

        console.log('\n✨ All sortOrders reset to creation order!');
        console.log('📝 Refresh your browser to see the correct order.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetSortOrder();
