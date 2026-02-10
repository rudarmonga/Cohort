import "dotenv/config";
import { PrismaClient, ProjectRole, TaskStatus } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  // 1️⃣ User (email is unique → upsert OK)
  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      name: "Admin User",
      age: 22,
      email: "admin@test.com",
      password: "hashed-password",
    },
  });

  const teamMember = await prisma.user.upsert({
    where: { email: "member@test.com" },
    update: {},
    create: {
      name: "Team Member",
      age: 30,
      email: "member@test.com",
      password: "hashed-password",
    },
  });


  // 2️⃣ Project (name is NOT unique → use create)
  const project = await prisma.project.create({
    data: {
      name: "Demo Project",
      description: "Initial seeded project",
    },
  });

  // 3️⃣ Project membership (composite unique → upsert OK)
  const projectUser1 = await prisma.projectUser.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: admin.id, 
      role: ProjectRole.ADMIN,
    },
  });

  const projectUser2 = await prisma.projectUser.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: teamMember.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: teamMember.id,
      role: ProjectRole.MEMBER,
    },
  });

  // 4️⃣ Task (title NOT unique → use create)
  await prisma.task.create({
    data: {
      title: "Initial Task",
      description: "Seeded task for testing",
      status: TaskStatus.TODO,
      projectId: project.id,
      projectUserId: projectUser1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Initial Task",
      description: "Seeded task for testing",
      status: TaskStatus.DONE,
      projectId: project.id,
      projectUserId: projectUser2.id,
    },
  });

  console.log("🌱 Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
