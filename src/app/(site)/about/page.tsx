import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Markdown } from "@/components/Markdown/Markdown";
import { aboutMarkdown, portrait } from "@/content/about";
import { navLinks } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "Who I am, what I study and what I spend my time making.",
};

const resume = navLinks.find((link) => link.label === "Resume")!;

export default function AboutPage() {
  return (
    <div className={`container ${styles.about}`}>
      <div className={styles.portrait}>
        {portrait && (
          <Image
            src={portrait.src}
            alt={portrait.alt}
            fill
            priority
            sizes="(min-width: 1024px) 357px, (min-width: 640px) 357px, 100vw"
          />
        )}
      </div>

      <div className={styles.text}>
        <h1 className={styles.heading}>About</h1>
        <Markdown source={aboutMarkdown} images={new Map()} />
        <p className={styles.links}>
          <a href={resume.href} target="_blank" rel="noopener noreferrer" className="text-link">
            Resume →<span className="visually-hidden"> (PDF, opens in a new tab)</span>
          </a>
          <Link href="/contact" className="text-link">
            Contact →
          </Link>
        </p>
      </div>
    </div>
  );
}
