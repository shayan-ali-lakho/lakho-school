import {db} from "@/lib/db";
import {requireUser} from "@/lib/session";
import {ROLE_LABELS} from "@/lib/roles";
import {ProfilePictureEditor} from "@/components/portal/profile-picture-editor";
export default async function ProfilePage(){
 const actor=await requireUser();
 const user=await db.user.findUniqueOrThrow({where:{id:actor.id},select:{id:true,name:true,email:true,role:true,photoData:true,studentProfile:{select:{photoData:true}},teacherProfile:{select:{photoData:true}}}});
 return <div className="mx-auto max-w-2xl space-y-5"><div><h1 className="text-2xl font-bold">My profile</h1><p className="mt-1 text-sm text-slate-500">{user.name} · {ROLE_LABELS[user.role]}</p></div><ProfilePictureEditor userId={user.id} name={user.name} photoData={user.photoData??user.studentProfile?.photoData??user.teacherProfile?.photoData}/></div>
}
