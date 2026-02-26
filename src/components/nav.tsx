import Link from "next/link";

const links = [
  { href: "/checklist/today", label: "Daily Checklist" },
  { href: "/checklist/week", label: "Weekly View" },
  { href: "/checklist/history", label: "Submission History" },
  { href: "/reports", label: "Reports" },
];

export function AppNav() {
  return (
    <header className="border-b border-[--color-navy]/20 bg-[--color-offwhite]">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[--color-navy]/70">
            Internal Trail
          </p>
          <h1 className="text-xl font-bold text-[--color-navy]">Regent Street Pilot</h1>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[--color-navy] transition hover:bg-[--color-butter]"
            >
              {link.label}
            </Link>
          ))}
          <span className="ml-1 rounded-full bg-[--color-navy] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            No login mode
          </span>
        </nav>
      </div>
    </header>
  );
}
