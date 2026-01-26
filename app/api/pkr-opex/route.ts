import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all PKR Opex
export async function GET() {
  try {
    const pkrOpex = await prisma.pKROpex.findMany({
      orderBy: {
        date: 'desc',
      },
    });
    return NextResponse.json(pkrOpex);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch PKR Opex' }, { status: 500 });
  }
}

// POST new PKR Opex
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const pkr = await prisma.pKROpex.create({
      data: {
        date: new Date(data.date),
        mitra: data.mitra,
        description: data.description,
        saldoTopUp: data.saldoTopUp ? parseFloat(data.saldoTopUp) : null,
        saldoPRK: data.saldoPRK ? parseFloat(data.saldoPRK) : null,
        evidence: data.evidence,
        pic: data.pic,
      },
    });
    return NextResponse.json(pkr);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create PKR Opex' }, { status: 500 });
  }
}

// PUT update PKR Opex
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const pkr = await prisma.pKROpex.update({
      where: { id: parseInt(data.id) },
      data: {
        date: new Date(data.date),
        mitra: data.mitra,
        description: data.description,
        saldoTopUp: data.saldoTopUp ? parseFloat(data.saldoTopUp) : null,
        saldoPRK: data.saldoPRK ? parseFloat(data.saldoPRK) : null,
        evidence: data.evidence,
        pic: data.pic,
      },
    });
    return NextResponse.json(pkr);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update PKR Opex' }, { status: 500 });
  }
}

// DELETE PKR Opex
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    await prisma.pKROpex.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: 'PKR Opex deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete PKR Opex' }, { status: 500 });
  }
}