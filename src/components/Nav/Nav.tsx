import Link from "next/link";
import { navLinks, site } from "@/lib/site";
import { SiteLinkAnchor } from "@/components/SiteLinkAnchor/SiteLinkAnchor";
import { MobileMenu } from "./MobileMenu";
import styles from "./Nav.module.css";

export function Nav() {
  return (
    <header className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.name}>
          {site.name}
        </Link>

        <nav aria-label="Main" className={styles.links}>
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <SiteLinkAnchor link={link} className={styles.link} />
              </li>
            ))}
          </ul>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
