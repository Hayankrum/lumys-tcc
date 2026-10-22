import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeProvider";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import InstallPWMPopup from "@/components/InstallPWMPopup";
import NotificationPermissionPopup from "@/components/NotificationPermissionPopup";
import ServiceWorkerRegister from "@/modules/layout/ServiceWorkerRegister";
import SyncProvider from "@/modules/layout/SyncProvider";
import { getUsuarioLogado } from "@/modules/usuarios/usuarios.actions";
import TermosChecker from "@/components/TermosChecker";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumys",
  description: "Crie, compartilhe e responda questionários em segundos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
title: "Lumys",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1B3A3A",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const usuario = await getUsuarioLogado()

  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/pwa/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('theme');
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ServiceWorkerRegister />
          <SyncProvider />
          <Navbar usuario={usuario ? { id: usuario.id, nome: usuario.nome, isAdmin: usuario.isAdmin } : null} />
          <MobileBottomNav usuario={usuario ? { id: usuario.id, nome: usuario.nome, isAdmin: usuario.isAdmin } : null} />
          <div className="h-[76px] hidden md:block print:hidden" />
          <TermosChecker usuario={usuario}>
            <main className="flex-1 w-full px-4 py-6 pb-24 md:max-w-3xl md:mx-auto md:px-6 md:py-10 md:pb-10">
              {children}
            </main>
          </TermosChecker>
        </ThemeProvider>
        <InstallPWMPopup />
        <NotificationPermissionPopup usuarioId={usuario?.id} />
      </body>
    </html>
  );
}
