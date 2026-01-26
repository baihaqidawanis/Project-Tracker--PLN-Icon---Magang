import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        branch: true,
        prioritas: true,
        pic: true,
        latestActivityStatus: true,
        workflows: true,
        dailyProgress: true,
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
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const project = await prisma.project.update({
      where: { id: parseInt(params.id) },
      data: {
        code: data.code,
        branchId: parseInt(data.branchId),
        namaCalonMitra: data.namaCalonMitra,
        prioritasId: parseInt(data.prioritasId),
        picId: parseInt(data.picId),
        jenisKerjaSama: data.jenisKerjaSama,
        progressPercentage: parseInt(data.progressPercentage),
        latestUpdate: data.latestUpdate,
        actionPlan: data.actionPlan,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        linkDokumen: data.linkDokumen,
        latestActivity: data.latestActivity,
        latestActivityStatusId: data.latestActivityStatusId ? parseInt(data.latestActivityStatusId) : null,
      },
      include: {
        branch: true,
        prioritas: true,
        pic: true,
        latestActivityStatus: true,
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.project.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}