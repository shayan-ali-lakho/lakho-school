"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/session";
export async function sendComplaint(formData:FormData){
 const actor=await requireUser();
 const subject=String(formData.get("subject")??"").trim().slice(0,150);
 const message=String(formData.get("message")??"").trim().slice(0,5000);
 const recipientId=String(formData.get("recipientId")??"");
 if(subject.length<3||message.length<10)redirect("/portal/complaints?error=Please+enter+a+subject+and+message");
 const elevated=["ADMIN","MANAGER","PRINCIPAL"].includes(actor.role);
 const recipient=await db.user.findFirst({where:{id:recipientId,isActive:true,...(!elevated?{role:{in:["ADMIN","MANAGER","PRINCIPAL"]}}:{})},select:{id:true}});
 if(!recipient||recipient.id===actor.id)redirect("/portal/complaints?error=Invalid+recipient");
 await db.complaint.create({data:{subject,message,senderId:actor.id,recipientId:recipient.id}});
 revalidatePath("/portal/complaints");
 redirect("/portal/complaints?ok=Message+sent");
}

export async function updateComplaint(formData:FormData){
 const actor=await requireUser();
 const id=String(formData.get("id")??"");
 const subject=String(formData.get("subject")??"").trim();
 const message=String(formData.get("message")??"").trim();
 if(subject.length<3||subject.length>150||message.length<10||message.length>5000)
  redirect("/portal/complaints?error=Subject+or+message+length+is+invalid");
 const result=await db.complaint.updateMany({where:{id,senderId:actor.id},data:{subject,message}});
 if(result.count===0)redirect("/portal/complaints?error=Message+not+found+or+not+editable");
 revalidatePath("/portal/complaints");
 redirect("/portal/complaints?ok=Message+updated");
}
export async function deleteComplaint(formData:FormData){
 const actor=await requireUser();
 const id=String(formData.get("id")??"");
 const result=await db.complaint.deleteMany({where:{id,senderId:actor.id}});
 if(result.count===0)redirect("/portal/complaints?error=Message+not+found+or+not+deletable");
 revalidatePath("/portal/complaints");
 redirect("/portal/complaints?ok=Message+deleted");
}
