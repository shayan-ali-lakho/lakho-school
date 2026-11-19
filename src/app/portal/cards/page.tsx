import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
export default async function CardsPage(){
 const u=await requireRole(["ADMIN","PRINCIPAL","STUDENT","TEACHER"]);
 const admin=u.role==="ADMIN"||u.role==="PRINCIPAL";
 const students=admin||u.role==="STUDENT"?await db.student.findMany({where:{user:{isActive:true},...(admin?{}:{userId:u.id})},select:{id:true,user:{select:{name:true}},class:{select:{exams:{select:{id:true,name:true}}}}},orderBy:{user:{name:"asc"}}}):[];
 const teachers=admin||u.role==="TEACHER"?await db.teacher.findMany({where:{user:{isActive:true},...(admin?{}:{userId:u.id})},select:{id:true,user:{select:{name:true}}},orderBy:{user:{name:"asc"}}}):[];
 return <div className="space-y-6"><h1 className="text-2xl font-bold">Identity and exam cards</h1>{students.map(s=><section key={s.id} className="rounded-xl border bg-white p-4"><h2 className="font-semibold">{s.user.name}</h2><div className="flex flex-wrap gap-4 text-sm text-brand-700"><Link href={`/portal/cards/student/${s.id}`}>Student ID card</Link>{s.class?.exams.map(e=><Link key={e.id} href={`/portal/cards/student/${s.id}?exam=${e.id}`}>Admit card: {e.name}</Link>)}</div></section>)}{teachers.map(t=><section key={t.id} className="rounded-xl border bg-white p-4"><h2 className="font-semibold">{t.user.name}</h2><Link className="text-sm text-brand-700" href={`/portal/cards/teacher/${t.id}`}>Teacher ID card</Link></section>)}</div>
}
