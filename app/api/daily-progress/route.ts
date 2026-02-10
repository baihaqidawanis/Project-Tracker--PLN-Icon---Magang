import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth-guard';

// GET all daily progress
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

    const dailyProgress = await prisma.dailyProgress.findMany({
      where,
      include: {
        page: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' }
      ],
    });
    return NextResponse.json(dailyProgress);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch daily progress' }, { status: 500 });
  }
}

// POST new daily progress
export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const data = await request.json();

    const parsedPageId = parseInt(data.pageId);
    if (isNaN(parsedPageId)) {
      return NextResponse.json({ error: 'Valid pageId is required' }, { status: 400 });
    }

    const progress = await prisma.dailyProgress.create({
      data: {
        pageId: parsedPageId,
        date: data.date ? new Date(data.date) : null,
        activityType: data.activityType,
        description: data.description,
        targetIfPlan: data.targetIfPlan ? new Date(data.targetIfPlan) : null,
        pic: data.pic,
        category: data.category,
        sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder) : 0,
      },
      include: {
        page: true,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('[daily-progress POST]', error);
    return NextResponse.json({ error: 'Failed to create daily progress' }, { status: 500 });
  }
}

// PUT update daily progress
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
      const current = await prisma.dailyProgress.findUnique({
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

    const progress = await prisma.dailyProgress.update({
      where: { id: parsedId },
      data: {
        date: data.date ? new Date(data.date) : null,
        activityType: data.activityType,
        description: data.description,
        targetIfPlan: data.targetIfPlan ? new Date(data.targetIfPlan) : null,
        pic: data.pic,
        category: data.category,
        sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder) : 0,
        lastEditedBy: data.userEmail || null,
      },
      include: {
        page: true,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('[daily-progress PUT]', error);
    return NextResponse.json({ error: 'Failed to update daily progress' }, { status: 500 });
  }
}

// DELETE daily progress
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

    await prisma.dailyProgress.delete({
      where: { id: parsedId },
    });
    return NextResponse.json({ message: 'Daily progress deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete daily progress' }, { status: 500 });
  }
}