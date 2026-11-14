import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** The admin panel. Each page renders its own navbar and <main>; the public chrome isn't used here. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
