export async function readPhoto(form: FormData): Promise<string | undefined> {
 const file = form.get("photo");
 if (!(file instanceof File) || !file.size) return undefined;
 if (file.size > 500000 || !["image/jpeg","image/png"].includes(file.type)) throw new Error("Upload a JPEG or PNG under 500 KB.");
 const b = Buffer.from(await file.arrayBuffer());
 if (!(file.type === "image/png" ? b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : b[0]===255 && b[1]===216 && b[2]===255)) throw new Error("Invalid image.");
 return "data:"+file.type+";base64,"+b.toString("base64");
}
