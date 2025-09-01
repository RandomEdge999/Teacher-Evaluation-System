import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

export async function GET() {
  try {
    const domains = await prisma.rubricDomain.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json(domains);
  } catch (error) {
    console.error('Error fetching rubric:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domains } = body;

    // Input validation and sanitization
    if (!Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { error: 'Domains array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate domain structure
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      
      if (!domain.name || typeof domain.name !== 'string') {
        return NextResponse.json(
          { error: `Domain ${i + 1}: Name is required and must be a string` },
          { status: 400 }
        );
      }

      const sanitizedName = String(domain.name).trim();
      if (sanitizedName.length < 3 || sanitizedName.length > 100) {
        return NextResponse.json(
          { error: `Domain ${i + 1}: Name must be between 3 and 100 characters` },
          { status: 400 }
        );
      }

      if (domain.description && typeof domain.description === 'string') {
        const sanitizedDescription = String(domain.description).trim();
        if (sanitizedDescription.length > 500) {
          return NextResponse.json(
            { error: `Domain ${i + 1}: Description must be less than 500 characters` },
            { status: 400 }
          );
        }
      }

      // Validate items if present
      if (domain.items && Array.isArray(domain.items)) {
        for (let j = 0; j < domain.items.length; j++) {
          const item = domain.items[j];
          
          if (!item.prompt || typeof item.prompt !== 'string') {
            return NextResponse.json(
              { error: `Domain ${i + 1}, Item ${j + 1}: Prompt is required and must be a string` },
              { status: 400 }
            );
          }

          const sanitizedPrompt = String(item.prompt).trim();
          if (sanitizedPrompt.length < 10 || sanitizedPrompt.length > 500) {
            return NextResponse.json(
              { error: `Domain ${i + 1}, Item ${j + 1}: Prompt must be between 10 and 500 characters` },
              { status: 400 }
            );
          }

          if (!item.maxScore || typeof item.maxScore !== 'number' || item.maxScore < 1 || item.maxScore > 10) {
            return NextResponse.json(
              { error: `Domain ${i + 1}, Item ${j + 1}: Max score must be a number between 1 and 10` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deactivate all existing domains and items
      await tx.rubricDomain.updateMany({
        data: { isActive: false }
      });

      await tx.rubricItem.updateMany({
        data: { isActive: false }
      });

      // Create new domains and items
      for (let i = 0; i < domains.length; i++) {
        const domain = domains[i];
        const newDomain = await tx.rubricDomain.create({
          data: {
            name: String(domain.name).trim(),
            description: domain.description ? String(domain.description).trim() : '',
            orderIndex: domain.orderIndex || i,
            isActive: true
          }
        });

        if (domain.items && Array.isArray(domain.items)) {
          for (let j = 0; j < domain.items.length; j++) {
            const item = domain.items[j];
            await tx.rubricItem.create({
              data: {
                domainId: newDomain.id,
                number: item.number || `${newDomain.id}-${j + 1}`,
                prompt: String(item.prompt).trim(),
                orderIndex: item.orderIndex || j,
                maxScore: item.maxScore,
                scaleMin: item.scaleMin || 0,
                scaleMax: item.scaleMax || item.maxScore,
                isActive: true
              }
            });
          }
        }
      }

      return { message: 'Rubric updated successfully' };
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Rubric',
        objectId: 'system',
        action: 'UPDATE',
        userId: session.user.id,
        diff: { action: 'Updated entire rubric structure' }
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error updating rubric:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
