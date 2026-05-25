// GitHub API Service
// Rule 3 & 9: Exclude learning, practice, and hackathon repos

const EXCLUSION_KEYWORDS = [
  'practice', 'learning', 'tutorial', 'beginner', 'test',
  'demo', 'playground', 'dsa', 'leetcode', 'study',
  'course', 'exercise', 'example', 'sample', 'starter',
];

const HACKATHON_KEYWORDS = ['hackathon', 'hack', '24h', '48h', 'devpost'];
const GITHUB_FETCH_TIMEOUT_MS = Number(process.env.GITHUB_FETCH_TIMEOUT_MS || 10000);
const GITHUB_MAX_REPO_PAGES = Number(process.env.GITHUB_MAX_REPO_PAGES || 0);
const CODEDNA_MAX_REPO_SIZE_KB = Number(process.env.CODEDNA_MAX_REPO_SIZE_KB || 0);

async function fetchWithTimeout(url, options = {}, timeoutMs = GITHUB_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`GitHub API timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAndFilterRepos(username, token) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeDNA-Engine/1.0',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  } else if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    // Fallback to OAuth App basic auth to get 5000 req/hr rate limit instead of 60 req/hr
    const credentials = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  let eligibleRepos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && (GITHUB_MAX_REPO_PAGES <= 0 || page <= GITHUB_MAX_REPO_PAGES)) {
    const url = token
      ? `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner&visibility=public`
      : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated&type=owner`;

    const response = await fetchWithTimeout(url, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();
    if (repos.length === 0) {
      hasMore = false;
    } else {
      eligibleRepos = eligibleRepos.concat(repos.filter(isEligibleRepo));
      if (repos.length < 100) hasMore = false;
      page++;
    }
  }

  const sorted = eligibleRepos
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

  return sorted.map(repo => ({
    name: repo.name,
    clone_url: repo.clone_url,
    language: repo.language,
    default_branch: repo.default_branch,
    size: repo.size,
  }));
}

function isEligibleRepo(repo) {
  // Exclude forks (Rule 10: authorship ambiguity)
  if (repo.fork) return false;

  // Exclude archived repos (Rule 9)
  if (repo.archived) return false;

  // Analyze every non-empty repo by default. CODEDNA_MAX_REPO_SIZE_KB is an
  // optional emergency brake for constrained deployments.
  if (repo.size <= 0) return false;
  if (CODEDNA_MAX_REPO_SIZE_KB > 0 && repo.size > CODEDNA_MAX_REPO_SIZE_KB) return false;

  const name = repo.name.toLowerCase();
  const desc = (repo.description || '').toLowerCase();

  const isLearning = EXCLUSION_KEYWORDS.some(kw => name.includes(kw) || desc.includes(kw));
  if (isLearning) return false;

  const isHackathon = HACKATHON_KEYWORDS.some(kw => name.includes(kw) || desc.includes(kw));
  if (isHackathon) return false;

  return true;
}

module.exports = { fetchAndFilterRepos, fetchWithTimeout, isEligibleRepo };
