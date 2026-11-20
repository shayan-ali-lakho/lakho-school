ALTER TABLE "Student" ADD COLUMN "photoData" TEXT;
CREATE TABLE "AcademicSession" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, "startsOn" DATE NOT NULL, "endsOn" DATE NOT NULL, "active" BOOLEAN NOT NULL DEFAULT false);
CREATE UNIQUE INDEX "AcademicSession_one_active" ON "AcademicSession" ("active") WHERE "active" = true;
CREATE TABLE "SchoolEvent" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "kind" TEXT NOT NULL, "date" DATE NOT NULL, "description" TEXT);
CREATE TABLE "TeacherAttendance" ("id" TEXT PRIMARY KEY, "teacherId" TEXT NOT NULL REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE, "date" DATE NOT NULL, "status" "AttendanceStatus" NOT NULL, UNIQUE ("teacherId","date"));
