import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET - Get current token status
export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create the record for this school
    let accessControl = await prisma.ujianAccessControl.findFirst({
      where: { schoolId: session.schoolId! },
    });

    if (!accessControl) {
      accessControl = await prisma.ujianAccessControl.create({
        data: { schoolId: session.schoolId! },
      });
    }

    // Check if token is expired
    const now = new Date();
    const isTokenValid = accessControl.tokenExpiresAt && accessControl.tokenExpiresAt > now;

    return NextResponse.json({
      success: true,
      data: {
        isActive: accessControl.isActive && isTokenValid,
        currentToken: isTokenValid ? accessControl.currentToken : null,
        tokenExpiresAt: accessControl.tokenExpiresAt,
        generatedBy: accessControl.generatedBy,
        description: accessControl.description,
      },
    });
  } catch (error) {
    console.error('Error fetching ujian access control:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch access control' },
      { status: 500 }
    );
  }
}

// POST - Generate new token (active for 30 minutes)
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { description } = body;

    // Generate 6-character alphanumeric token
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Set expiry to 30 minutes from now
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    // Get or create the record for this school
    let accessControl = await prisma.ujianAccessControl.findFirst({
      where: { schoolId: session.schoolId! },
    });

    if (!accessControl) {
      accessControl = await prisma.ujianAccessControl.create({
        data: {
          schoolId: session.schoolId!,
          isActive: true,
          currentToken: token,
          tokenGeneratedAt: now,
          tokenExpiresAt: expiresAt,
          generatedBy: session.userId,
          description: description || null,
        },
      });
    } else {
      accessControl = await prisma.ujianAccessControl.update({
        where: { id: accessControl.id },
        data: {
          isActive: true,
          currentToken: token,
          tokenGeneratedAt: now,
          tokenExpiresAt: expiresAt,
          generatedBy: session.userId,
          description: description || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        token,
        expiresAt,
        message: 'Token generated successfully. Valid for 30 minutes.',
      },
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

// PUT - Deactivate token
export async function PUT() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accessControl = await prisma.ujianAccessControl.findFirst({
      where: { schoolId: session.schoolId! },
    });

    if (!accessControl) {
      return NextResponse.json(
        { success: false, error: 'Access control not found' },
        { status: 404 }
      );
    }

    await prisma.ujianAccessControl.update({
      where: { id: accessControl.id },
      data: {
        isActive: false,
        currentToken: null,
        tokenExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Token deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate token' },
      { status: 500 }
    );
  }
}
