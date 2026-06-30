/* eslint-disable no-console */
// prisma/seed.ts
import { PrismaClient, Stage, Role, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("Password123!", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      username: "alice",
      email: "alice@example.com",
      password: hashedPassword,
      age: 28,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      username: "bob",
      email: "bob@example.com",
      password: hashedPassword,
      age: 32,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "OpenBudget",
      description:
        "A free, open-source personal finance tracker for individuals and families.",
      techStack: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS"],
      stage: Stage.IN_DEVELOPMENT,
      lookingFor: ["Frontend Developer", "UI Designer"],
      createdById: alice.id,
      members: {
        create: [
          { userId: alice.id, role: Role.OWNER },
          { userId: bob.id, role: Role.MEMBER },
        ],
      },
      tasks: {
        create: [
          {
            title: "Design system setup",
            description: "Configure Tailwind and component library",
            status: TaskStatus.DONE,
            assigneeId: alice.id,
          },
          {
            title: "Auth flow implementation",
            description: "Implement login, signup and session management",
            status: TaskStatus.IN_PROGRESS,
            assigneeId: bob.id,
          },
          {
            title: "Budget tracking UI",
            description: "Build the main budget dashboard",
            status: TaskStatus.TODO,
          },
        ],
      },
    },
  });

  console.log("✅ Seed complete:", { alice, bob, project });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
