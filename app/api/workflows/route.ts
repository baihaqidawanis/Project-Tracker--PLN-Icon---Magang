import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET all workflows
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    const workflows = await prisma.workflow.findMany({
      where: pageId ? { pageId: parseInt(pageId) } : {},
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
  try {
    const data = await request.json();
    console.log('[API POST Workflow] Received data:', data);

    const workflow = await prisma.workflow.create({
      data: {
        pageId: parseInt(data.pageId),
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

    console.log('[API POST Workflow] Created workflow:', workflow);
    return NextResponse.json(workflow);
  } catch (error) {
    console.error('[API POST Workflow] Error:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}

// PUT update workflow
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    console.log('[API PUT Workflow] Received data:', data);

    if (!data.id) {
      console.error('[API PUT Workflow] Missing ID in request');
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Optimistic locking: Check if data was modified by someone else
    if (data.lastSeenUpdatedAt) {
      const current = await prisma.workflow.findUnique({
        where: { id: parseInt(data.id) },
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
      where: { id: parseInt(data.id) },
      data: {
        no: data.no === '' || data.no === null ? 0 : parseInt(data.no),
        activity: data.activity,
        bobot: parseInt(data.bobot) || 0,
        target: data.target,
        status: data.status,
        progress: parseInt(data.progress) || 0,
        sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder) : 0,
        lastEditedBy: data.userEmail || null, // Track who edited
      },
      include: {
        page: true,
      },
    });

    console.log('[API PUT Workflow] Updated workflow:', workflow);
    return NextResponse.json(workflow);
  } catch (error) {
    console.error('[API PUT Workflow] Error:', error);
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

// DELETE workflow
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.workflow.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}