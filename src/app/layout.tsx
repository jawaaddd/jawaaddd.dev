import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { ToastProvider } from "@/components/Toast/Toast";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jawaaddd.dev"),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ToastProvider>
          <Nav />
          <main>{children}</main>
          {modal}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
