import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm/ContactForm";
import { site } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Hit me up!",
};

export default function ContactPage() {
  return (
    <div className={`container ${styles.contact}`}>
      <div className={styles.column}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Contact</h1>
          <p className={styles.intro}>Send me a message.</p>
        </header>

        <ContactForm />

        <p className={styles.alternative}>
          <span>Or email me directly:</span>
          <a href={`mailto:${site.email}`} className="text-link">
            {site.email}
          </a>
        </p>
      </div>
    </div>
  );
}
