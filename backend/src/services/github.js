// GitHub API Service
// Rule 3 & 9: Exclude learning, practice, and hackathon repos

const EXCLUSION_KEYWORDS = [
  'practice', 'learning', 'tutorial', 'beginner', 'test',
  'demo', 'playground', 'dsa', 'leetcode', 'study',
  'course', 'exercise', 'example', 'sample', 'starter',
];

const HACKATHON_KEYWORDS = ['hackathon', 'hack', '24h', '48h', 'devpost'];

async function fetchAndFilterRepos(username, token) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeDNA-Engine/1.0'
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  } else if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    // Fallback to OAuth App basic auth to get 5000 req/hr rate limit instead of 60 req/hr
    const credentials = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  let allRepos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 5) { // Cap at 500 repos to prevent excessive requests
    const url = token 
      ? `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner&visibility=public` 
      : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated&type=owner`;

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();
    if (repos.length === 0) {
      hasMore = false;
    } else {
      allRepos = allRepos.concat(repos);
      if (repos.length < 100) hasMore = false;
      page++;
    }
  }

  // Apply filters from CodeDNA_Engine_DoNot.md
  const filteredRepos = allRepos.filter(repo => {
    // Exclude forks (Rule 10: authorship ambiguity)
    if (repo.fork) return false;

    // Exclude archived repos (Rule 9)
    if (repo.archived) return false;

    // Exclude repos with < 3 commits worth of content (Blueprint §11 Step 2)
    if (repo.size < 10) return false;

    const name = repo.name.toLowerCase();
    const desc = (repo.description || '').toLowerCase();

    // Rule 3: Check learning/practice keywords
    const isLearning = EXCLUSION_KEYWORDS.some(kw => name.includes(kw) || desc.includes(kw));
    if (isLearning) return false;

    // Rule 9: Check hackathon keywords
    const isHackathon = HACKATHON_KEYWORDS.some(kw => name.includes(kw) || desc.includes(kw));
    if (isHackathon) return false;

    return true;
  });

  // Sort by activity and take top 10 (Blueprint §11 Step 2)
  const sorted = filteredRepos
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 10);

  return sorted.map(repo => ({
    name: repo.name,
    clone_url: repo.clone_url,
    language: repo.language,
    default_branch: repo.default_branch,
  }));
}

module.exports = { fetchAndFilterRepos };
