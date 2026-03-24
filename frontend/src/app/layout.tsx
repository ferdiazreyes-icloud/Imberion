import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "USG Pricing Decision Engine",
  description: "Motor de Decisión de Precios B2B para USG",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <main
              className="flex-1 overflow-auto px-8 py-6"
              style={{ background: "var(--bg-primary)" }}
            >
              <div className="mx-auto max-w-[1600px]">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
