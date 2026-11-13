/** A template (unlike a layout) is re-created on every navigation, so each page fades in. */
export default function PortalTemplate({ children }: { children: React.ReactNode }) {
  return <div className="portal-page">{children}</div>;
}
