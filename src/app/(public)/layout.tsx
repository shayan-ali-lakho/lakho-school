import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";


export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`flex flex-1 flex-col bg-paper font-body text-ink`}
    >
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
