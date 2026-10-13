// A template remounts on every navigation, so each public page fades in softly.
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
