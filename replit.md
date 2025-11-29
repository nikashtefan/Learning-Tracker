# Overview

This is a full-stack web application built with React and Express, using TypeScript throughout. The application features a modern UI built with shadcn/ui components and Radix UI primitives, styled with Tailwind CSS. It's configured to run on Replit with support for Supabase as the backend database service. The project includes a test data management system with CRUD operations for test items.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching

**UI Component System**
- shadcn/ui component library with the "new-york" style variant
- Radix UI primitives for accessible, unstyled component foundations
- Tailwind CSS v4 for utility-first styling with custom theme configuration
- Custom CSS variables for theming (light/dark mode support)

**Design Decisions**
- Component aliases configured for clean imports (`@/components`, `@/lib`, etc.)
- All UI components are located in `client/src/components/ui/` with consistent patterns
- Form handling uses react-hook-form with Zod validation for type-safe forms
- Toast notifications system for user feedback

## Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- HTTP server created with Node's built-in `http` module
- Custom middleware for request logging with timestamps
- JSON body parsing with raw body capture for webhook support

**Development vs Production**
- Development mode uses Vite middleware for HMR and live reloading
- Production mode serves pre-built static files from `dist/public`
- Build process bundles server code with esbuild for faster cold starts
- Selected dependencies are bundled to reduce filesystem syscalls

**API Structure**
- RESTful API endpoints under `/api` prefix
- Routes defined in `server/routes.ts`
- Storage layer abstraction in `server/storage.ts` provides interface for data operations
- Seed endpoint available for populating test data

**Data Storage Layer**
- Interface-based storage design (`IStorage`) allows for easy swapping of implementations
- Current implementation (`DbStorage`) uses Drizzle ORM for database operations
- Separation of concerns: routes handle HTTP, storage handles data persistence

## Database & ORM

**Drizzle ORM Configuration**
- PostgreSQL dialect configured for Supabase compatibility
- Schema defined in `shared/schema.ts` for type sharing between client and server
- Schema includes:
  - `users` table with UUID primary keys, username/password fields
  - `test_items` table with serial IDs, title, description, and timestamps
- Zod schemas generated from Drizzle schemas for validation
- Migration files stored in `./migrations` directory

**Database Connection**
- Uses `postgres-js` driver for PostgreSQL connectivity
- Connection string from `DATABASE_URL` environment variable
- Database client singleton exported from `server/db.ts`

**Schema Design Philosophy**
- Type inference from Drizzle schemas ensures type safety
- Insert schemas exclude auto-generated fields (IDs, timestamps)
- Shared types between frontend and backend prevent type mismatches

## Build System

**Build Process**
- Client built with Vite, output to `dist/public`
- Server bundled with esbuild, output to `dist/index.cjs`
- Build script (`script/build.ts`) orchestrates both builds
- Selective dependency bundling for optimized cold start performance

**Development Workflow**
- Separate dev scripts for client (`dev:client`) and server (`dev`)
- Client runs on port 5000 during development
- Server automatically restarts on file changes using tsx
- TypeScript checking available via `check` script

## Environment Configuration

**Required Environment Variables**
- `DATABASE_URL` - PostgreSQL connection string for Supabase
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public API key

**Replit-Specific Features**
- Custom Vite plugins for Replit integration (cartographer, dev banner)
- Runtime error overlay plugin for better error visibility
- Meta image plugin automatically updates OpenGraph tags with Replit deployment URL

# External Dependencies

## Database Service
- **Supabase** - Managed PostgreSQL database service
  - Accessed via Supabase JS client REST API (`@supabase/supabase-js`)
  - Using `supabaseAdmin` client with service_role key for server-side operations
  - Storage layer (`SupabaseStorage`) provides CRUD operations via REST API
  - Note: Direct PostgreSQL connections are blocked by Replit network restrictions, so we use Supabase REST API instead

## Development Tools
- **Replit Platform Integration**
  - `@replit/vite-plugin-cartographer` - Development navigation
  - `@replit/vite-plugin-dev-banner` - Development mode indicator
  - `@replit/vite-plugin-runtime-error-modal` - Enhanced error reporting

## Key Third-Party Libraries
- **UI & Styling**
  - `@radix-ui/*` - Comprehensive set of accessible UI primitives
  - `tailwindcss` - Utility-first CSS framework
  - `class-variance-authority` - Component variant handling
  - `lucide-react` - Icon library

- **Forms & Validation**
  - `react-hook-form` - Performant form library
  - `zod` - TypeScript-first schema validation
  - `@hookform/resolvers` - Zod integration for react-hook-form

- **Data Fetching**
  - `@tanstack/react-query` - Server state management
  - `wouter` - Lightweight routing library

- **Database & ORM**
  - `drizzle-orm` - TypeScript ORM
  - `drizzle-zod` - Zod schema generation from Drizzle schemas
  - `postgres` - PostgreSQL client (postgres-js)