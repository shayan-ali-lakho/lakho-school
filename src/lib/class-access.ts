import { db } from "@/lib/db";
import { STAFF_ROLES, type AppRole } from "@/lib/roles";

export type ClassOption = { id: string; label: string };

/** The classes a signed-in user may look at: staff see all, a student their own, a parent their children's. */
export async function visibleClasses(user: { id: string; role: AppRole }): Promise<ClassOption[]> {
  const select = { id: true, name: true, section: true, academicYear: true } as const;
  let classes: { id: string; name: string; section: string; academicYear: string }[] = [];

  if (STAFF_ROLES.includes(user.role)) {
    classes = await db.class.findMany({
      orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
      select,
    });
  } else if (user.role === "STUDENT") {
    const s = await db.student.findUnique({ where: { userId: user.id }, select: { class: { select } } });
    if (s?.class) classes = [s.class];
  } else if (user.role === "PARENT") {
    const kids = await db.student.findMany({
      where: { guardian: { userId: user.id }, user: { isActive: true } },
      select: { class: { select } },
    });
    const seen = new Map<string, (typeof classes)[number]>();
    for (const k of kids) if (k.class) seen.set(k.class.id, k.class);
    classes = [...seen.values()];
  }
  return classes.map((c) => ({ id: c.id, label: `${c.name} ${c.section} (${c.academicYear})` }));
}

/** The Teacher row id for a signed-in teacher, or null. */
export async function teacherIdFor(userId: string): Promise<string | null> {
  const t = await db.teacher.findUnique({ where: { userId }, select: { id: true } });
  return t?.id ?? null;
}
