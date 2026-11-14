export const site = {
  name: "Tanvir Jawad",
  description:
    "My name is Jawad. I like to tinker with technology, think about things, and toy with ideas.",
  email: "tanvirja@buffalo.edu",
};

export type SiteLink = {
  label: string;
  href: string;
  /** Static files and the like: a plain <a> instead of a client-side route. */
  newTab?: boolean;
  /** Secondary text shown in the mobile menu row. */
  note?: string;
};

export const navLinks: SiteLink[] = [
  { label: "Feed", href: "/" },
  { label: "Resume", href: "/resume.pdf", newTab: true, note: "PDF, opens in a new tab" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerLinks: SiteLink[] = [
  { label: "GitHub", href: "https://github.com/jawaaddd" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/tanvirjawad05/" },
  { label: "Email", href: `mailto:${site.email}` },
];
