# Course Manager — Learning Management System (LMS)

A full-stack Learning Management System built with Next.js, TypeScript, Prisma, Neon PostgreSQL, Better Auth, and Supabase. The platform provides separate experiences for administrators and students to manage courses, learning materials, assignments, submissions, and academic schedules.

**Live Demo:** https://course-manager-silk.vercel.app/

## Features

### Authentication & Authorization
- Secure authentication with Better Auth.
- Separate admin and student dashboards.
- Role-based access control for protected pages and API routes.
- Student-specific assignment submissions.

### Admin Dashboard
- Manage courses and course information.
- Manage student records.
- Create and manage assignments.
- Upload and manage learning materials.
- Manage assignment files.
- Organize academic timetables.
- View dashboard statistics.

### Student Dashboard
- Browse available courses.
- Access course information and learning materials.
- View assignments and submit work.
- Access academic timetables.
- Track focus time and study sessions.

### File Management
- Upload and manage course materials.
- Attach files to assignments.
- Store files using Supabase Storage.

### Database & API
- PostgreSQL database hosted on Neon.
- Database access through Prisma ORM.
- REST API routes built with Next.js Route Handlers.
- Server-side validation and role-based authorization.

### Deployment
- Deployed on Vercel.
- Production environment variables configured separately from local development.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack React framework |
| React | User interface |
| TypeScript | Type safety |
| Tailwind CSS | Styling and responsive layouts |
| HeroUI | UI components |
| Better Auth | Authentication and sessions |
| Prisma ORM | Database access |
| Neon PostgreSQL | Cloud database |
| Supabase Storage | File storage |
| Vercel | Deployment |

## Project Structure

```text
course-manager/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assignments/
│   │   │   ├── courses/
│   │   │   ├── dashboard/
│   │   │   ├── materials/
│   │   │   ├── students/
│   │   │   ├── timetable/
│   │   │   └── student/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── student/
│   │   └── page.tsx
│   ├── proxy.ts
│   └── ...
├── public/
├── .env.example
├── package.json
└── README.md
```

*The structure above is a simplified overview; individual files may vary.*

## Getting Started

Follow these instructions to run the project locally.

### Prerequisites

Make sure you have the following installed or configured:

- Node.js (compatible with your Next.js version)
- npm
- A Neon PostgreSQL database
- A Supabase project with Storage configured
- Authentication credentials required by your configuration

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd course-manager
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

Add the environment variables required by your application:

```env
DATABASE_URL="YOUR_NEON_POOLED_CONNECTION_STRING"
DIRECT_URL="YOUR_NEON_DIRECT_CONNECTION_STRING"

BETTER_AUTH_SECRET="YOUR_AUTH_SECRET"
BETTER_AUTH_URL="http://localhost:3000"

NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
SUPABASE_SECRET_KEY="YOUR_SUPABASE_SECRET_KEY"
```

If your project uses Google OAuth or other authentication providers, add their required environment variables as well.

**Important:**
- Replace the placeholders with your actual credentials.
- Check your application code for the exact environment variable names it expects.
- Never commit `.env` or expose database passwords, authentication secrets, or Supabase secret keys.
- Keep `.env` in `.gitignore`.

### 4. Configure the database

Ensure your Neon PostgreSQL database is accessible and your connection strings are configured correctly.

If your project already has Prisma migrations, apply them using:

```bash
npx prisma migrate deploy
```

Use this command only if your project has migration files under `prisma/migrations`. Follow your existing Prisma configuration if your database was initialized using a different workflow.

### 5. Start the development server

```bash
npm run dev
```

Open the application in your browser:

http://localhost:3000

### 6. Create a production build

To verify that the project compiles successfully:

```bash
npm run build
```

## Deployment

The project is deployed using Vercel.

To deploy your own instance:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables in Vercel Project Settings.
4. Set production authentication URLs to your deployed domain.
5. Ensure the production database schema is up to date.
6. Deploy the project and test the authentication, database, and file-upload functionality.

Live application: https://course-manager-silk.vercel.app/

## Security Considerations

- Keep secrets in environment variables.
- Enforce role-based authorization on protected API routes.
- Ensure students can access only their own private submissions.
- Restrict administrative operations to authorized administrators.
- Configure production authentication URLs and trusted origins correctly.
- Review database permissions and file-storage access policies before production use.

## Future Improvements

Potential enhancements include:

- Online quizzes and examinations.
- Assignment grading and instructor feedback.
- Course progress tracking.
- Announcements and notifications.
- Attendance management.
- Video lessons and structured learning modules.
- Certificates of completion.
- Analytics for students and administrators.

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a pull request describing your changes.

## Author

Juadul Ahmed Bhuiyan — Software Engineering Student & Full-Stack Web Developer

I'm a Software Engineering student at Sichuan University, passionate about building modern, responsive, and user-friendly web applications.

Portfolio: https://jaadul.dev

Live Project: https://course-manager-silk.vercel.app/

Tech Interests

Next.js · React · TypeScript · Node.js · Express.js · PostgreSQL · Prisma

If you like this project, feel free to explore the code and connect with me!
