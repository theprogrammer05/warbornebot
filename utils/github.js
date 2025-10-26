import fetch from 'node-fetch';

// GitHub info from environment
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // format: "username/repo"
const GITHUB_USER = process.env.GITHUB_USER;
const BRANCH = process.env.BRANCH || 'main';

/**
 * Update a JSON file on GitHub (creates if missing)
 * @param {string} fileName - Name of the file (e.g., 'faq.json', 'schedule.json')
 * @param {Object|Array} data - The data to write to the file
 * @param {string} commitMessage - Custom commit message
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export async function updateGitHubFile(fileName, data, commitMessage = `Update ${fileName} via Discord bot`) {
  if (!GITHUB_REPO || !GITHUB_TOKEN || !GITHUB_USER) {
    console.error('❌ Missing one of GITHUB_REPO, GITHUB_TOKEN, or GITHUB_USER');
    return false;
  }

  let sha;

  try {
    const getUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}?ref=${BRANCH}`;
    console.log('GET URL:', getUrl);

    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': GITHUB_USER,
      },
    });

    console.log('GET status:', getRes.status);

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      console.log('Existing file SHA:', sha);
    } else if (getRes.status === 404) {
      console.log(`File ${fileName} does not exist in repo, will create new file.`);
    } else {
      const errText = await getRes.text();
      console.error('GitHub GET failed:', getRes.status, errText);
      return false;
    }
  } catch (err) {
    console.error('GitHub GET request failed:', err);
    return false;
  }

  try {
    const putUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}`;
    console.log('PUT URL:', putUrl);

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': GITHUB_USER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
        sha, // undefined if creating new file
        branch: BRANCH,
      }),
    });

    console.log('PUT status:', putRes.status);

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.error('GitHub PUT failed:', errText);
      return false;
    } else {
      console.log(`✅ ${fileName} pushed to GitHub successfully.`);
      return true;
    }
  } catch (err) {
    console.error('GitHub PUT request failed:', err);
    return false;
  }
}
