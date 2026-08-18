const REPO = process.env.GITHUB_REPO || 'solutecmontilla-ai/aiprofit-ventas';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

async function getFile(path) {
  // The Contents API omits the inline `content` field for files over 1MB
  // (only metadata, including `sha`, comes back) — index.html is ~1.1MB.
  // So fetch the sha from Contents API and the actual text from raw.githubusercontent.com.
  const metaRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!metaRes.ok) throw new Error(`GitHub GET ${path} failed: ${metaRes.status} ${await metaRes.text()}`);
  const meta = await metaRes.json();

  const rawRes = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`, {
    headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
  });
  if (!rawRes.ok) throw new Error(`GitHub RAW ${path} failed: ${rawRes.status}`);
  const content = await rawRes.text();

  return { content, sha: meta.sha };
}

async function putFile(path, content, sha, message) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      sha,
      branch: BRANCH,
    }),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function checkAuth(req) {
  const password = req.headers['x-editor-password'];
  return Boolean(process.env.EDITOR_PASSWORD) && password === process.env.EDITOR_PASSWORD;
}

module.exports = { getFile, putFile, checkAuth };
