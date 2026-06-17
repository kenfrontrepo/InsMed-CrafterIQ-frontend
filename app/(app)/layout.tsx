import { Providers } from "./providers";
import { LayoutShell } from "./layout-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <LayoutShell>{children}</LayoutShell>
    </Providers>
  );
}
