import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PrintCard } from "./print";
const school="Dr. G.M. Lakho Memorial Sec. School";
function Logo(){return <Image src="/logo.png" width={65} height={65} alt={school} className="mx-auto object-contain"/>}
function Photo({src}:{src?:string|null}){return <div className="card-photo">{src?<Image src={src} alt="Profile photo" width={110} height={110} unoptimized style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>No photo</span>}</div>}
export default async function CardPage({params,searchParams}:{params:Promise<{kind:string;id:string}>;searchParams:Promise<{exam?:string}>}){
 const u=await requireRole(["ADMIN","PRINCIPAL","STUDENT","TEACHER"]);const {kind,id}=await params;const {exam}=await searchParams;const admin=u.role==="ADMIN"||u.role==="PRINCIPAL";
 const student=kind==="student"&&(admin||u.role==="STUDENT")?await db.student.findFirst({where:{id,user:{isActive:true},...(admin?{}:{userId:u.id})},include:{user:{select:{name:true}},class:true,guardian:{include:{user:{select:{name:true}}}}}}):null;
 const teacher=kind==="teacher"&&(admin||u.role==="TEACHER")?await db.teacher.findFirst({where:{id,user:{isActive:true},...(admin?{}:{userId:u.id})},include:{user:{select:{name:true}}}}):null;
 if(!student&&!teacher)notFound();
 const person=student??teacher!;const title=student?"STUDENT":"TEACHER";
 const details=student?[["Roll number",student.rollNumber],["Guardian",student.guardian?.user.name??"—"],["Academic year",student.class?.academicYear??"—"]]:[["Employee ID",teacher!.employeeId??"—"],["Position",teacher!.position??"Teacher"],["Qualification",teacher!.qualification??"—"]];
 const examination=exam&&student?.classId?await db.exam.findFirst({where:{id:exam,classId:student.classId}}):null;
 if(exam&&!examination)notFound();
 return <div><PrintCard/><style>{`
 .card-sheet{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;color:#10264a;font-family:Arial,sans-serif}
 .identity{position:relative;overflow:hidden;background:white;width:54mm;height:85.6mm;border:1px solid #d5dbe5;border-radius:10px;text-align:center;box-sizing:border-box;font-size:9px}
 .card-top{background:#10264a;color:white;padding:12px 8px 24px;clip-path:polygon(0 0,100% 0,100% 78%,12% 100%,0 91%);border-bottom:5px solid #ef831e}
 .card-photo{position:relative;margin:-18px auto 4px;width:78px;height:78px;border:2px solid #ef831e;border-radius:50%;overflow:hidden;background:#edf1f6;display:grid;place-items:center}
 .card-bottom{position:absolute;bottom:0;left:0;right:0;background:#10264a;color:white;border-top:4px solid #ef831e;padding:9px;font-size:8px}
 .admit{width:190mm;max-width:100%;background:white;padding:12mm;border:1px solid #d5dbe5;box-sizing:border-box}
 @media print{body *{visibility:hidden!important} .card-sheet,.card-sheet *{visibility:visible!important} .card-sheet{position:absolute;left:0;top:0;width:100%;print-color-adjust:exact;-webkit-print-color-adjust:exact} .identity,.admit{break-inside:avoid} @page{size:A4;margin:10mm}}
 `}</style><div className="card-sheet">{examination&&student?<article className="admit"><header style={{background:"#10264a",color:"white",padding:16,textAlign:"center",borderBottom:"5px solid #ef831e"}}><Logo/><h1>{school}</h1><h2>EXAMINATION ADMIT CARD</h2></header><h2 className="my-4 text-center text-xl font-bold">{examination.name}</h2><div className="flex justify-between gap-4"><div><p>Name: {person.user.name}</p><p>Class: {student.class?.name} – {student.class?.section}</p><p>Roll number: {student.rollNumber}</p><p>Academic year: {student.class?.academicYear}</p><p>Exam date: {examination.examDate?.toISOString().slice(0,10)??"Not scheduled"}</p></div><div style={{paddingTop:20}}><Photo src={person.photoData}/></div></div><h3 className="mt-8 font-bold">Instructions</h3><p>Bring this card to the examination and follow the examination staff instructions.</p><div className="mt-16 flex justify-between"><span>________________<br/>Examination controller</span><span>________________<br/>Principal</span></div></article>:<><article className="identity"><div className="card-top"><Logo/><strong>{school}</strong><p>{title} IDENTITY CARD</p></div><Photo src={person.photoData}/><h2 style={{fontSize:13,fontWeight:800}}>{person.user.name}</h2><p style={{color:"#b95700",fontWeight:700}}>{student?student.class?.name+" – "+student.class?.section:teacher?.position??"Teacher"}</p><div style={{padding:"6px 12px",textAlign:"left"}}>{details.map(([label,value])=><p key={label}><b>{label}:</b> {value}</p>)}</div><div className="card-bottom">{title}</div></article><article className="identity"><div style={{padding:"20px 12px"}}><Logo/><p style={{marginTop:15}}>This card is the property of {school}. It must be carried on school premises.</p><p style={{marginTop:18,fontWeight:700}}>If found, return to school administration.</p><p style={{marginTop:35}}>________________<br/>Principal</p></div><div className="card-bottom">{school}<br/>lakhoschool.netlify.app</div></article></>}</div></div>
}
