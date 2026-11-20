import {db} from "@/lib/db";
import {requireUser} from "@/lib/session";
import {sendComplaint,updateComplaint,deleteComplaint} from "./actions";
import {DeleteComplaintButton} from "./delete-button";

export default async function ComplaintsPage(){
 const actor=await requireUser();
 const elevated=["ADMIN","MANAGER","PRINCIPAL"].includes(actor.role);
 const recipients=await db.user.findMany({where:{isActive:true,id:{not:actor.id},...(!elevated?{role:{in:["ADMIN","MANAGER","PRINCIPAL"]}}:{})},select:{id:true,name:true,role:true},orderBy:{name:"asc"}});
 const visible={OR:[{senderId:actor.id},{recipientId:actor.id}]};
 const [complaints,total,inbox,sent]=await Promise.all([
  db.complaint.findMany({where:visible,include:{sender:{select:{name:true,role:true}},recipient:{select:{name:true}}},orderBy:{createdAt:"desc"},take:100}),
  db.complaint.count({where:visible}),
  db.complaint.count({where:{recipientId:actor.id}}),
  db.complaint.count({where:{senderId:actor.id}})
 ]);
 return <div className="space-y-6">
  <div><h1 className="text-2xl font-bold">Complaints & messages</h1><p className="text-sm text-slate-500">Send a private message to school administration. You can edit or delete messages you sent.</p></div>
  <div className="grid gap-3 sm:grid-cols-3">
   {[{label:"Total complaints",count:total},{label:"Received",count:inbox},{label:"Sent",count:sent}].map(item=><div key={item.label} className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm"><p className="text-xs font-medium text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-bold text-indigo-700">{item.count}</p></div>)}
  </div>
  <section className="rounded-2xl border bg-white p-5"><h2 className="mb-4 font-semibold">Write a message</h2>
   <form action={sendComplaint} className="space-y-3">
    <label className="block text-sm">To<select required name="recipientId" className="mt-1 w-full rounded-xl border p-3"><option value="">Choose recipient</option>{recipients.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}</select></label>
    <label className="block text-sm">Subject<input name="subject" required minLength={3} maxLength={150} className="mt-1 w-full rounded-xl border p-3"/></label>
    <label className="block text-sm">Message<textarea name="message" required minLength={10} maxLength={5000} rows={4} className="mt-1 w-full rounded-xl border p-3"/></label>
    <button className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white" type="submit">Send message</button>
   </form>
  </section>
  <section className="space-y-3"><h2 className="font-semibold">Inbox & sent messages <span className="text-slate-400">({total})</span></h2>
   {complaints.map(c=><article key={c.id} className="rounded-2xl border bg-white p-4">
    <div className="flex flex-wrap justify-between gap-3"><strong>{c.subject}</strong><time className="text-xs text-slate-500">{c.createdAt.toLocaleDateString("en-GB")}</time></div>
    <p className="mt-1 text-xs text-slate-500">From: {c.sender.name} · To: {c.recipient.name}</p>
    <p className="mt-3 whitespace-pre-wrap text-sm">{c.message}</p>
    {c.senderId===actor.id&&<div className="mt-4 flex flex-wrap items-start gap-3 border-t border-slate-100 pt-3">
     <details className="min-w-[220px] flex-1"><summary className="cursor-pointer text-sm font-semibold text-indigo-700">Edit message</summary>
      <form action={updateComplaint} className="mt-3 space-y-2"><input type="hidden" name="id" value={c.id}/>
       <label className="block text-xs font-medium">Subject<input name="subject" defaultValue={c.subject} required minLength={3} maxLength={150} className="mt-1 w-full rounded-lg border p-2"/></label>
       <label className="block text-xs font-medium">Message<textarea name="message" defaultValue={c.message} required minLength={10} maxLength={5000} rows={4} className="mt-1 w-full rounded-lg border p-2"/></label>
       <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Save changes</button>
      </form>
     </details>
     <form action={deleteComplaint}><input type="hidden" name="id" value={c.id}/><DeleteComplaintButton/></form>
    </div>}
   </article>)}
   {complaints.length===0&&<p className="text-sm text-slate-500">No messages yet.</p>}
   {total>complaints.length&&<p className="text-xs text-slate-500">Showing the latest {complaints.length} of {total} messages.</p>}
  </section>
 </div>;
}
