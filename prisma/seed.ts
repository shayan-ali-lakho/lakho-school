import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { AppRole as Role } from "../src/lib/roles";

// Demo data only. Never put real student data in the test site.
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL (or DIRECT_URL) before seeding.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? "ChangeMe123!";

async function upsertUser(email: string, name: string, role: Role, passwordHash: string) {
  return db.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role, passwordHash },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await upsertUser("admin@school.test", "Demo Admin", "ADMIN", passwordHash);
  await upsertUser("principal@school.test", "Demo Principal", "PRINCIPAL", passwordHash);
  await upsertUser("accountant@school.test", "Demo Accountant", "ACCOUNTANT", passwordHash);

  const teacherUser = await upsertUser("teacher@school.test", "Demo Teacher", "TEACHER", passwordHash);
  const teacher = await db.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id },
  });

  const academicYear = "2026-2027";
  const classFive = await db.class.upsert({
    where: { name_section_academicYear: { name: "Class 5", section: "A", academicYear } },
    update: { classTeacherId: teacher.id },
    create: { name: "Class 5", section: "A", academicYear, classTeacherId: teacher.id },
  });

  const parentUser = await upsertUser("parent@school.test", "Demo Parent", "PARENT", passwordHash);
  const guardian = await db.guardian.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id },
  });

  const studentUser = await upsertUser("student@school.test", "Demo Student", "STUDENT", passwordHash);
  await db.student.upsert({
    where: { userId: studentUser.id },
    update: { classId: classFive.id, guardianId: guardian.id },
    create: { userId: studentUser.id, rollNumber: "001", classId: classFive.id, guardianId: guardian.id },
  });

  const existing = await db.announcement.count();
  if (existing === 0) {
    await db.announcement.createMany({
      data: [
        {
          title: "Welcome to the new school portal",
          body: "This is a demo announcement. Staff can post notices here for students and parents.",
          audience: ["STUDENT", "PARENT", "TEACHER"],
          isPublic: true,
          authorId: admin.id,
        },
        {
          title: "Staff meeting on Monday",
          body: "All teachers are requested to attend the staff meeting after assembly.",
          audience: ["TEACHER", "PRINCIPAL"],
          isPublic: false,
          authorId: admin.id,
        },
      ],
    });
  }

  console.log("Seed complete. Demo logins use password:", DEMO_PASSWORD);
  console.log("admin@school.test, principal@school.test, teacher@school.test,");
  console.log("accountant@school.test, parent@school.test, student@school.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
