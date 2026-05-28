// GitHub API Service
const GITHUB_FETCH_TIMEOUT_MS = Number(process.env.GITHUB_FETCH_TIMEOUT_MS || 10000);
const GITHUB_MAX_REPO_PAGES = Number(process.env.GITHUB_MAX_REPO_PAGES || 0);
const CODEDNA_MAX_REPO_SIZE_KB = Number(process.env.CODEDNA_MAX_REPO_SIZE_KB || 0);
const CODEDNA_INCLUDE_FORKS = process.env.CODEDNA_INCLUDE_FORKS !== '0';
const CODEDNA_INCLUDE_ARCHIVED = process.env.CODEDNA_INCLUDE_ARCHIVED !== '0';
const GATEWAY_GITHUB_OWNER = process.env.CODEDNA_GATEWAY_GITHUB_OWNER || 'sairaman436';
const GATEWAY_GITHUB_REPO = process.env.CODEDNA_GATEWAY_GITHUB_REPO || 'CODE-DNA';

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
  } else if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  let eligibleRepos = [];
  let page = 1;
  let hasMore = true;

  const isSystemToken = token && process.env.GITHUB_TOKEN && token === process.env.GITHUB_TOKEN;
  const useUserReposEndpoint = token && !isSystemToken;

  while (hasMore && (GITHUB_MAX_REPO_PAGES <= 0 || page <= GITHUB_MAX_REPO_PAGES)) {
    const url = useUserReposEndpoint
      ? `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&type=owner`
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
  if (!CODEDNA_INCLUDE_FORKS && repo.fork) return false;

  if (!CODEDNA_INCLUDE_ARCHIVED && repo.archived) return false;

  // Analyze every non-empty repo by default. CODEDNA_MAX_REPO_SIZE_KB is an
  // optional emergency brake for constrained deployments.
  if (repo.size <= 0) return false;
  if (CODEDNA_MAX_REPO_SIZE_KB > 0 && repo.size > CODEDNA_MAX_REPO_SIZE_KB) return false;

  return true;
}

async function checkGatewayRequirements(username, accessToken) {
  let tokenToUse = accessToken;
  let authHeader = null;

  if (tokenToUse) {
    authHeader = `token ${tokenToUse}`;
  } else if (process.env.GITHUB_TOKEN) {
    authHeader = `token ${process.env.GITHUB_TOKEN}`;
  }

  let followed = false;
  let starred = false;

  // Bypass checks for target creator
  if (username.toLowerCase() === GATEWAY_GITHUB_OWNER.toLowerCase()) {
    return { followed: true, starred: true };
  }

  // 1. Check Follow status
  try {
    const followUrl = accessToken
      ? `https://api.github.com/user/following/${GATEWAY_GITHUB_OWNER}`
      : `https://api.github.com/users/${username}/following/${GATEWAY_GITHUB_OWNER}`;

    const response = await fetchWithTimeout(followUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeDNA-Engine/1.0',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      }
    });

    if (response.status === 204) {
      followed = true;
    }
  } catch (err) {
    console.error(`Error checking follow status for ${username}:`, err.message);
  }

  // 2. Check Star status
  try {
    if (accessToken) {
      const starUrl = `https://api.github.com/user/starred/${GATEWAY_GITHUB_OWNER}/${GATEWAY_GITHUB_REPO}`;
      const response = await fetchWithTimeout(starUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CodeDNA-Engine/1.0',
          'Authorization': authHeader
        }
      });

      if (response.status === 204) {
        starred = true;
      }
    } else {
      // Fallback: search the public starred repositories list
      let page = 1;
      let hasMore = true;
      const maxPages = 3; // Check up to 300 starred repos to avoid timeouts
      
      while (hasMore && page <= maxPages) {
        const starUrl = `https://api.github.com/users/${username}/starred?per_page=100&page=${page}`;
        const response = await fetchWithTimeout(starUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodeDNA-Engine/1.0',
            ...(authHeader ? { 'Authorization': authHeader } : {})
          }
        });

        if (!response.ok) {
          console.error(`Star check list returned status ${response.status}`);
          break;
        }

        const repos = await response.json();
        if (repos.length === 0) {
          hasMore = false;
        } else {
          const requiredFullName = `${GATEWAY_GITHUB_OWNER}/${GATEWAY_GITHUB_REPO}`.toLowerCase();
          const found = repos.some(r => r.full_name?.toLowerCase() === requiredFullName);
          if (found) {
            starred = true;
            break;
          }
          if (repos.length < 100) hasMore = false;
          page++;
        }
      }
    }
  } catch (err) {
    console.error(`Error checking star status for ${username}:`, err.message);
  }

  return { followed, starred };
}

module.exports = { fetchAndFilterRepos, fetchWithTimeout, isEligibleRepo, checkGatewayRequirements };
