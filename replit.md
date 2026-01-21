# AutoGarage CRM

## Overview

AutoGarage CRM is a web-based customer relationship management system designed for auto garages. It manages customers, vehicles, service jobs, technicians, inventory, appointments, billing, and WhatsApp automation. The application follows a job funnel workflow where each service visit moves through stages: New Lead → Inspection Done → Work In Progress → Ready for Delivery → Completed/Cancelled.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite
- **Charts**: Recharts for dashboard visualizations

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: REST endpoints under `/api/*`
- **Database ORM**: Mongoose for MongoDB
- **Schema Validation**: Zod with drizzle-zod integration

### Data Storage
- **Primary Database**: MongoDB (connected via `MONGODB_URI` environment variable)
- **Data Models**: Customer, Job, Technician, Inventory, Appointment, WhatsAppTemplate, Admin
- **Note**: Drizzle config exists for PostgreSQL but MongoDB/Mongoose is the active database layer

### Key Design Patterns
- **Monorepo Structure**: Client (`client/`), server (`server/`), and shared code (`shared/`)
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Storage Layer**: Abstract storage interface (`server/storage.ts`) for all database operations
- **API Client**: Centralized API wrapper (`client/src/lib/api.ts`) for frontend requests

### Authentication
- **Admin Login**: Email/password authentication stored in MongoDB `admin` collection
- **Default Credentials**: Autogarage@system.com / Autogarage
- **Auth Context**: React context for managing authentication state
- **Protected Routes**: All routes require authentication except `/login`

### Core Business Logic
- Customers can have multiple vehicles
- Each vehicle can have multiple service jobs
- Jobs progress through defined stages with WhatsApp notifications: New Lead → Inspection Done → Work In Progress → Ready for Delivery → Completed
- Job cards track services, materials, payments, and technician assignments
- Invoices track billing and payment status, supporting various payment modes (Cash, UPI, Card, Bank Transfer, Credit Card, Debit Card, Cheque, Other)
- 'Other' payment mode allows entering specific payment details (e.g. Reference No.)
- Inventory tracks stock levels with low-stock alerts
- Stock automatically reduces when materials are used in services (Stock In remains manual)

## External Dependencies

### Database
- **MongoDB**: Primary data store (requires `MONGODB_URI` environment variable)
- **PostgreSQL**: Configuration exists via Drizzle but not actively used

### Third-Party Services
- **WhatsApp API**: Placeholder functions for stage-based messaging automation (not yet integrated with real API)

### Key npm Packages
- `mongoose`: MongoDB ODM
- `express`: HTTP server framework
- `@tanstack/react-query`: Data fetching and caching
- `recharts`: Dashboard charts
- `date-fns`: Date formatting utilities
- `zod`: Runtime schema validation
- `html2pdf.js`: Client-side PDF generation

## Recent Changes (Dec 29, 2025)

### PDF Generation & Management Optimization
**Problem**: PDF generation was inefficient - each Send WhatsApp action regenerated PDFs even if they already existed, causing duplicate files and slower performance.

**Solution**: Implemented a dual-strategy PDF workflow:

1. **Download Button Enhancement**:
   - Saves PDF to server (`public/quotations/`) with customer name in filename
   - Simultaneously downloads PDF to user's computer
   - Filename format: `quote_CUSTOMERNAME_INQUIRYID_TIMESTAMP.pdf`
   - Toast notification confirms successful save

2. **Send WhatsApp Optimization**:
   - Checks if PDF already exists using new `/api/check-pdf/:inquiryId` endpoint
   - Reuses existing PDF if available (saves processing time)
   - Only generates new PDF if none exists
   - Shares public link to PDF in WhatsApp message
   - Shows "Using existing quotation..." toast when PDF is found

3. **Backend Improvements**:
   - `/api/save-pdf` endpoint now accepts `customerName` query parameter
   - Implements smart PDF filename format with customer name for easy identification
   - Checks for existing PDFs before saving to prevent duplicates
   - New `/api/check-pdf/:inquiryId` GET endpoint to verify PDF existence
   - Updated `/api/delete-pdf/:inquiryId` to match flexible filename patterns

**Benefits**:
- Faster WhatsApp sharing (no regeneration needed if PDF exists)
- Better file organization with customer names in filenames
- Reduced server storage from duplicate PDFs
- Consistent customer experience with shareable links