import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create branches
  const branches = await Promise.all([
    prisma.branch.upsert({
      where: { id: 'branch-1' },
      update: {},
      create: {
        id: 'branch-1',
        name: 'Main Campus',
        address: '123 Education Street, City Center'
      }
    }),
    prisma.branch.upsert({
      where: { id: 'branch-2' },
      update: {},
      create: {
        id: 'branch-2',
        name: 'North Branch',
        address: '456 Learning Avenue, North District'
      }
    }),
    prisma.branch.upsert({
      where: { id: 'branch-3' },
      update: {},
      create: {
        id: 'branch-3',
        name: 'South Branch',
        address: '789 Knowledge Road, South Area'
      }
    })
  ]);

  console.log('✅ Branches created:', branches.length);

  // Create users with secure password hashes
  const defaultPassword = 'Password123!'; // SECURITY: Change this in production
  const passwordHash = await bcrypt.hash(defaultPassword, 12);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: 'user-1' },
      update: {},
      create: {
        id: 'user-1',
        email: 'admin@school.com',
        fullName: 'Admin User',
        passwordHash,
        employeeId: 'A001',
        role: 'ADMIN',
        branchId: 'branch-1'
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-2' },
      update: {},
      create: {
        id: 'user-2',
        email: 'observer@school.com',
        fullName: 'John Observer',
        passwordHash,
        employeeId: 'O001',
        role: 'OBSERVER',
        branchId: 'branch-1'
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-3' },
      update: {},
      create: {
        id: 'user-3',
        email: 'reviewer@school.com',
        fullName: 'Sarah Reviewer',
        passwordHash,
        employeeId: 'R001',
        role: 'REVIEWER',
        branchId: 'branch-1'
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-4' },
      update: {},
      create: {
        id: 'user-4',
        email: 'teacher@school.com',
        fullName: 'Mike Teacher',
        passwordHash,
        employeeId: 'T001',
        role: 'TEACHER',
        branchId: 'branch-1'
      }
    })
  ]);

  console.log('✅ Users created:', users.length);

  // Create teachers
  const teachers = await Promise.all([
    prisma.teacher.upsert({
      where: { id: 'teacher-1' },
      update: {},
      create: {
        id: 'teacher-1',
        fullName: 'Sarah Johnson',
        employeeId: 'T001',
        branchId: 'branch-1',
        subjectPrimary: 'Mathematics'
      }
    }),
    prisma.teacher.upsert({
      where: { id: 'teacher-2' },
      update: {},
      create: {
        id: 'teacher-2',
        fullName: 'Michael Chen',
        employeeId: 'T002',
        branchId: 'branch-1',
        subjectPrimary: 'Science'
      }
    }),
    prisma.teacher.upsert({
      where: { id: 'teacher-3' },
      update: {},
      create: {
        id: 'teacher-3',
        fullName: 'Emily Rodriguez',
        employeeId: 'T003',
        branchId: 'branch-2',
        subjectPrimary: 'English'
      }
    }),
    prisma.teacher.upsert({
      where: { id: 'teacher-4' },
      update: {},
      create: {
        id: 'teacher-4',
        fullName: 'David Thompson',
        employeeId: 'T004',
        branchId: 'branch-2',
        subjectPrimary: 'History'
      }
    }),
    prisma.teacher.upsert({
      where: { id: 'teacher-5' },
      update: {},
      create: {
        id: 'teacher-5',
        fullName: 'Lisa Wang',
        employeeId: 'T005',
        branchId: 'branch-3',
        subjectPrimary: 'Art'
      }
    })
  ]);

  console.log('✅ Teachers created:', teachers.length);

  // Create rubric domains
  const domains = await Promise.all([
    prisma.rubricDomain.upsert({
      where: { id: 'domain-1' },
      update: {},
      create: {
        id: 'domain-1',
        name: 'Planning & Preparation',
        description: 'Teacher preparation and lesson planning effectiveness',
        orderIndex: 1
      }
    }),
    prisma.rubricDomain.upsert({
      where: { id: 'domain-2' },
      update: {},
      create: {
        id: 'domain-2',
        name: 'Content Knowledge',
        description: 'Teacher mastery of subject matter and curriculum',
        orderIndex: 2
      }
    }),
    prisma.rubricDomain.upsert({
      where: { id: 'domain-3' },
      update: {},
      create: {
        id: 'domain-3',
        name: 'Teaching Methodology',
        description: 'Effectiveness of instructional strategies and delivery',
        orderIndex: 3
      }
    }),
    prisma.rubricDomain.upsert({
      where: { id: 'domain-4' },
      update: {},
      create: {
        id: 'domain-4',
        name: 'Classroom Management',
        description: 'Organization and discipline in the learning environment',
        orderIndex: 4
      }
    }),
    prisma.rubricDomain.upsert({
      where: { id: 'domain-5' },
      update: {},
      create: {
        id: 'domain-5',
        name: 'Student Engagement',
        description: 'How well students are involved and motivated in learning',
        orderIndex: 5
      }
    }),
    prisma.rubricDomain.upsert({
      where: { id: 'domain-6' },
      update: {},
      create: {
        id: 'domain-6',
        name: 'Assessment & Feedback',
        description: 'Evaluation methods and student progress monitoring',
        orderIndex: 6
      }
    })
  ]);

  console.log('✅ Rubric domains created:', domains.length);

  // Create rubric items
  const items = await Promise.all([
    // Domain 1: Planning & Preparation
    prisma.rubricItem.upsert({
      where: { id: 'item-1-1' },
      update: {},
      create: {
        id: 'item-1-1',
        domainId: 'domain-1',
        number: 1,
        prompt: 'Arrives on time and well prepared for the lesson',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-1-2' },
      update: {},
      create: {
        id: 'item-1-2',
        domainId: 'domain-1',
        number: 2,
        prompt: 'Has clear lesson objectives and learning outcomes',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-1-3' },
      update: {},
      create: {
        id: 'item-1-3',
        domainId: 'domain-1',
        number: 3,
        prompt: 'Prepares appropriate teaching materials and resources',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-1-4' },
      update: {},
      create: {
        id: 'item-1-4',
        domainId: 'domain-1',
        number: 4,
        prompt: 'Plans activities that engage different learning styles',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),

    // Domain 2: Content Knowledge
    prisma.rubricItem.upsert({
      where: { id: 'item-2-1' },
      update: {},
      create: {
        id: 'item-2-1',
        domainId: 'domain-2',
        number: 1,
        prompt: 'Demonstrates thorough knowledge of the subject matter',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-2-2' },
      update: {},
      create: {
        id: 'item-2-2',
        domainId: 'domain-2',
        number: 2,
        prompt: 'Presents content accurately and without errors',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-2-3' },
      update: {},
      create: {
        id: 'item-2-3',
        domainId: 'domain-2',
        number: 3,
        prompt: 'Connects lesson content to real-world applications',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-2-4' },
      update: {},
      create: {
        id: 'item-2-4',
        domainId: 'domain-2',
        number: 4,
        prompt: 'Integrates cross-curricular connections appropriately',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),

    // Domain 3: Teaching Methodology
    prisma.rubricItem.upsert({
      where: { id: 'item-3-1' },
      update: {},
      create: {
        id: 'item-3-1',
        domainId: 'domain-3',
        number: 1,
        prompt: 'Uses varied instructional strategies to meet learning objectives',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-3-2' },
      update: {},
      create: {
        id: 'item-3-2',
        domainId: 'domain-3',
        number: 2,
        prompt: 'Provides clear explanations and demonstrations',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-3-3' },
      update: {},
      create: {
        id: 'item-3-3',
        domainId: 'domain-3',
        number: 3,
        prompt: 'Uses questioning techniques to promote critical thinking',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-3-4' },
      update: {},
      create: {
        id: 'item-3-4',
        domainId: 'domain-3',
        number: 4,
        prompt: 'Adapts teaching methods based on student responses',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),

    // Domain 4: Classroom Management
    prisma.rubricItem.upsert({
      where: { id: 'item-4-1' },
      update: {},
      create: {
        id: 'item-4-1',
        domainId: 'domain-4',
        number: 1,
        prompt: 'Maintains an organized and conducive learning environment',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-4-2' },
      update: {},
      create: {
        id: 'item-4-2',
        domainId: 'domain-4',
        number: 2,
        prompt: 'Establishes and maintains clear behavioral expectations',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-4-3' },
      update: {},
      create: {
        id: 'item-4-3',
        domainId: 'domain-4',
        number: 3,
        prompt: 'Manages transitions between activities smoothly',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-4-4' },
      update: {},
      create: {
        id: 'item-4-4',
        domainId: 'domain-4',
        number: 4,
        prompt: 'Handles disruptive behavior appropriately and consistently',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),

    // Domain 5: Student Engagement
    prisma.rubricItem.upsert({
      where: { id: 'item-5-1' },
      update: {},
      create: {
        id: 'item-5-1',
        domainId: 'domain-5',
        number: 1,
        prompt: 'Students are actively engaged in learning activities',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-5-2' },
      update: {},
      create: {
        id: 'item-5-2',
        domainId: 'domain-5',
        number: 2,
        prompt: 'Students demonstrate enthusiasm and interest in the lesson',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-5-3' },
      update: {},
      create: {
        id: 'item-5-3',
        domainId: 'domain-5',
        number: 3,
        prompt: 'Students participate willingly in discussions and activities',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-5-4' },
      update: {},
      create: {
        id: 'item-5-4',
        domainId: 'domain-5',
        number: 4,
        prompt: 'Students show evidence of understanding and learning',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),

    // Domain 6: Assessment & Feedback
    prisma.rubricItem.upsert({
      where: { id: 'item-6-1' },
      update: {},
      create: {
        id: 'item-6-1',
        domainId: 'domain-6',
        number: 1,
        prompt: 'Uses appropriate assessment methods to evaluate learning',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-6-2' },
      update: {},
      create: {
        id: 'item-6-2',
        domainId: 'domain-6',
        number: 2,
        prompt: 'Provides timely and constructive feedback to students',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-6-3' },
      update: {},
      create: {
        id: 'item-6-3',
        domainId: 'domain-6',
        number: 3,
        prompt: 'Monitors student progress and adjusts instruction accordingly',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    }),
    prisma.rubricItem.upsert({
      where: { id: 'item-6-4' },
      update: {},
      create: {
        id: 'item-6-4',
        domainId: 'domain-6',
        number: 4,
        prompt: 'Encourages student self-assessment and reflection',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    })
  ]);

  console.log('✅ Rubric items created:', items.length);

  // Create sample observation
  const observation = await prisma.observation.create({
    data: {
      observerId: 'user-2',
      teacherId: 'teacher-1',
      branchId: 'branch-1',
      classSection: 'Grade 10-A',
      totalStudents: 25,
      presentStudents: 23,
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      date: new Date('2024-01-15'),
      time: '09:00 AM',
      lessonPlanAttached: true,
      strengths: 'Excellent use of real-world examples and clear explanations.',
      areasToImprove: 'Could include more student interaction and group work.',
      suggestions: 'Consider using technology tools for visualization.',
      status: 'DRAFT'
    }
  });

  console.log('✅ Sample observation created:', observation.id);

  // Create sample item scores
  const itemScores = await Promise.all([
    prisma.observationItemScore.create({
      data: {
        observationId: observation.id,
        rubricItemId: 'item-1-1',
        rating: 4,
        comment: 'Very well prepared with all materials ready.'
      }
    }),
    prisma.observationItemScore.create({
      data: {
        observationId: observation.id,
        rubricItemId: 'item-1-2',
        rating: 4,
        comment: 'Clear learning objectives were communicated effectively.'
      }
    }),
    prisma.observationItemScore.create({
      data: {
        observationId: observation.id,
        rubricItemId: 'item-2-1',
        rating: 4,
        comment: 'Demonstrated excellent command of the subject matter.'
      }
    }),
    prisma.observationItemScore.create({
      data: {
        observationId: observation.id,
        rubricItemId: 'item-2-2',
        rating: 3,
        comment: 'Content was mostly accurate with minor presentation issues.'
      }
    })
  ]);

  console.log('✅ Sample item scores created:', itemScores.length);

  console.log('🎉 Database seeding completed successfully!');
}

// Main execution with proper error handling
main()
  .catch((error: Error) => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('❌ Error disconnecting from database:', disconnectError);
    }
  });
