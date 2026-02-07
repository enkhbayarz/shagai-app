// Force dynamic rendering to prevent static prerendering errors with Convex
export const dynamic = "force-dynamic";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
