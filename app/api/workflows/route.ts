import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth-guard';

// GET all workflows
export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    const where: any = {};
    if (pageId) {
      const parsedPageId = parseInt(pageId);
      if (isNaN(parsedPageId)) {
        return NextResponse.json({ error: 'Invalid pageId' }, { status: 400 });
      }
      where.pageId = parsedPageId;
    }

    const workflows = await prisma.workflow.findMany({
      where,
      include: {
        page: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' }
      ],
    });
    return NextResponse.json(workflows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

// POST new workflow
export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const data = await request.json();

    const parsedPageId = parseInt(data.pageId);
    if (isNaN(parsedPageId)) {
      return NextResponse.json({ error: 'Valid pageId is required' }, { status: 400 });
    }

    const workflow = await prisma.workflow.create({
      data: {
        pageId: parsedPageId,
        no: data.no === '' || data.no === null ? 0 : parseInt(data.no),
        activity: data.activity,
        bobot: parseInt(data.bobot) || 0,
        target: data.target,
        status: data.status,
        progress: parseInt(data.progress) || 0,
        sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder) : 0,
      },
      include: {
        page: true,
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('[workflows POST]', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}

// PUT update workflow
export async function PUT(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const parsedId = parseInt(data.id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Optimistic locking: Check if data was modified by someone else
    if (data.lastSeenUpdatedAt) {
      const current = await prisma.workflow.findUnique({
        where: { id: parsedId },
        select: { updatedAt: true }
      });

      if (current && new Date(current.updatedAt).getTime() > new Date(data.lastSeenUpdatedAt).getTime()) {
        return NextResponse.json({
          error: 'conflict',
          message: 'Data sudah diupdate oleh user lain. Refresh untuk melihat perubahan terbaru.'
        }, { status: 409 });
      }
    }

    const workflow = await prisma.workflow.update({
      where: { id: parsedId },
      data: {
        no: data.no === '' || data.no === null ? 0 : parseInt(data.no),
        activity: data.activity,
        bobot: parseInt(data.bobot) || 0,
        target: data.target,
        status: data.status,
        progress: parseInt(data.progress) || 0,
        sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder) : 0,
        lastEditedBy: data.userEmail || null,
      },
      include: {
        page: true,
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('[workflows PUT]', error);
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

// DELETE workflow
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

    await prisma.workflow.delete({
      where: { id: parsedId },
    });
    return NextResponse.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}