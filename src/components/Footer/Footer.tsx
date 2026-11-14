import { cacheLife } from "next/cache";
import { footerLinks, site } from "@/lib/site";
import { SiteLinkAnchor } from "@/components/SiteLinkAnchor/SiteLinkAnchor";
import styles from "./Footer.module.css";

// Cached so the footer stays in the prerendered shell; it refreshes daily, so the
// year rolls over on its own without a redeploy.
async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p>
          © {await copyrightYear()} {site.name}
        </p>
        <ul className={styles.links}>
          {footerLinks.map((link) => (
            <li key={link.href}>
              <SiteLinkAnchor link={link} className={styles.link} />
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
