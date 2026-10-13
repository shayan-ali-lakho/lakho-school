export const DAYS = [
  { n: 1, label: "Monday" },
  { n: 2, label: "Tuesday" },
  { n: 3, label: "Wednesday" },
  { n: 4, label: "Thursday" },
  { n: 5, label: "Friday" },
  { n: 6, label: "Saturday" },
] as const;

export const EXAM_KINDS = ["Monthly test", "Mid-term", "Final term", "Board mock", "Other"] as const;

/** Letter grade for a percentage; anything under the pass mark is an F. */
export function gradeFor(percent: number, passPercent: number): string {
  if (percent < passPercent) return "F";
  if (percent >= 80) return "A+";
  if (percent >= 70) return "A";
  if (percent >= 60) return "B";
  if (percent >= 50) return "C";
  if (percent >= 40) return "D";
  return "E";
}

/** Classes 9 and 10 take board examinations. */
export function isBoardClass(className: string): boolean {
  return /^(class\s*)?(9|10|ix|x)\b/i.test(className.trim());
}

export type StudentResult = {
  studentId: string;
  name: string;
  rollNumber: string;
  perSubject: Map<string, number | null>;
  obtained: number;
  possible: number;
  percent: number;
  grade: string;
  passed: boolean;
  position: number | null;
};

/**
 * Totals, grades and class positions for one exam.
 * `entered` = the subjects that have at least one mark, so unmarked subjects do not count against anyone.
 */
export function computeResults(args: {
  students: { id: string; name: string; rollNumber: string }[];
  subjectIds: string[];
  marks: { studentId: string; subjectId: string; obtained: number | null }[];
  totalMarks: number;
  passPercent: number;
}): StudentResult[] {
  const { students, subjectIds, marks, totalMarks, passPercent } = args;
  const bySt = new Map<string, Map<string, number | null>>();
  for (const m of marks) {
    if (!bySt.has(m.studentId)) bySt.set(m.studentId, new Map());
    bySt.get(m.studentId)!.set(m.subjectId, m.obtained);
  }
  const entered = subjectIds.filter((sid) => marks.some((m) => m.subjectId === sid && m.obtained !== null));

  const rows: StudentResult[] = students.map((s) => {
    const per = bySt.get(s.id) ?? new Map<string, number | null>();
    let obtained = 0;
    let failedAny = false;
    for (const sid of entered) {
      const v = per.get(sid) ?? 0;
      obtained += v;
      if ((v / totalMarks) * 100 < passPercent) failedAny = true;
    }
    const possible = entered.length * totalMarks;
    const percent = possible > 0 ? (obtained / possible) * 100 : 0;
    return {
      studentId: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      perSubject: per,
      obtained,
      possible,
      percent,
      grade: possible > 0 ? gradeFor(percent, passPercent) : "-",
      passed: possible > 0 && !failedAny,
      position: null,
    };
  });

  // Positions: highest total first, equal totals share a position.
  const ranked = rows.filter((r) => r.possible > 0).sort((a, b) => b.obtained - a.obtained);
  let pos = 0;
  let prev: number | null = null;
  ranked.forEach((r, i) => {
    if (r.obtained !== prev) {
      pos = i + 1;
      prev = r.obtained;
    }
    r.position = pos;
  });
  return rows;
}
