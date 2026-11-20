import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
export default async function AdmitCards(){
 const user=await requireRole(["ADMIN","PRINCIPAL","MANAGER","STUDENT"]);
 const admin=user.role==="ADMIN"||user.role==="PRINCIPAL"||user.role==="MANAGER";
 const students=await db.student.findMany({where:{user:{isActive:true},...(admin?{}:{userId:user.id})},select:{id:true,rollNumber:true,user:{select:{name:true}},class:{select:{name:true,section:true,exams:{select:{id:true,name:true,examDate:true}}}}},orderBy:{user:{name:"asc"}}});
 return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">Examination admit cards</h1><p className="text-sm text-slate-500">Select an examination to view or print its admit card.</p></div><div className="grid gap-3">{students.flatMap(s=>s.class?.exams.map(e=><div key={s.id+e.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><h2 className="font-semibold">{s.user.name}</h2><p className="text-sm text-slate-500">{s.class?.name} {s.class?.section} · Roll {s.rollNumber} · {e.name}</p></div><Link className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white" href={`/portal/cards/student/${s.id}?exam=${e.id}`}>View admit card</Link></div>)??[])}</div></div>
}
