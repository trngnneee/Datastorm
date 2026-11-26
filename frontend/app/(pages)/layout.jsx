import { Suspense } from "react";
import Chatbot from "./components/ChatBot";
import { AppShell } from "./components/shell/AppShell";

function ShellFallback() {
  return (
    <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">
      Loading DataStorm…
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <>
      <Suspense fallback={<ShellFallback />}>
        <AppShell>{children}</AppShell>
      </Suspense>
      <Chatbot />
    </>
  );
}
