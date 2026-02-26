import { AppNav } from "@/components/nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
    </div>
  );
}
