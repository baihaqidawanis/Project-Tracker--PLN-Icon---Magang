import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth-guard';

// GET all pages
export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

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
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const data = await request.json();

    if (!data.pageNumber || !data.partnershipName) {
      return NextResponse.json({ error: 'pageNumber and partnershipName are required' }, { status: 400 });
    }

    // Use transaction to ensure both Page and Partnership are created atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the page
      const page = await tx.page.create({
        data: {
          pageNumber: data.pageNumber,
          partnershipName: data.partnershipName,
        },
      });

      // Auto-create or Update Partnership (Project) row
      await tx.project.upsert({
        where: { code: data.pageNumber },
        update: {
          namaCalonMitra: data.partnershipName,
        },
        create: {
          code: data.pageNumber,
          namaCalonMitra: data.partnershipName,
        },
      });

      return page;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[pages POST]', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}

// PUT update page
export async function PUT(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

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

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Use transaction to ensure both Page and Partnership are updated atomically
    const result = await prisma.$transaction(async (tx) => {
      // Fetch existing page to get old values
      const existingPage = await tx.page.findUnique({
        where: { id: parsedId },
      });

      if (!existingPage) {
        throw new Error('PAGE_NOT_FOUND');
      }

      const oldPageNumber = existingPage.pageNumber;

      // Update the page
      const page = await tx.page.update({
        where: { id: parsedId },
        data: {
          pageNumber: data.pageNumber,
          partnershipName: data.partnershipName,
        },
      });

      // Update corresponding Partnership (Project) row using OLD page number
      const existingProject = await tx.project.findFirst({
        where: { code: oldPageNumber },
      });

      if (existingProject) {
        await tx.project.update({
          where: { id: existingProject.id },
          data: {
            code: data.pageNumber,
            namaCalonMitra: data.partnershipName,
          },
        });
      }

      return page;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'PAGE_NOT_FOUND') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    console.error('[pages PUT]', error?.message);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

// DELETE page
export async function DELETE(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Use transaction to ensure both Page and Partnership are deleted atomically
    await prisma.$transaction(async (tx) => {
      const pageToDelete = await tx.page.findUnique({
        where: { id: parsedId },
      });

      if (!pageToDelete) {
        throw new Error('PAGE_NOT_FOUND');
      }

      const pageNumber = pageToDelete.pageNumber;

      // Delete the Page
      await tx.page.delete({
        where: { id: parsedId },
      });

      // Delete the corresponding Partnership (Project) row
      const projectToDelete = await tx.project.findFirst({
        where: { code: pageNumber },
      });

      if (projectToDelete) {
        await tx.project.delete({
          where: { id: projectToDelete.id },
        });
      }
    });

    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error: any) {
    if (error.message === 'PAGE_NOT_FOUND') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    console.error('[pages DELETE]', error?.message);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}