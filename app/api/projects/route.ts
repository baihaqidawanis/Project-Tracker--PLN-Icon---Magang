import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

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
        sortOrder: 'asc',
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

    const parseId = (val: any) => {
      const parsed = parseInt(val);
      return isNaN(parsed) || parsed === 0 ? null : parsed;
    };

    const project = await prisma.project.create({
      data: {
        code: data.code,
        branchId: parseId(data.branchId),
        namaCalonMitra: data.namaCalonMitra,
        prioritasId: parseId(data.prioritasId),
        picId: parseId(data.picId),
        jenisKerjaSama: data.jenisKerjaSama,
        progressPercentage: parseInt(data.progressPercentage) || 0,
        latestUpdate: data.latestUpdate,
        actionPlan: data.actionPlan,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        linkDokumen: data.linkDokumen,
        latestActivity: data.latestActivity,
        latestActivityStatusId: parseId(data.latestActivityStatusId),
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