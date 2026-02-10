import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth-guard';

// POST - Backfill Partnership rows for all existing Pages
export async function POST() {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

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

                results.created++;
            } catch (error: any) {
                results.errors.push(`${page.pageNumber}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Backfill completed',
            results,
        });
    } catch (error: any) {
        console.error('[backfill]', error?.message);
        return NextResponse.json(
            { error: 'Failed to backfill Partnership rows' },
            { status: 500 }
        );
    }
}
