import { RubricDomain, Branch, Teacher } from '@/types';

export const SAMPLE_RUBRIC_DOMAINS: RubricDomain[] = [
  {
    id: 'domain-1',
    name: 'Planning & Preparation',
    description: 'Teacher preparation and lesson planning effectiveness',
    orderIndex: 1,
    items: [
      {
        id: 'item-1-1',
        domainId: 'domain-1',
        number: 1,
        prompt: 'Arrives on time and well prepared for the lesson',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-1-2',
        domainId: 'domain-1',
        number: 2,
        prompt: 'Has clear lesson objectives and learning outcomes',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-1-3',
        domainId: 'domain-1',
        number: 3,
        prompt: 'Prepares appropriate teaching materials and resources',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-1-4',
        domainId: 'domain-1',
        number: 4,
        prompt: 'Plans activities that engage different learning styles',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    ]
  },
  {
    id: 'domain-2',
    name: 'Content Knowledge',
    description: 'Teacher mastery of subject matter and curriculum',
    orderIndex: 2,
    items: [
      {
        id: 'item-2-1',
        domainId: 'domain-2',
        number: 1,
        prompt: 'Demonstrates thorough knowledge of the subject matter',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-2-2',
        domainId: 'domain-2',
        number: 2,
        prompt: 'Presents content accurately and without errors',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-2-3',
        domainId: 'domain-2',
        number: 3,
        prompt: 'Connects lesson content to real-world applications',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-2-4',
        domainId: 'domain-2',
        number: 4,
        prompt: 'Integrates cross-curricular connections appropriately',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    ]
  },
  {
    id: 'domain-3',
    name: 'Teaching Methodology',
    description: 'Effectiveness of instructional strategies and delivery',
    orderIndex: 3,
    items: [
      {
        id: 'item-3-1',
        domainId: 'domain-3',
        number: 1,
        prompt: 'Uses varied instructional strategies to meet learning objectives',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-3-2',
        domainId: 'domain-3',
        number: 2,
        prompt: 'Provides clear explanations and demonstrations',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-3-3',
        domainId: 'domain-3',
        number: 3,
        prompt: 'Uses questioning techniques to promote critical thinking',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-3-4',
        domainId: 'domain-3',
        number: 4,
        prompt: 'Adapts teaching methods based on student responses',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    ]
  },
  {
    id: 'domain-4',
    name: 'Classroom Management',
    description: 'Organization and discipline in the learning environment',
    orderIndex: 4,
    items: [
      {
        id: 'item-4-1',
        domainId: 'domain-4',
        number: 1,
        prompt: 'Maintains an organized and conducive learning environment',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-4-2',
        domainId: 'domain-4',
        number: 2,
        prompt: 'Establishes and maintains clear behavioral expectations',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-4-3',
        domainId: 'domain-4',
        number: 3,
        prompt: 'Manages transitions between activities smoothly',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-4-4',
        domainId: 'domain-4',
        number: 4,
        prompt: 'Handles disruptive behavior appropriately and consistently',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    ]
  },
  {
    id: 'domain-5',
    name: 'Student Engagement',
    description: 'How well students are involved and motivated in learning',
    orderIndex: 5,
    items: [
      {
        id: 'item-5-1',
        domainId: 'domain-5',
        number: 1,
        prompt: 'Students are actively engaged in learning activities',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-5-2',
        domainId: 'domain-5',
        number: 2,
        prompt: 'Students demonstrate enthusiasm and interest in the lesson',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-5-3',
        domainId: 'domain-5',
        number: 3,
        prompt: 'Students participate willingly in discussions and activities',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-5-4',
        domainId: 'domain-5',
        number: 4,
        prompt: 'Students show evidence of understanding and learning',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    ]
  },
  {
    id: 'domain-6',
    name: 'Assessment & Feedback',
    description: 'Evaluation methods and student progress monitoring',
    orderIndex: 6,
    items: [
      {
        id: 'item-6-1',
        domainId: 'domain-6',
        number: 1,
        prompt: 'Uses appropriate assessment methods to evaluate learning',
        orderIndex: 1,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-6-2',
        domainId: 'domain-6',
        number: 2,
        prompt: 'Provides timely and constructive feedback to students',
        orderIndex: 2,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-6-3',
        domainId: 'domain-6',
        number: 3,
        prompt: 'Monitors student progress and adjusts instruction accordingly',
        orderIndex: 3,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      },
      {
        id: 'item-6-4',
        domainId: 'domain-6',
        number: 4,
        prompt: 'Encourages student self-assessment and reflection',
        orderIndex: 4,
        maxScore: 4,
        scaleMin: 0,
        scaleMax: 4
      }
    ]
  }
];

export const SAMPLE_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'Main Campus',
    address: '123 Education Street, City Center',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'branch-2',
    name: 'North Branch',
    address: '456 Learning Avenue, North District',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'branch-3',
    name: 'South Branch',
    address: '789 Knowledge Road, South Area',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const SAMPLE_TEACHERS: Teacher[] = [
  {
    id: 'teacher-1',
    fullName: 'Sarah Johnson',
    employeeId: 'T001',
    branchId: 'branch-1',
    subjectPrimary: 'Mathematics',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'teacher-2',
    fullName: 'Michael Chen',
    employeeId: 'T002',
    branchId: 'branch-1',
    subjectPrimary: 'Science',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'teacher-3',
    fullName: 'Emily Rodriguez',
    employeeId: 'T003',
    branchId: 'branch-2',
    subjectPrimary: 'English',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'teacher-4',
    fullName: 'David Thompson',
    employeeId: 'T004',
    branchId: 'branch-2',
    subjectPrimary: 'History',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'teacher-5',
    fullName: 'Lisa Wang',
    employeeId: 'T005',
    branchId: 'branch-3',
    subjectPrimary: 'Art',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
