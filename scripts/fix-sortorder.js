const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSortOrder() {
    console.log('🔧 Fixing sortOrder for all workflows...');

    try {
        // Get all pages
        const pages = await prisma.page.findMany({
            include: {
                workflows: {
                    orderBy: [
                        { id: 'asc' } // Sort by creation order
                    ]
                }
            }
        });

        for (const page of pages) {
            console.log(`\n📄 Processing page: ${page.pageNumber} - ${page.partnershipName}`);

            // Update sortOrder for each workflow based on current order
            for (let i = 0; i < page.workflows.length; i++) {
                const workflow = page.workflows[i];
                await prisma.workflow.update({
                    where: { id: workflow.id },
                    data: { sortOrder: i }
                });
                console.log(`  ✅ Updated workflow ${workflow.id}: sortOrder = ${i}`);
            }
        }

        console.log('\n✨ All workflows have been updated with correct sortOrder!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixSortOrder();
