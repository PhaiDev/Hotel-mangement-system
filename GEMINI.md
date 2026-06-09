# Project Overview: SUMOTEL Admin Dashboard

SUMOTEL (also referred to as ZUMOTEL in development logs) is a Property Management System (PMS) designed for managing hotel room bookings, status, and analytics. It is built as a modern web application with a focus on administrative efficiency.

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion, Chart.js.
- **Backend/Infrastructure:** Supabase (PostgreSQL, Auth, Storage) integrated via Next.js API Routes.
- **Architecture:** The project is migrating from direct client-side Supabase interaction to a structured backend layer:
  - **API Routes:** `app/api/*` handle requests and business logic.
  - **Services:** `lib/services/*` contain high-level business rules.
  - **Repositories:** `lib/repositories/*` handle direct database access via `supabaseAdmin`.
  - **Validators:** `lib/validators/*` ensure data integrity before processing.

## Building and Running

### Prerequisites
- Node.js (Latest LTS recommended)
- A Supabase project with the required schema (see `README.md` for SQL definitions).

### Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start the development server at `http://localhost:3000`.
- `npm run build`: Build the project for production.
- `npm run start`: Start the production server.
- `npm run lint`: Run ESLint for code quality checks.

## Development Conventions

### Coding Standards
- **Strict TypeScript:** Use strict-safe patterns; avoid `any`. Define interfaces/types in `lib/types`.
- **Layered Logic:** When adding new features, follow the Repository -> Service -> API Route pattern. Avoid direct database calls from frontend components when possible.
- **UI Components:** Reusable components reside in `components/`. Use `<BookingModal />` and `<BookingDetailModal />` for booking interactions.
- **Thai Language:** Preserve Thai copy in the UI as the system is primarily used by Thai-speaking staff.

### UI/UX Guidelines
- **Visual Consistency:** Follow the existing aesthetic (dark/modern dashboard with vibrant highlights).
- **Feedback:** Use `SweetAlert2` for alerts and confirmations, but use React components/modals for complex forms.
- **Responsive Design:** Ensure all dashboard features are accessible on both desktop and mobile views.

### Database Interaction
- Use `supabaseAdmin` for backend operations requiring elevated privileges.
- Use `createClient` from `@/lib/supabase/client` for client-side authentication and session management.

## Project Structure
- `app/admin/`: Admin dashboard pages (Bookings, Rooms, Analytics, Settings).
- `app/api/`: Backend API endpoints.
- `lib/`: Core logic, including:
  - `repositories/`: Data access layer.
  - `services/`: Business logic layer.
  - `validators/`: Input validation.
  - `supabase/`: Supabase client configurations (client, server, admin, middleware).
- `public/`: Static assets (images, icons).

## Documentation Reference
- `README.md`: General overview, database schema, and storage plans.
- `PROJECT_ROADMAP.md`: High-level goals and phase descriptions.
- `DEV_LOG.md`: Detailed changelog and execution tracking.
- `AGENTS.md`: Specific rules and instructions for AI agents working in this repository.
