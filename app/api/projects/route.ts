import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        branch: true,
        prioritas: true,
        pic: true,
        latestActivityStatus: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST new project
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const project = await prisma.project.create({
      data: {
        code: data.code,
        branchId: parseInt(data.branchId),
        namaCalonMitra: data.namaCalonMitra,
        prioritasId: parseInt(data.prioritasId),
        picId: parseInt(data.picId),
        jenisKerjaSama: data.jenisKerjaSama,
        progressPercentage: parseInt(data.progressPercentage) || 0,
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
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}