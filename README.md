# ExecTrack

Track execution, not intention.

A distraction-free tracker built for developers, indie hackers, and founders who want to stay honest about what they actually get done every day.

Most productivity and habit apps make it too easy to fudge numbers, backdate missed days, or get lost in endless configuration. ExecTrack keeps things simple: show up, log today's progress, and let your consistency speak for itself.

---

## Why I Built This

I found myself planning lots of ambitious projects, but standard project management tools were either bloated with enterprise Jira-like features or habit trackers that let me easily cheat my streak. 

I wanted a focused workspace that answers one question: **did I actually move the needle today?**

---

## Features

- **Tracks (Goals)**: Set your target project, deadline, and priority. Keep only what matters in flight.
- **Daily Verification**: Log your daily status (`Done`, `In progress`, or `Missed`). No backdating.
- **Execution Score**: A clean progress gauge that reflects your real consistency, not wishful thinking.
- **Today's Focus**: A quiet, single-task view showing only what needs your attention right now.
- **Milestones**: Break big tracks into bite-sized tasks you can check off as you build.
- **Weekly Trends & Reports**: See your weekly activity, check-in history, and completion rates at a glance.
- **Public Share Links**: Generate a public link for any track to share your verified progress on Twitter/X or LinkedIn.
- **Instant Demo Mode**: Test out the entire workspace with sample data in one click—no account required.
- **Clean Dark Theme**: Apple-inspired minimalist dark interface with an electric lime accent.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Auth & Storage**: [Firebase](https://firebase.google.com/) (Auth + Firestore)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: Framer Motion

---

## Getting Started Locally

### 1. Clone the repository

```bash
git clone https://github.com/9-rahul/progress-tracker.git
cd progress-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your Firebase credentials in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

*(If you don't configure Firebase right away, the app will automatically fall back to local demo mode so you can test everything right away).*

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License

MIT
