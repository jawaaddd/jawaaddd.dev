/**
 * The About page text, in Markdown. Links work as in posts.
 */
export const aboutMarkdown = `
What's up! I'm glad you found my website and are reading this page to learn a bit about me. Let's start with the basics. My full name is Tanvir Jawad, but I go by just my last name. I'm currently majoring in computer science at the University at Buffalo. But my academic interests are not confined to just compilers and algorithms. In fact, I'm quite interested in philosophy, math, writing, and global politics, even more than the CS stuff.

As I populate this website with my thoughts, writing pieces, and projects, you'll see what I mean.

I was born and raised in Dhaka, Bangladesh until about the age of twelve, when my family and I moved to NYC. I started learning how to code on Khan Academy's website using their course on the Processing.js library. Soon after that, I learned Python, learned about libraries and APIs, started doing hackathons, and, well, the rest is history.

But my interests have evolved since then. They've started expanding into the liberal arts and into more math like I mentioned in the first paragraph.

I'm trying to dive deep into the machine learning field right now. I'm learning about the fundamental math and research behind world models, diffusion models, and LLMs. I'm trying to meet new people in the industry, and other students interested in the same topics as me, so hit me up if you want to talk or meet up (I'm usually in New York, either Buffalo or NYC).
`;

/**
 * The square portrait beside the text: a file in public/ named portrait.<ext>,
 * e.g. "/portrait.jpg" (next.config.ts only lets images by that name through).
 * With `null`, the page shows the gray placeholder square from the design.
 */
export const portrait: { src: string; alt: string } | null = {
  src: "/portrait.jpg",
  alt: "Tanvir Jawad",
};
