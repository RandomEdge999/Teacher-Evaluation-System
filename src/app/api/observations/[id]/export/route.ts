import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 10, 15 * 60 * 1000); // 10 requests per 15 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    if (!['pdf', 'word', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: pdf, word, csv' },
        { status: 400 }
      );
    }

    // Get observation with all related data
    const observation = await prisma.observation.findUnique({
      where: { id },
      include: {
        observer: { select: { id: true, fullName: true, email: true } },
        teacher: { select: { id: true, fullName: true, employeeId: true } },
        branch: { select: { id: true, name: true, address: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
        itemScores: {
          include: {
            rubricItem: {
              include: {
                domain: { select: { id: true, name: true, description: true } }
              }
            }
          },
          orderBy: [
            { rubricItem: { domain: { orderIndex: 'asc' } } },
            { rubricItem: { orderIndex: 'asc' } }
          ]
        },
        attachments: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!observation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    // Calculate scores
    const domainScores = calculateDomainScores(observation.itemScores);
    const grandTotal = domainScores.reduce((sum, domain) => sum + domain.total, 0);
    const overallRating = calculateOverallRating(domainScores);

    // Prepare export data
    const exportData = {
      observation,
      domainScores,
      grandTotal,
      overallRating,
      exportDate: new Date().toISOString(),
      exportedBy: session.user
    };

    let response: any;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        // For now, return JSON. In production, you'd use a PDF library like puppeteer or jsPDF
        response = exportData;
        contentType = 'application/json';
        filename = `observation-${id}.json`;
        break;

      case 'word':
        // For now, return JSON. In production, you'd use a Word library like docx
        response = exportData;
        contentType = 'application/json';
        filename = `observation-${id}.json`;
        break;

      case 'csv':
        const csvContent = generateCSV(exportData);
        response = csvContent;
        contentType = 'text/csv';
        filename = `observation-${id}.csv`;
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Observation',
        objectId: id,
        action: 'EXPORT',
        userId: session.user.id,
        diff: { action: `Exported observation as ${format.toUpperCase()}`, format }
      }
    });

    return new NextResponse(response, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error exporting observation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface DomainScore {
  domainId: string;
  domainName: string;
  total: number;
  maxPossible: number;
  percentage: number;
  itemScores: any[];
}

interface ItemScore {
  rating: number | null;
  rubricItem: {
    domain: {
      id: string;
      name: string;
    };
    maxScore: number;
    prompt: string;
  };
  comment?: string | null;
}

function calculateDomainScores(itemScores: ItemScore[]): DomainScore[] {
  const domainMap = new Map<string, DomainScore>();
  
  itemScores.forEach((score: ItemScore) => {
    const domainId = score.rubricItem.domain.id;
    const domainName = score.rubricItem.domain.name;
    
    if (!domainMap.has(domainId)) {
      domainMap.set(domainId, {
        domainId,
        domainName,
        total: 0,
        maxPossible: 0,
        percentage: 0,
        itemScores: []
      });
    }
    
    const domain = domainMap.get(domainId)!;
    const rating = score.rating || 0;
    const maxScore = score.rubricItem.maxScore;
    
    domain.total += rating;
    domain.maxPossible += maxScore;
    domain.itemScores.push(score);
  });
  
  return Array.from(domainMap.values()).map((domain: DomainScore) => ({
    ...domain,
    percentage: domain.maxPossible > 0 ? (domain.total / domain.maxPossible) * 100 : 0
  }));
}

function calculateOverallRating(domainScores: DomainScore[]) {
  const totalScore = domainScores.reduce((sum: number, domain: DomainScore) => sum + domain.total, 0);
  const maxPossible = domainScores.reduce((sum: number, domain: DomainScore) => sum + domain.maxPossible, 0);
  const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
  
  let rating = 'Very Poor';
  let color = 'danger';
  
  if (percentage >= 90) {
    rating = 'Excellent';
    color = 'success';
  } else if (percentage >= 75) {
    rating = 'Good';
    color = 'primary';
  } else if (percentage >= 60) {
    rating = 'Average';
    color = 'warning';
  } else if (percentage >= 50) {
    rating = 'Weak';
    color = 'warning';
  }
  
  return { rating, color, percentage };
}

interface ExportData {
  observation: {
    id: string;
    date: Date;
    teacher: { fullName: string };
    branch: { name: string };
    subject: string;
    topic: string;
    status: string;
    itemScores: ItemScore[];
  };
  domainScores: DomainScore[];
  grandTotal: number;
  overallRating: { rating: string };
}

function generateCSV(exportData: ExportData) {
  const { observation, domainScores, grandTotal, overallRating } = exportData;
  
  let csv = 'Observation ID,Date,Teacher,Branch,Subject,Topic,Status,Grand Total,Overall Rating\n';
  csv += `${observation.id},${observation.date},${observation.teacher.fullName},${observation.branch.name},${observation.subject},${observation.topic},${observation.status},${grandTotal},${overallRating.rating}\n\n`;
  
  csv += 'Domain,Total Score,Percentage\n';
  domainScores.forEach((domain: DomainScore) => {
    csv += `${domain.domainName},${domain.total},${domain.percentage.toFixed(1)}%\n`;
  });
  
  csv += '\nRubric Item,Rating,Comment\n';
  observation.itemScores.forEach((score: ItemScore) => {
    const prompt = score.rubricItem.prompt.replace(/,/g, ';');
    const comment = (score.comment || '').replace(/,/g, ';');
    csv += `"${prompt}",${score.rating || 'N/A'},"${comment}"\n`;
  });
  
  return csv;
}
