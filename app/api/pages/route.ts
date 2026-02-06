import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET all pages
export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      include: {
        workflows: {
          orderBy: [
            { sortOrder: 'asc' },
            { id: 'asc' }
          ]
        },
        dailyProgress: {
          orderBy: [
            { sortOrder: 'asc' },
            { id: 'asc' }
          ]
        },
      },
      orderBy: {
        pageNumber: 'asc',
      },
    });
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

// POST new page
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('[API POST] Received data:', data);

    // Create the page
    const page = await prisma.page.create({
      data: {
        pageNumber: data.pageNumber,
        partnershipName: data.partnershipName,
      },
    });

    console.log('[API POST] Created page:', page);

    // Auto-create or Update Partnership (Project) row
    try {
      // We use upsert here to handle cases where a Project with this code might already exist 
      // (e.g., from a previously deleted Page where the Project row wasn't cleaned up)
      const project = await prisma.project.upsert({
        where: { code: data.pageNumber },
        update: {
          namaCalonMitra: data.partnershipName,
          // Re-activate or reset fields if needed, but primarily we sync the name
        },
        create: {
          code: data.pageNumber,
          namaCalonMitra: data.partnershipName,
        },
      });
      console.log('[API POST] Auto-synced Partnership row:', project);
    } catch (projectError) {
      console.error('[API POST] Failed to auto-sync Partnership row:', projectError);
      // Don't fail the entire request if Partnership sync fails
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('[API POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}

// PUT update page
export async function PUT(request: Request) {
  try {
    const data = await request.json();

    // Get ID from body or query params
    let id = data.id;
    if (!id) {
      const { searchParams } = new URL(request.url);
      const queryId = searchParams.get('id');
      if (queryId) id = parseInt(queryId);
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // 1. Fetch existing page to get old values
    const existingPage = await prisma.page.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const oldPageNumber = existingPage.pageNumber;

    // 2. Update the page
    const page = await prisma.page.update({
      where: { id: parseInt(id) },
      data: {
        pageNumber: data.pageNumber,
        partnershipName: data.partnershipName,
      },
    });

    console.log('[API PUT] Updated page:', page);

    // 3. Update corresponding Partnership (Project) row using OLD page number
    try {
      const existingProject = await prisma.project.findFirst({
        where: { code: oldPageNumber }, // Use OLD code to find the project
      });

      if (existingProject) {
        await prisma.project.update({
          where: { id: existingProject.id },
          data: {
            code: data.pageNumber, // Update to NEW code
            namaCalonMitra: data.partnershipName, // Update name
          },
        });
        console.log('[API PUT] Synced Partnership row from', oldPageNumber, 'to', data.pageNumber);
      } else {
        console.warn('[API PUT] No corresponding Partnership found for code:', oldPageNumber);
      }
    } catch (projectError) {
      console.error('[API PUT] Failed to update Partnership row:', projectError);
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('[API PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

// DELETE page
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // 1. Fetch page details before deleting to get the PageNumber (Code)
    const pageToDelete = await prisma.page.findUnique({
      where: { id: parseInt(id) },
    });

    if (!pageToDelete) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const pageNumber = pageToDelete.pageNumber;

    // 2. Delete the Page
    await prisma.page.delete({
      where: { id: parseInt(id) },
    });

    console.log('[API DELETE] Deleted page:', id, pageNumber);

    // 3. Delete the corresponding Partnership (Project) row
    try {
      const projectToDelete = await prisma.project.findFirst({
        where: { code: pageNumber },
      });

      if (projectToDelete) {
        await prisma.project.delete({
          where: { id: projectToDelete.id },
        });
        console.log('[API DELETE] Deleted corresponding Partnership row for code:', pageNumber);
      } else {
        console.warn('[API DELETE] No corresponding Partnership found to delete for code:', pageNumber);
      }
    } catch (projectError) {
      console.error('[API DELETE] Failed to delete Partnership row:', projectError);
      // We don't error out the main request if this fails, as the primary action (delete page) succeeded
    }

    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('[API DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}