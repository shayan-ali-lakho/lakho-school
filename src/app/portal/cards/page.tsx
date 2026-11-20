import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { IdCardList } from "@/components/portal/id-card-list";
export default async function CardsPage(){
 const u=await requireRole(["ADMIN","PRINCIPAL","MANAGER","STUDENT","TEACHER"]);
 const admin=["ADMIN","PRINCIPAL","MANAGER"].includes(u.role);
 const students=admin||u.role==="STUDENT"?await db.student.findMany({where:{user:{isActive:true},...(admin?{}:{userId:u.id})},select:{id:true,rollNumber:true,user:{select:{name:true}},class:{select:{name:true,section:true,academicYear:true}}},orderBy:{user:{name:"asc"}}}):[];
 const teachers=admin||u.role==="TEACHER"?await db.teacher.findMany({where:{user:{isActive:true},...(admin?{}:{userId:u.id})},select:{id:true,user:{select:{name:true}}},orderBy:{user:{name:"asc"}}}):[];
 const entries=[...students.map(s=>({id:s.id,name:s.user.name,kind:"student" as const,className:s.class?`${s.class.name} ${s.class.section} (${s.class.academicYear})`:"Unassigned",roll:s.rollNumber})),...teachers.map(t=>({id:t.id,name:t.user.name,kind:"teacher" as const,className:"",roll:""}))];
 return <div className="space-y-5"><div><h1 className="text-2xl font-bold">ID cards</h1><p className="text-sm text-slate-500">Filter students and teachers, then preview or download their ID cards.</p></div><IdCardList entries={entries}/></div>
}
