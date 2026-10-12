import { Atkinson_Hyperlegible_Next, Caveat, Source_Serif_4 } from "next/font/google";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

// Textbook serif for headings, a highly legible sans for reading, and a handwriting
// face used only for the teacher's red-pen notes.
const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });
const atkinson = Atkinson_Hyperlegible_Next({ variable: "--font-atkinson", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${sourceSerif.variable} ${atkinson.variable} ${caveat.variable} flex flex-1 flex-col bg-paper font-body text-ink`}
    >
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
