import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const page = await prisma.page.create({
      data: {
        pageNumber: data.pageNumber,
        partnershipName: data.partnershipName,
      },
    });

    console.log('[API POST] Created page:', page);
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
    console.log('[API PUT] Received data:', data);

    const page = await prisma.page.update({
      where: { id: parseInt(data.id) },
      data: {
        pageNumber: data.pageNumber,
        partnershipName: data.partnershipName,
      },
    });

    console.log('[API PUT] Updated page:', page);
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

    await prisma.page.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}