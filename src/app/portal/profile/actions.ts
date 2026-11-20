"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/session";
import {readPhoto} from "@/lib/photo";
export async function updateProfilePicture(formData:FormData){
 const actor=await requireUser();
 const target=String(formData.get("userId")??"");
 const admin=["ADMIN","PRINCIPAL","MANAGER"].includes(actor.role);
 if(target!==actor.id&&!admin)redirect("/portal/profile?error=Not+authorized");
 const user=await db.user.findUnique({where:{id:target},select:{id:true}});
 if(!user)redirect("/portal/profile?error=User+not+found");
 const remove=formData.get("remove")==="true";
 let photoData:string|undefined;
 if(!remove){try{photoData=await readPhoto(formData)}catch(e){redirect("/portal/profile?error="+encodeURIComponent((e as Error).message))}}
 if(!remove&&!photoData)redirect("/portal/profile?error=Choose+a+photo");
 await db.user.update({where:{id:target},data:{photoData:remove?null:photoData}});
 // Keep existing ID-card data consistent with the user's latest picture.
 await Promise.all([db.student.updateMany({where:{userId:target},data:{photoData:remove?null:photoData}}),db.teacher.updateMany({where:{userId:target},data:{photoData:remove?null:photoData}})]);
 revalidatePath("/portal","layout");
 redirect(target===actor.id?"/portal/profile?ok=Picture+updated":"/portal/admin/users/"+target+"?ok=Picture+updated");
}
