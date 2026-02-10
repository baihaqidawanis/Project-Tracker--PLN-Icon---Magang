import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth-guard';

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const [pics, branches, prioritas, statuses, kodes, bnps, sos, activityTypes] = await Promise.all([
      prisma.masterPIC.findMany({ orderBy: { name: 'asc' } }),
      prisma.masterBranch.findMany({ orderBy: { name: 'asc' } }),
      prisma.masterPrioritas.findMany({ orderBy: { name: 'asc' } }),
      prisma.masterStatus.findMany({ orderBy: { name: 'asc' } }),
      prisma.masterKode.findMany({ orderBy: { name: 'asc' } }),
      prisma.masterBnP.findMany({ orderBy: { name: 'asc' } }),
      prisma.masterSO.findMany({ orderBy: { name: 'asc' } }),
      prisma.masterActivityType.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return NextResponse.json({
      pics,
      branches,
      prioritas,
      statuses,
      kodes,
      bnps,
      sos,
      activityTypes,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch master data' }, { status: 500 });
  }
}

// POST - Add new master data
export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const { type, name, email } = await request.json();

    if (!type || !name) {
      return NextResponse.json({ error: 'type and name are required' }, { status: 400 });
    }

    let result;
    switch (type) {
      case 'pics':
        result = await prisma.masterPIC.create({ data: { name, email } });
        break;
      case 'branches':
        result = await prisma.masterBranch.create({ data: { name } });
        break;
      case 'prioritas':
        result = await prisma.masterPrioritas.create({ data: { name } });
        break;
      case 'statuses':
        result = await prisma.masterStatus.create({ data: { name } });
        break;
      case 'kodes':
        result = await prisma.masterKode.create({ data: { name } });
        break;
      case 'bnps':
        result = await prisma.masterBnP.create({ data: { name } });
        break;
      case 'sos':
        result = await prisma.masterSO.create({ data: { name } });
        break;
      case 'activityTypes':
        result = await prisma.masterActivityType.create({ data: { name } });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create master data' }, { status: 500 });
  }
}

// DELETE - Delete master data
export async function DELETE(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    switch (type) {
      case 'pics':
        await prisma.masterPIC.delete({ where: { id: parsedId } });
        break;
      case 'branches':
        await prisma.masterBranch.delete({ where: { id: parsedId } });
        break;
      case 'prioritas':
        await prisma.masterPrioritas.delete({ where: { id: parsedId } });
        break;
      case 'statuses':
        await prisma.masterStatus.delete({ where: { id: parsedId } });
        break;
      case 'kodes':
        await prisma.masterKode.delete({ where: { id: parsedId } });
        break;
      case 'bnps':
        await prisma.masterBnP.delete({ where: { id: parsedId } });
        break;
      case 'sos':
        await prisma.masterSO.delete({ where: { id: parsedId } });
        break;
      case 'activityTypes':
        await prisma.masterActivityType.delete({ where: { id: parsedId } });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete master data' }, { status: 500 });
  }
}