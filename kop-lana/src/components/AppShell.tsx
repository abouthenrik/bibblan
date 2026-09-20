import { Link } from "@tanstack/react-router";
import { Camera, Home, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl pb-28">
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-2xl grid-cols-4 items-end px-6 py-3">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground data-[status=active]:font-semibold data-[status=active]:text-foreground"
          >
            <Home className="size-5" aria-hidden />
            Min samling
          </Link>
          <div className="flex justify-center">
            <Link
              to="/lagg-till"
              aria-label="Lägg till bok med kameran"
              className="-mt-9 flex size-16 items-center justify-center rounded-full bg-record text-primary-foreground transition-transform hover:scale-105"
            >
              <Camera className="size-7" aria-hidden />
            </Link>
          </div>
          <Link
            to="/forslag"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground data-[status=active]:font-semibold data-[status=active]:text-foreground"
          >
            <Sparkles className="size-5" aria-hidden />
            Förslag
          </Link>
          <Link
            to="/sok"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground data-[status=active]:font-semibold data-[status=active]:text-foreground"
          >
            <Search className="size-5" aria-hidden />
            Sök litteratur
          </Link>
        </div>
      </nav>
    </div>
  );
}
