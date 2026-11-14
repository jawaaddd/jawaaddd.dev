import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

// Built in phase 6.
export default function ContactPage() {
  return (
    <div className="container" style={{ paddingBlock: "var(--space-16)" }}>
      <h1>Contact</h1>
    </div>
  );
}
