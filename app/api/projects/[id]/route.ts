import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        branch: true,
        prioritas: true,
        pic: true,
        latestActivityStatus: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    let data;
    try {
      const text = await request.text();
      if (!text) {
        return NextResponse.json({ error: 'Empty body' }, { status: 400 });
      }
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Helper to safely parse numbers that might be 0/null
    const parseId = (val: any) => {
      const parsed = parseInt(val);
      return isNaN(parsed) || parsed === 0 ? null : parsed;
    };

    // Optimistic locking: Check if data was modified by someone else
    if (data.lastSeenUpdatedAt) {
      const current = await prisma.project.findUnique({
        where: { id },
        select: { updatedAt: true }
      });

      if (current && new Date(current.updatedAt).getTime() > new Date(data.lastSeenUpdatedAt).getTime()) {
        return NextResponse.json({
          error: 'conflict',
          message: 'Data sudah diupdate oleh user lain. Refresh untuk melihat perubahan terbaru.'
        }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData: any = {
      code: data.code,
      kode: data.kode, // Added missing field
      branchId: parseId(data.branchId),
      namaCalonMitra: data.namaCalonMitra,
      prioritasId: parseId(data.prioritasId),
      picId: parseId(data.picId),
      jenisKerjaSama: data.jenisKerjaSama,
      progressPercentage: parseInt(data.progressPercentage),
      latestUpdate: data.latestUpdate,
      actionPlan: data.actionPlan,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      linkDokumen: data.linkDokumen,
      latestActivity: data.latestActivity,
      latestActivityStatusId: parseId(data.latestActivityStatusId),
      lastEditedBy: data.userEmail || null, // Track who edited
    };

    // Try to add sortOrder if supported
    if (data.sortOrder !== undefined) {
      try {
        updateData.sortOrder = data.sortOrder;
      } catch (e) {
        console.warn('sortOrder field not yet supported, skipping');
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
        prioritas: true,
        pic: true,
        latestActivityStatus: true,
      },
    });
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error updating project:', error);
    if (error.stack) console.error('Error stack:', error.stack);
    return NextResponse.json({
      error: 'Failed to update project',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.project.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}