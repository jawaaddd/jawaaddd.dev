# jawaaddd.dev

This is the repo for my personal website, which you can visit at [jawaaddd.dev](https://jawaaddd.dev).

This website started as a Claude chat that I was using to learn about graphic design fundamentals to design this website on Figma. Then the chat snowballed into me creating the whole website's design in two nights and deploying it on Railway.

## Tech Stack and Dev Process

This is one of the few occasions where I think you'll want to look at the deployed site more than the code, so I won't say much about the repo.

I tried my best to make sure to visualize every page on a [Figma](https://www.figma.com/design/MC11Ndb8FPMk7wJprj6xfs/Portfolio-Redo?node-id=13-2&t=wXKjz6vXXQmp4wfY-1) before starting its development. I made sure to look at how the website renders on a variety of viewports, from desktop to mobile and everything else in between, to make sure the formatting and the look of the website stays consistent. Learning about and applying UI design basics made this process a lot smoother. Especially the spacing and text size scales. But concepts like visual hierarchy and grouping definitely helped me arrive at the grid-like display for posts. I was trying to go for a minimal look, so there was only so much those concepts could help with. But I'll definitely be taking these principles and tools with me into future projects.

I went with React because, well, it's just what I'm used to and know well, so I made sure to be able to keep up with Claude's edits. I used the Next.js framework because it made routing and the post links a little easier to implement, and also just because I've used it before.

I decided on SQLite for the content database because my website really only has a handful of different types of posts, which are all really simple (a combination of basic images and markdown files), and I doubt I will be posting content frequently enough for performance metrics to matter (the website loads fast enough already). So choosing an actual DB like MySQL or something would just be overengineering this site. I wanted to keep the tech stack and features as minimal and simple as possible.

If you're planning on forking this repo to tailor it for your own website, feel free to and let me know when you do! I'd definitely be interested to see what you come up with.

There's a reference guide that Claude made for me to run this website in [Admin.md](Admin.md), which has instructions for deploying this website.

## A quick reference for myself:

```sh
npm install
npm run seed       # dev only: fill ./data with sample posts
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build      # standalone server in .next/standalone
npm start          # runs the standalone build
```
