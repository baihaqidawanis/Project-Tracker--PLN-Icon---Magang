import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Backfill Partnership rows for all existing Pages
export async function POST() {
    try {
        // Get all pages
        const pages = await prisma.page.findMany();

        const results = {
            total: pages.length,
            created: 0,
            skipped: 0,
            errors: [] as string[],
        };

        for (const page of pages) {
            try {
                // Check if Partnership row already exists
                const existingProject = await prisma.project.findUnique({
                    where: { code: page.pageNumber },
                });

                if (existingProject) {
                    console.log(`[Backfill] Partnership row already exists for ${page.pageNumber}`);
                    results.skipped++;
                    continue;
                }

                // Create Partnership row
                await prisma.project.create({
                    data: {
                        code: page.pageNumber,
                        namaCalonMitra: page.partnershipName,
                    },
                });

                console.log(`[Backfill] Created Partnership row for ${page.pageNumber}`);
                results.created++;
            } catch (error: any) {
                console.error(`[Backfill] Error creating Partnership for ${page.pageNumber}:`, error);
                results.errors.push(`${page.pageNumber}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Backfill completed',
            results,
        });
    } catch (error: any) {
        console.error('[Backfill] Error:', error);
        return NextResponse.json(
            { error: 'Failed to backfill Partnership rows', details: error.message },
            { status: 500 }
        );
    }
}
