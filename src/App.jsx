import { useEffect, useState } from 'react'

const HISTORY_KEY = 'gh-profile-finder-history'
const THEME_KEY = 'gh-profile-finder-theme'

const SUGGESTED_USERS = ['octocat', 'torvalds', 'gaearon', 'freeCodeCamp']

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Vue: '#41b883',
}

function readHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY))
    return Array.isArray(saved) ? saved.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function readTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function formatDate(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function App() {
  // useState: manage user input, search state, fetched data, loading & error
  const [query, setQuery] = useState('octocat')
  const [searchTerm, setSearchTerm] = useState('octocat')
  const [searchCount, setSearchCount] = useState(1)
  const [user, setUser] = useState(null)
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState(readHistory)
  const [theme, setTheme] = useState(readTheme)

  // Apply and persist dark / light theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Persist search history to localStorage
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  // useEffect: handle API fetching whenever searchTerm or searchCount changes
  useEffect(() => {
    if (!searchTerm.trim()) return

    const controller = new AbortController()
    const { signal } = controller
    const sanitizedUsername = searchTerm.trim().replace(/^@/, '')

    async function fetchGitHubData() {
      setLoading(true)
      setError('')

      try {
        // Fetch user profile from GitHub Users API
        const userResponse = await fetch(
          `https://api.github.com/users/${encodeURIComponent(sanitizedUsername)}`,
          {
            signal,
            headers: { Accept: 'application/vnd.github+json' },
          }
        )

        if (userResponse.status === 404) {
          throw new Error(`User "${sanitizedUsername}" was not found. Please check the spelling.`)
        }
        if (userResponse.status === 403) {
          throw new Error('GitHub API rate limit exceeded (60 requests/hour). Please try again shortly.')
        }
        if (!userResponse.ok) {
          throw new Error(`Request failed with status ${userResponse.status}. Please try again.`)
        }

        const userData = await userResponse.json()

        // Fetch recent public repositories (Bonus requirement)
        let repoData = []
        try {
          const reposResponse = await fetch(
            `https://api.github.com/users/${encodeURIComponent(sanitizedUsername)}/repos?sort=updated&per_page=8`,
            {
              signal,
              headers: { Accept: 'application/vnd.github+json' },
            }
          )
          if (reposResponse.ok) {
            const parsed = await reposResponse.json()
            repoData = Array.isArray(parsed) ? parsed : []
          }
        } catch (repoErr) {
          if (repoErr.name === 'AbortError') throw repoErr
          console.warn('Could not load repositories:', repoErr)
        }

        setUser(userData)
        setRepos(repoData)
        setLoading(false)

        // Save to search history (keep the 6 most recent unique searches)
        setHistory((prev) => {
          const filtered = prev.filter(
            (item) => item.toLowerCase() !== userData.login.toLowerCase()
          )
          return [userData.login, ...filtered].slice(0, 6)
        })
      } catch (err) {
        if (err.name === 'AbortError') return
        setUser(null)
        setRepos([])
        setError(err.message || 'Something went wrong. Please check your network and try again.')
        setLoading(false)
      }
    }

    fetchGitHubData()

    return () => controller.abort()
  }, [searchTerm, searchCount])

  // Form submit handler
  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim().replace(/^@/, '')
    if (!trimmed) {
      setError('Please enter a GitHub username to search.')
      return
    }
    setSearchTerm(trimmed)
    setSearchCount((prev) => prev + 1)
  }

  // Quick search a specific username
  function handleSelectUser(name) {
    setQuery(name)
    setSearchTerm(name)
    setSearchCount((prev) => prev + 1)
  }

  // Clear single history item
  function handleRemoveHistoryItem(e, name) {
    e.stopPropagation()
    setHistory((prev) => prev.filter((item) => item !== name))
  }

  // Clear all search history
  function handleClearHistory() {
    setHistory([])
  }

  const joinedDate = user?.created_at ? formatDate(user.created_at) : null

  return (
    <div className="app-container">
      {/* Header with Title and Dark / Light Mode Toggle */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-icon-wrapper" aria-hidden="true">
            <svg
              className="github-logo"
              viewBox="0 0 24 24"
              width="32"
              height="32"
              fill="currentColor"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div>
            <h1>GitHub Profile Finder</h1>
            <p className="subtitle">Search and explore developer profiles on GitHub</p>
          </div>
        </div>

        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <span className="theme-toggle-content">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span className="theme-name">LIGHT</span>
            </span>
          ) : (
            <span className="theme-toggle-content">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span className="theme-name">DARK</span>
            </span>
          )}
        </button>
      </header>

      <main>
        {/* Search Bar Form */}
        <form className="search-form" onSubmit={handleSubmit} role="search">
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              name="username"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GitHub username..."
              aria-label="GitHub username"
              autoComplete="off"
              spellCheck="false"
            />
            {query && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setQuery('')}
                aria-label="Clear input"
                title="Clear input"
              >
                &times;
              </button>
            )}
          </div>
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="mini-spinner" aria-hidden="true" />
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </button>
        </form>

        {/* Search History & Suggested Profiles */}
        <section className="history-section" aria-label="Search History and Suggestions">
          {history.length > 0 ? (
            <div className="history-bar">
              <div className="history-header">
                <span className="history-title">Recent Searches:</span>
                <button
                  type="button"
                  className="clear-history-btn"
                  onClick={handleClearHistory}
                  title="Clear all search history"
                >
                  Clear all
                </button>
              </div>
              <div className="history-chips">
                {history.map((name) => (
                  <div key={name} className="chip-wrapper">
                    <button
                      type="button"
                      className={`chip-btn ${user?.login.toLowerCase() === name.toLowerCase() ? 'active' : ''}`}
                      onClick={() => handleSelectUser(name)}
                    >
                      @{name}
                    </button>
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={(e) => handleRemoveHistoryItem(e, name)}
                      aria-label={`Remove ${name} from history`}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="suggestions-bar">
              <span className="suggestions-title">Try searching:</span>
              <div className="history-chips">
                {SUGGESTED_USERS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="chip-btn suggestion"
                    onClick={() => handleSelectUser(name)}
                  >
                    @{name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Loading Message & Spinner */}
        {loading && (
          <div className="status-container loading" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <p className="loading-text">Fetching profile from GitHub...</p>
          </div>
        )}

        {/* Error Message */}
        {!loading && error && (
          <div className="status-container error" role="alert">
            <svg
              className="error-icon"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="error-content">
              <strong>Unable to find profile</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* User Profile Card */}
        {!loading && user && (
          <>
            <article className="profile-card">
              <div className="profile-top">
                <img
                  className="profile-avatar"
                  src={user.avatar_url}
                  alt={`${user.login}'s profile picture`}
                  loading="lazy"
                />

                <div className="profile-header-info">
                  <div className="profile-names-row">
                    <div className="name-wrapper">
                      <h2 className="profile-name">{user.name || user.login}</h2>
                      <a
                        className="profile-username"
                        href={user.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View profile on GitHub"
                      >
                        @{user.login}
                      </a>
                    </div>
                    {joinedDate && (
                      <span className="profile-joined">Joined {joinedDate}</span>
                    )}
                  </div>

                  <p className={`profile-bio ${!user.bio ? 'no-bio' : ''}`}>
                    {user.bio || 'This profile has no bio.'}
                  </p>
                </div>
              </div>

              {/* Stats: Repositories, Followers, Following */}
              <div className="profile-stats">
                <div className="stat-box">
                  <span className="stat-label">Repositories</span>
                  <span className="stat-value">{user.public_repos.toLocaleString()}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Followers</span>
                  <span className="stat-value">{user.followers.toLocaleString()}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Following</span>
                  <span className="stat-value">{user.following.toLocaleString()}</span>
                </div>
              </div>

              {/* Extra Metadata: Location, Blog, Twitter, Company */}
              <div className="profile-links-grid">
                <div className={`meta-item ${!user.location ? 'disabled' : ''}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{user.location || 'Not Available'}</span>
                </div>

                <div className={`meta-item ${!user.blog ? 'disabled' : ''}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  {user.blog ? (
                    <a
                      href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="meta-link"
                    >
                      {user.blog.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span>Not Available</span>
                  )}
                </div>

                <div className={`meta-item ${!user.twitter_username ? 'disabled' : ''}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                  {user.twitter_username ? (
                    <a
                      href={`https://twitter.com/${user.twitter_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="meta-link"
                    >
                      @{user.twitter_username}
                    </a>
                  ) : (
                    <span>Not Available</span>
                  )}
                </div>

                <div className={`meta-item ${!user.company ? 'disabled' : ''}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>{user.company || 'Not Available'}</span>
                </div>
              </div>

              {/* Bonus: Button to visit user's GitHub profile */}
              <div className="profile-action">
                <a
                  className="visit-profile-btn"
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit GitHub Profile
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </article>

            {/* Bonus: Display list of user's public repositories */}
            <section className="repos-section" aria-label="Public Repositories">
              <div className="repos-header">
                <div>
                  <h3 className="repos-title">Recent Repositories</h3>
                  <p className="repos-subtitle">Latest updated public repositories</p>
                </div>
                <span className="repos-badge">{user.public_repos} total</span>
              </div>

              {repos.length === 0 ? (
                <div className="repos-empty-state">
                  <p>This user has no public repositories yet.</p>
                </div>
              ) : (
                <div className="repos-grid">
                  {repos.map((repo) => {
                    const langColor = repo.language
                      ? LANGUAGE_COLORS[repo.language] || '#6366f1'
                      : null

                    return (
                      <article key={repo.id} className="repo-card">
                        <div className="repo-card-top">
                          <a
                            className="repo-title"
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="repo-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                            {repo.name}
                          </a>
                          <span className="repo-visibility">
                            {repo.private ? 'Private' : 'Public'}
                          </span>
                        </div>

                        <p className="repo-desc">
                          {repo.description || 'No description provided.'}
                        </p>

                        <div className="repo-footer">
                          {repo.language && (
                            <span className="repo-language">
                              <span
                                className="language-circle"
                                style={{ backgroundColor: langColor }}
                                aria-hidden="true"
                              />
                              {repo.language}
                            </span>
                          )}

                          <span className="repo-metric" title="Stars">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none" aria-hidden="true">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            {repo.stargazers_count}
                          </span>

                          <span className="repo-metric" title="Forks">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="6" y1="3" x2="6" y2="15" />
                              <circle cx="18" cy="6" r="3" />
                              <circle cx="6" cy="18" r="3" />
                              <path d="M18 9a9 9 0 0 1-9 9" />
                            </svg>
                            {repo.forks_count}
                          </span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              {user.public_repos > repos.length && (
                <div className="view-all-repos-wrapper">
                  <a
                    className="view-all-repos-btn"
                    href={`${user.html_url}?tab=repositories`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View all {user.public_repos} repositories on GitHub
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>GitHub Profile Finder &bull; Prototype</p>
      </footer>
    </div>
  )
}
