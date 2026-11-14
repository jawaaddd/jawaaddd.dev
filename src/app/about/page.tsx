import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

// Built in phase 6.
export default function AboutPage() {
  return (
    <div className="container" style={{ paddingBlock: "var(--space-16)" }}>
      <h1>About</h1>
    </div>
  );
}
