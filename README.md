# Progress Tracker

A simple, "no-nonsense" tool to track your long-term projects and keep yourself honest about progress. Most trackers let you cheat; this one makes it harder.

## What is this?
I built this because I needed a way to track big goals without the clutter of a thousand "productivity" features. It’s designed around a **24-hour cadence**—if you don't show up and log your progress, your "Honest Progress" metric starts to reflect that.

## Core Features

- **Tracks (Goals):** Set up a big project, give it a deadline, and a priority level. This is your "North Star."
- **Honest Progress:** Your progress percentage isn't just about checking boxes. It’s a mix of how many days you've actually worked vs. how many days have passed since you started. It caps at 99%—you only get that last 1% when you manually finalize the project.
- **Daily Logs:** Every day, you tell the app if you worked on the project, skipped it, or just didn't get to it. You can add notes to explain why.
- **Focus Mode:** A clean, distraction-free view that only shows what you need to do *today*. No looking at next week’s stress.
- **Tasks:** Break your tracks down into small, manageable steps. 
- **Streaks:** Keep track of how many days in a row you've logged progress. 
- **Reports:** A dedicated view to see your weekly trends, completion rates, and performance charts. You can even export or print them if you need a paper trail.
- **Public Share Links:** Want to stay accountable? Generate a public link for any track to show off your execution score, streak, and timeline to the world.
- **Quick Logging:** You can log your daily progress directly from the dashboard with one click.
- **Keyboard Shortcuts:** Hit `Ctrl + K` (or `Cmd + K`) from anywhere to quickly start a new track.

## How it works (The Tech)
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Database & Auth:** [Firebase](https://firebase.google.com/) for keeping your data synced and secure.
- **State Management:** [TanStack Query](https://tanstack.com/query/latest) (React Query) for snappy, optimistic UI updates.
- **Icons:** [Lucide](https://lucide.dev/) for the clean visual language.
- **Styling:** Custom CSS with a focus on glassmorphism and a premium dark mode feel.

## Getting it running locally

1. **Clone the repo:**
   ```bash
   git clone https://github.com/9-rahul/progress-tracker.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your environment variables:**
   Create a `.env.local` file in the root and add your Firebase credentials (check `.env.example` for the keys needed).

4. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and you're good to go.

## Why "Honest Progress"?
Most apps just count "tasks done / total tasks". But you can finish 10 tasks in one day and then do nothing for two weeks. This app looks at the *time elapsed* since you started. If you aren't logging work daily, your progress won't move much, even if you're checking off small tasks. It's about consistency, not just completion.
