import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";

/** The public site: pinned navbar and footer, with the post modal slot over the page. */
export default function SiteLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <div className="site">
      <Nav />
      <main>{children}</main>
      {modal}
      <Footer />
    </div>
  );
}
