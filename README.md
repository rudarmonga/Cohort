# COHORT

A collaborative project management platform for developers, designers, founders, and students. Create projects, find collaborators, manage tasks on a kanban board, and track everything from a personal dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State | Redux Toolkit |
| Forms | React Hook Form + Zod |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jose) + HTTP-only cookies |
| Drag & Drop | dnd-kit |
| Notifications | React Hot Toast |
| Password | bcryptjs (cost 12) |

---

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** running locally or remotely
- **npm** or **pnpm**

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cohort_db"
JWT_SECRET="your-long-random-secret-at-least-32-chars"
```

Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
# Run migrations
npx prisma migrate dev --name init

# Generate the Prisma client
npx prisma generate

# (Optional) Seed with sample data
npm run db:seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:generate` | Regenerate Prisma client |

---

## Project Structure

```
cohort/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data seeder
│
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated route group
│   │   │   ├── dashboard/     # User dashboard
│   │   │   ├── discover/      # Project discovery
│   │   │   └── project/       # Project pages
│   │   │       ├── new/       # Create project
│   │   │       └── [id]/      # Project detail + kanban
│   │   │
│   │   ├── api/               # API route handlers
│   │   │   ├── auth/          # login, signup
│   │   │   ├── dashboard/     # Dashboard data
│   │   │   ├── project/       # Project CRUD + joins
│   │   │   ├── tasks/         # Task update/delete
│   │   │   └── users/         # Profile management
│   │   │
│   │   ├── auth/              # Login + Signup pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/
│   │   ├── layout/            # Navbar, ReduxProvider
│   │   ├── project/           # ProjectCard
│   │   ├── task/              # KanbanBoard, AddTaskModal
│   │   └── ui/                # Spinner, EmptyState, ConfirmModal
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── jwt.ts             # Token sign/verify (jose)
│   │   ├── auth.ts            # getCurrentUser helper
│   │   ├── validators.ts      # Zod schemas
│   │   └── api-response.ts    # Standardised response helpers
│   │
│   ├── store/
│   │   ├── index.ts           # Redux store
│   │   ├── authSlice.ts       # Auth state
│   │   └── hooks.ts           # Typed useAppSelector/Dispatch
│   │
│   ├── types/
│   │   └── index.ts           # Shared TypeScript types
│   │
│   └── middleware.ts          # Route protection middleware
```

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| DELETE | `/api/auth/login` | Logout (clears cookie) |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Get full dashboard data |

### Projects
| Method | Path | Description |
|---|---|---|
| GET | `/api/project` | List all projects |
| POST | `/api/project` | Create project |
| GET | `/api/project/discovery` | Discover with filters |
| GET | `/api/project/:id` | Get project detail |
| PUT | `/api/project/:id` | Update project (owner/admin) |
| DELETE | `/api/project/:id` | Delete project (owner only) |

### Members & Requests
| Method | Path | Description |
|---|---|---|
| POST | `/api/project/join-request` | Send join request |
| PUT | `/api/project/join-request/:id` | Accept or reject request |
| DELETE | `/api/project/leave/:id` | Leave a project |
| POST | `/api/project/transfer-ownership/:id` | Transfer project ownership |
| DELETE | `/api/project/:id/member/:userId` | Remove a member |

### Tasks
| Method | Path | Description |
|---|---|---|
| POST | `/api/project/:id/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task (status, assignee, etc.) |
| DELETE | `/api/tasks/:id` | Delete task |

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | Get own profile |
| PUT | `/api/users` | Update profile |
| DELETE | `/api/users` | Soft-delete account |

---

## Security Implementation

### Authentication
- **JWT via `jose`** — edge-runtime compatible, no Node.js crypto dependency issues
- **HTTP-only cookies** — tokens are inaccessible to JavaScript; prevents XSS token theft
- **`secure` flag** — cookies only sent over HTTPS in production
- **`sameSite: lax`** — CSRF protection while allowing normal navigation
- **7-day expiry** with automatic rejection of expired tokens

### Password Security
- **bcryptjs with cost factor 12** — tuned for ~300ms hash time; strong against brute force
- **Timing-safe login** — dummy hash compared even when user not found, preventing email enumeration via timing attacks
- **Password never returned** from any API — select statements explicitly exclude it

### Authorization
- **Every API route verifies the JWT** before any database operation
- **Role checks are server-side only** — client role state is display-only
- **Granular permission rules**:
  - Only OWNER can delete a project or transfer ownership
  - Only OWNER/ADMIN can accept/reject join requests
  - Only OWNER/ADMIN can remove members
  - ADMIN cannot remove other ADMINs or the OWNER
  - Only project members can create/update tasks
  - Task deletion requires OWNER/ADMIN role or being the assignee

### Input Validation
- **Zod schemas** validate every API input before it touches the database
- **Validation happens on the server** — client-side validation is UX only
- **Structured error responses** with field-level detail but no internal stack traces

### Data Integrity
- **Prisma transactions** used for multi-step operations (accept join request + create membership, transfer ownership swap)
- **Unique constraints** in the database prevent duplicate memberships and duplicate join requests
- **Cascade deletes** keep orphaned records from accumulating
- **Soft delete** for users preserves referential integrity for projects/tasks

### Error Handling
- **`withErrorHandling` wrapper** on all API routes catches unhandled errors and returns generic 500s — no stack traces or internal details leak to clients
- **Console logging** of server errors for debugging without exposing them externally

---

## Role Permissions Matrix

| Action | OWNER | ADMIN | MEMBER |
|---|:---:|:---:|:---:|
| View project | ✅ | ✅ | ✅ |
| Update project | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |
| Accept join requests | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅* | ❌ |
| Create tasks | ✅ | ✅ | ✅ |
| Update tasks | ✅ | ✅ | ✅ |
| Delete tasks | ✅ | ✅ | Own only |
| Leave project | ❌† | ✅ | ✅ |

*Admins can only remove regular members, not other admins or the owner.  
†Owner must transfer ownership first.

---

## Database Schema

```
User ──< ProjectUser >── Project ──< Task
              |                 \──< JoinRequest
              |
           (role: OWNER | ADMIN | MEMBER)
```

- **User** — registered account with soft-delete support
- **Project** — collaborative project with tech stack, stage, and roles
- **ProjectUser** — join table with role; unique per user+project
- **JoinRequest** — pending/accepted/rejected; unique per user+project
- **Task** — belongs to project; optional assignee

---

## Seeded Test Accounts

After running `npm run db:seed`:

| Name | Email | Password |
|---|---|---|
| Alice Johnson | alice@example.com | Password123! |
| Bob Smith | bob@example.com | Password123! |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens (min 32 chars) |
| `NODE_ENV` | — | `development` or `production` |
