import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all daily progress
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    const dailyProgress = await prisma.dailyProgress.findMany({
      where: pageId ? { pageId: parseInt(pageId) } : {},
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
  try {
    const data = await request.json();
    console.log('[API POST DailyProgress] Received data:', data);

    const progress = await prisma.dailyProgress.create({
      data: {
        pageId: parseInt(data.pageId),
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

    console.log('[API POST DailyProgress] Created progress:', progress);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('[API POST DailyProgress] Error:', error);
    return NextResponse.json({ error: 'Failed to create daily progress' }, { status: 500 });
  }
}

// PUT update daily progress
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    console.log('[API PUT DailyProgress] Received data:', data);

    if (!data.id) {
      console.error('[API PUT DailyProgress] Missing ID in request');
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const progress = await prisma.dailyProgress.update({
      where: { id: parseInt(data.id) },
      data: {
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

    console.log('[API PUT DailyProgress] Updated progress:', progress);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('[API PUT DailyProgress] Error:', error);
    return NextResponse.json({ error: 'Failed to update daily progress' }, { status: 500 });
  }
}

// DELETE daily progress
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.dailyProgress.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: 'Daily progress deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete daily progress' }, { status: 500 });
  }
}