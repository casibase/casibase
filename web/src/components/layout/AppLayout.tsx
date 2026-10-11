import * as React from "react";
import {Outlet, useSearchParams} from "react-router-dom";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {Loading} from "@/components/common/Loading";
import {Header} from "@/components/layout/Header";
import {GuardrailSeal} from "@/components/layout/Guardrail";
import {PoweredBy} from "@/components/layout/PoweredBy";
import {AppSidebar} from "@/components/layout/Sidebar";

/**
 * `SidebarProvider` persists the rail through its own `sidebar_state` cookie, so
 * the first render has to start from that cookie or the rail flashes open before
 * settling shut.
 */
function readSidebarCookie(): boolean {
  const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("sidebar_state="));
  return match === undefined ? true : match.slice("sidebar_state=".length) === "true";
}

export function AppLayout({fullBleed = false}: {fullBleed?: boolean}) {
  const [searchParams] = useSearchParams();

  // ?isRaw is the page another site puts in an iframe: no menu, header or footer
  if (searchParams.has("isRaw")) {
    return (
      <div className="h-screen overflow-hidden bg-background">
        <React.Suspense fallback={<Loading />}>
          <Outlet />
        </React.Suspense>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <SidebarProvider defaultOpen={readSidebarCookie()} className="min-h-0 flex-1">
        <AppSidebar />
        <SidebarInset className="min-h-0 overflow-hidden">
          <Header />
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            {/* the chat fills the whole pane; console pages get the usual padding */}
            <div className={fullBleed ? "h-full" : "mx-auto w-full max-w-[1600px] p-4 md:p-6"}>
              <React.Suspense fallback={<Loading />}>
                <Outlet />
              </React.Suspense>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {!fullBleed && (
        <footer id="footer" className="shrink-0 border-t bg-background py-3 text-center text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-3">
            <GuardrailSeal />
            <PoweredBy />
          </div>
        </footer>
      )}
    </div>
  );
}
