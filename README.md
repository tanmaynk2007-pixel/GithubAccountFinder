# GitHub Profile Finder

A responsive GitHub Profile Finder prototype built with React and the GitHub REST API.

---

## Features

### Overview
* **Search Bar**: Search any GitHub user by username (supports `@username` and trims spaces).
* **GitHub API Integration**: Fetches real-time user details using the native `fetch()` API.
* **Profile Overview**: Displays user profile avatar, full name, bio, and `@username`.
* **Profile Stats**: Highlights counts for public repositories, followers, and following.
* **React Hooks**:
  * `useState`: Manages user input, active search query, profile data, repositories, history, and theme.
  * `useEffect`: Automatically triggers API calls when the search target updates, with `AbortController` cleanup.
* **Loading State**: Visual spinner and status message while data is in flight.
* **Error Handling**: Graceful error cards for 404 (user not found), 403 (rate limits), and offline/network issues.
* **Responsive Design**: Mobile-friendly stacked card layout and desktop dual-column repository grid.

### Features Included
* **Visit GitHub Profile**: Direct link opening the user's GitHub profile.
* **Public Repositories**: Lists recent public repositories with primary language indicator dots, star count, and fork count.
* **Search History**: Persisted in `localStorage` with quick re-search chips, individual item deletion, and "Clear all".
* **Dark / Light Mode**: Seamless theme toggle preserving preference in `localStorage` and syncing with system color scheme.
* **Profile Metadata**: Shows user location, blog/website (clickable), Twitter handle, company, and account joined date.
* **Initial Profile**: Loads `octocat` by default so users see a fully populated UI on launch.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Build for production
```bash
npm run build
```

### 4. Preview the production build
```bash
npm run preview
```

---

## Tech Stack

* **React 18** (`useState`, `useEffect`)
* **Vite 5** (Fast HMR & build tool)
* **GitHub REST API** (`/users/:username` & `/users/:username/repos`)
* **Pure CSS3** (Custom Properties, Flexbox, CSS Grid, Media Queries)

---

## Project Structure

```
├── index.html          # HTML entry point with meta viewport
├── package.json        # Dependencies & scripts
├── vite.config.js      # Vite configuration with React plugin
├── src/
│   ├── App.jsx         # Main React component (State, Effects, UI)
│   ├── index.css       # Theming variables, responsive layout & styles
│   └── main.jsx        # React root render
```

---

## API Reference

* User profile: `https://api.github.com/users/:username`
* User repositories: `https://api.github.com/users/:username/repos?sort=updated&per_page=8`
