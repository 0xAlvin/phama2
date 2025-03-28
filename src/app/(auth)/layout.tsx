export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout explicitly does NOT use RouteGuard so auth pages are always accessible
  console.log("[AuthLayout] Rendering auth layout without RouteGuard");
  return (
    <div className="auth-layout">
      {/* Auth layout wrapper */}
      {children}
    </div>
  );
}
