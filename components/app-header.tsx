import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { signOut } from "@/lib/auth/actions";

// Shared top bar for authenticated pages.
export function AppHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/history" className="hover:text-foreground">
            History
          </Link>
          <Link href="/groups" className="hover:text-foreground">
            Groups
          </Link>
          <Link href="/account" className="hover:text-foreground">
            Account
          </Link>
          <form action={signOut}>
            <button type="submit" className="hover:text-foreground">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
