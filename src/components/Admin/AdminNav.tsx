import Link from "next/link";
import { MobileMenu } from "@/components/Nav/MobileMenu";
import navStyles from "@/components/Nav/Nav.module.css";
import { SiteLinkAnchor } from "@/components/SiteLinkAnchor/SiteLinkAnchor";
import { site, type SiteLink } from "@/lib/site";
import { signOut } from "./authActions";
import styles from "./Admin.module.css";

const adminLinks: SiteLink[] = [
  { label: "Posts", href: "/admin/posts" },
  { label: "New post", href: "/admin/posts/new" },
  { label: "View site", href: "/" },
];

/** The admin navbar. The sign-in page shows only the name; panel pages add the links. */
export function AdminNav({ links = false }: { links?: boolean }) {
  return (
    <header className={styles.nav}>
      <div className={`container ${styles.navInner}`}>
        <Link href={links ? "/admin/posts" : "/admin"} className={styles.brand}>
          <span className={styles.name}>{site.name}</span>
          <span className={styles.label}>Admin</span>
        </Link>

        {links && (
          <>
            <nav aria-label="Admin" className={navStyles.links}>
              <ul>
                {adminLinks.map((link) => (
                  <li key={link.href}>
                    <SiteLinkAnchor link={link} className={navStyles.link} />
                  </li>
                ))}
                <li>
                  <form action={signOut}>
                    <button type="submit" className={navStyles.link}>
                      Sign out
                    </button>
                  </form>
                </li>
              </ul>
            </nav>
            <MobileMenu
              links={adminLinks}
              label="Admin"
              action={{ label: "Sign out", run: signOut }}
            />
          </>
        )}
      </div>
    </header>
  );
}
