# 🎓 Teacher Evaluation System

A comprehensive web-based platform for conducting teacher classroom observations and evaluations with real-time scoring, progress tracking, and detailed reporting.

## ✨ Features

- **📝 Complete Observation Forms** - Comprehensive rubric-based evaluation system
- **🎯 Real-time Scoring** - Interactive 5-point rating scale with instant calculations
- **📊 Progress Tracking** - Visual progress bars and completion indicators
- **🏫 Multi-branch Support** - Manage multiple school branches and locations
- **👨‍🏫 Teacher Management** - Organize and track teacher information
- **🔐 Secure Authentication** - Role-based access control with NextAuth.js
- **💾 Data Persistence** - PostgreSQL database with Prisma ORM
- **📱 Responsive Design** - Modern UI built with Tailwind CSS
- **⚡ Real-time Updates** - Instant feedback and validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### 1. Clone and Install
```bash
git clone <repository-url>
cd teacher_eval_web
npm install
```

### 2. Environment Setup
```bash
# Copy the template
cp env.template .env.local

# Edit .env.local with your database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/teacher_eval_db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup
```bash
# Quick PostgreSQL with Docker
docker run --name teacher-eval-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=teacher_eval_db -p 5432:5432 -d postgres:15

# Setup database
npx prisma db push
npm run db:seed
```

### 4. Start Development
```bash
npm run dev
```

### 5. Access Application
- Open: http://localhost:3000
- Sign in: **admin@school.com** / **password123**

## 🏗️ Architecture

- **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: NextAuth.js with JWT sessions
- **Security**: Rate limiting, input validation, security headers

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API endpoints
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Main application
├── components/             # React components
├── lib/                   # Utilities and configurations
├── types/                 # TypeScript type definitions
├── utils/                 # Helper functions
└── data/                  # Sample data and constants
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run type-check` - TypeScript type checking
- `npm run db:seed` - Seed database with sample data
- `npm run db:generate` - Generate Prisma client

## 🎯 Core Components

### Observation Form
- Complete teacher evaluation form with all rubric items
- Real-time scoring and validation
- Progress tracking and completion indicators

### Rubric System
- 6 evaluation domains with 24 total criteria
- 5-point rating scale (Excellent to Unsatisfactory)
- Detailed descriptions for each rating level

### Scoring Engine
- Automatic domain score calculations
- Overall rating determination
- Progress percentage tracking

## 🔐 Security Features

- **Authentication**: Secure login with password hashing
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive form validation
- **Rate Limiting**: API endpoint protection
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## 📊 Sample Data

The system comes pre-loaded with:
- **3 Sample Branches** - Main Campus, North Branch, South Branch
- **5 Sample Teachers** - Various subjects and specializations
- **Complete Rubric** - 6 domains with 24 evaluation criteria
- **Demo Users** - Admin, Observer, Reviewer, Teacher roles

## 🚧 Development Status

- ✅ **Alpha Version Complete** - Fully functional observation system
- ✅ **Core Features** - Form, scoring, validation, persistence
- ✅ **Security** - Authentication, authorization, protection
- ✅ **UI/UX** - Modern, responsive interface
- 🔄 **In Progress** - Admin panels, advanced reporting
- 📋 **Planned** - PDF export, advanced analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the `setup.md` file for detailed setup instructions
- Review the API documentation in the codebase
- Open an issue for bugs or feature requests

---

**🎉 Ready to evaluate teachers? Get started with the quick setup above!**
