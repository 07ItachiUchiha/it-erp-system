# IT ERP System

**PROPRIETARY SOFTWARE - Copyright (c) 2025 DevSum IT Studio**

 **IMPORTANT NOTICE:** This software is proprietary and protected by copyright. 
Copying, distribution, or use without proper licensing is strictly prohibited. 
To purchase a license, contact DevSum IT Studio at devsumstudio@gmail.com

## Overview

IT ERP System is a comprehensive Enterprise Resource Planning (ERP) solution designed for IT and service-based companies. It provides modular business management features, including user and employee management, finance, procurement, inventory, HR, sales, projects, notifications, and file/document management. The system is built with a modern web stack: NestJS (backend), Next.js (frontend), and PostgreSQL (database).

## Technology Stack

- Backend: NestJS (Node.js, TypeScript)
- Frontend: Next.js (React, TypeScript)
- Database: PostgreSQL (TypeORM)
- Styling: Tailwind CSS
- State Management: React Context API
- Authentication: JWT, bcrypt
- API: RESTful, GraphQL (partial)

## System Architecture

### Architecture Overview

The IT ERP System follows a modular monolith architecture with clear separation of concerns between frontend, backend, and database layers. The system is designed for scalability and maintainability with a modern web application stack.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Next.js Frontend (React + TypeScript)                     │
│  ├── Pages (Next.js Router)                                │
│  ├── Components (Reusable UI)                              │
│  ├── Contexts (State Management)                           │
│  ├── Services (API Integration)                            │
│  └── Utils (Helper Functions)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTP/HTTPS
                              │
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  NestJS Backend (Node.js + TypeScript)                     │
│  ├── Controllers (HTTP Request Handlers)                   │
│  ├── Services (Business Logic)                             │
│  ├── Modules (Feature Organization)                        │
│  ├── Guards (Authentication & Authorization)               │
│  ├── Decorators (Custom Logic)                             │
│  └── DTOs (Data Transfer Objects)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                           TypeORM
                              │
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                        │
│  ├── Tables (Entity Storage)                               │
│  ├── Relationships (Foreign Keys)                          │
│  ├── Indexes (Performance)                                 │
│  ├── Triggers (Business Rules)                             │
│  └── Migrations (Schema Management)                        │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### Frontend Architecture (Next.js)
- **Pages**: Next.js file-based routing for different application screens
- **Components**: Modular React components organized by feature/functionality
- **Contexts**: React Context API for global state management (Auth, Theme)
- **Services**: API communication layer with backend services
- **Utils**: Utility functions and helpers for common operations

#### Backend Architecture (NestJS)
- **Modules**: Feature-based modules (Auth, Users, Finance, etc.)
- **Controllers**: HTTP request handlers with route definitions
- **Services**: Business logic implementation and data processing
- **Entities**: TypeORM entities representing database tables
- **DTOs**: Data Transfer Objects for request/response validation
- **Guards**: Authentication and authorization middleware
- **Decorators**: Custom decorators for roles and permissions

#### Database Architecture (PostgreSQL)
- **Normalized Schema**: Properly normalized database design
- **Entity Relationships**: Well-defined foreign key relationships
- **Indexes**: Performance optimization through strategic indexing
- **Migrations**: Version-controlled schema changes
- **Enums**: Type-safe enumeration values

## System Flow and Working

### 1. Authentication Flow

```
User Login Request → Frontend (Next.js)
    ↓
Credentials Sent → Backend Auth Controller
    ↓
Validation → Auth Service
    ↓
Password Check → bcrypt comparison
    ↓
JWT Generation → JWT Service
    ↓
Token Response → Frontend Storage (localStorage)
    ↓
Subsequent Requests → Include JWT in headers
    ↓
Token Validation → JWT Guard
    ↓
Role/Permission Check → Role Guard
    ↓
Access Granted/Denied
```

### 2. Data Flow Pattern

```
User Action (Frontend)
    ↓
API Call (Service Layer)
    ↓
HTTP Request (Axios)
    ↓
Backend Controller (Route Handler)
    ↓
Service Method (Business Logic)
    ↓
Repository (TypeORM)
    ↓
Database Query (PostgreSQL)
    ↓
Response Data
    ↓
Frontend Update (State/UI)
```

### 3. Module Interaction Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     Users    │◄──►│   Employees  │◄──►│      HR      │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     Auth     │◄──►│   Finance    │◄──►│  Procurement │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Inventory   │◄──►│    Sales     │◄──►│   Projects   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 4. Request Lifecycle

#### Frontend Request Lifecycle
1. **User Interaction**: User clicks button or submits form
2. **Event Handler**: React component handles the event
3. **Service Call**: Component calls appropriate service method
4. **API Request**: Service makes HTTP request to backend
5. **Response Handling**: Service processes response or error
6. **State Update**: Component updates local/global state
7. **UI Render**: React re-renders affected components

#### Backend Request Lifecycle
1. **Request Reception**: NestJS receives HTTP request
2. **Route Matching**: Router matches request to controller method
3. **Middleware Execution**: Guards, interceptors, and pipes execute
4. **Controller Method**: Controller method processes request
5. **Service Execution**: Business logic executes in service layer
6. **Database Operation**: TypeORM performs database operations
7. **Response Formation**: Controller formats and returns response

### 5. Security Flow

```
Request → CORS Check → JWT Validation → Role Check → Permission Check → Resource Access
    ↓           ↓            ↓             ↓              ↓               ↓
  Allow     Validate     Decode JWT    Check User     Check Action    Grant/Deny
            Origin       & Verify      Role           Permission      Access
```

### 6. Error Handling Flow

```
Error Occurrence
    ↓
Exception Filter (Backend)
    ↓
Error Logging
    ↓
Formatted Error Response
    ↓
Frontend Error Handler
    ↓
User Notification
    ↓
Error Recovery/Retry
```

### 7. Database Transaction Flow

```
Service Method Start
    ↓
Begin Transaction
    ↓
Multiple Operations
    ↓
Validation Check
    ↓
Commit/Rollback
    ↓
Response/Error
```

## Scalability Considerations

### Current Architecture Benefits
- **Modular Design**: Easy to maintain and extend individual modules
- **Separation of Concerns**: Clear boundaries between layers
- **Type Safety**: TypeScript throughout the stack
- **ORM Benefits**: Database abstraction and migration management
- **Role-Based Security**: Scalable permission system

### Future Scalability Path
- **Phase 1**: Modular monolith (current)
- **Phase 2**: Microservices decomposition by domain
- **Phase 3**: Multi-tenant SaaS platform
- **Performance**: Caching layer, CDN, database optimization
- **Deployment**: Containerization, orchestration, CI/CD

## Project Structure

```
it-erp-system/
├── backend/         # NestJS backend application
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── database/       # Database config & migrations
│   │   └── ...
│   └── ...
├── frontend/        # Next.js frontend application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Next.js pages
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── ...
├── docs/            # Documentation
└── infrastructure/  # Infrastructure as code
```

## Features and Modules

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Six user roles: Admin, HR, Manager, Finance, Sales, Employee
- Granular permission system with resource-action mapping

### User Management
- Complete user lifecycle management
- Role assignment and permission control
- User profile management
- Department-based organization

### Employee Management
- Employee profile management
- Department and role assignment
- Employment status tracking
- Role-based data filtering (employees see only their own data)

### Finance Module
- Financial record management
- Budget tracking
- Expense management
- Role-based financial data access

### Procurement Module
- Procurement request management
- Multi-level approval workflow
- Vendor management
- Status tracking (draft, pending, approved, rejected, ordered, received)
- Role-based request filtering

### Inventory Management
- Warehouse management
- Item/product management
- Stock movement tracking
- Barcode and batch/serial management
- Product variants
- Bill of Materials (BOM)
- Manufacturing orders and workstations

### HR Module
- Leave request management
- Payroll processing
- Performance reviews
- Attendance tracking
- Compliance tracking

### Sales Module
- Lead and opportunity management
- Customer and contact management
- Sales pipeline and quotation management
- Order and invoice management
- Sales analytics

### Projects Module
- Project creation and management
- Task assignment and tracking
- Team collaboration
- Project analytics and reporting

### Reports Module
- Generate various business reports
- Role-based report access
- Export functionality

### File Management
- Document upload and management
- File categorization
- Access control based on user roles

### Notifications Module
- Real-time and email notifications
- Notification templates
- User notification preferences

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/07ItachiUchiha/it-erp-system.git
cd it-erp-system
```

### 2. Setup Backend
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npm run db:create
npm run db:migrate

# Start backend server
npm run start:dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your API endpoints

# Start frontend development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Default User Accounts

After setting up the system, you can create users with different roles:

- **Admin**: Full system access
- **HR**: Employee and user management
- **Manager**: Department-level management
- **Finance**: Financial operations and approvals
- **Sales**: Sales-related operations
- **Employee**: Limited access to own data

## Role-Based Access Control

### Permission Matrix

| Module | Admin | HR | Manager | Finance | Sales | Employee |
|--------|-------|----|---------|---------| ------|----------|
| Users | CRUD | CRU | R | R | R | - |
| Employees | CRUD | CRUD | RU* | R | R* | R* |
| Finance | CRUD | R | RU* | CRUD | R* | R* |
| Procurement | CRUD+A | CRU+A | CRU | R+A | CR | CR |
| Files | CRUD | CRU | CRU | CRU | CRU | CR |
| Reports | CRUD | CR | CR | CR | CR | R* |

**Legend**: C=Create, R=Read, U=Update, D=Delete, A=Approve, *=Own data only

## Development

### Backend Development
```bash
cd backend
npm run start:dev    # Start development server
npm run test         # Run tests
npm run build        # Build for production
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
```

## Deployment

### Production Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Build and deploy backend
4. Build and deploy frontend
5. Set up reverse proxy (nginx)

### Environment Variables

#### Backend (.env)
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=it_erp_system
JWT_SECRET=your_jwt_secret
PORT=3001
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Roadmap

- Advanced reporting and analytics
- Mobile application
- Integration with third-party services
- Advanced workflow management
- Real-time notifications
- Audit logging and compliance

## Contributing

This is proprietary software owned by DevSum IT Studio. Contributing is not permitted 
without explicit written permission and a signed contributor agreement.

## License

**PROPRIETARY LICENSE - ALL RIGHTS RESERVED**

This project is the exclusive property of DevSum IT Studio. Copying, distribution, 
modification, or use without proper licensing is strictly prohibited and may result 
in legal action.

**To Purchase License:** Contact DevSum IT Studio
- Email: devsumstudio@gmail.com  
- Website: www.devsumstudio.com

See the LICENSE file for complete terms and conditions.

---

**Built with using NestJS and Next.js**

Copyright (c) 2025 DevSum IT Studio. All Rights Reserved.
