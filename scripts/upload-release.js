const fs = require('fs');
const path = require('path');
const { Octokit } = require("@octokit/rest");

async function uploadBackupToGitHubRelease(filePath) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set.');
  }

  const octokit = new Octokit({ auth: token });

  // Extract repo info from git config
  const repoOwner = 'EssentialsEgypt'; // Replace with dynamic extraction if needed
  const repoName = 'web'; // Replace with dynamic extraction if needed

  const tagName = `backup-${new Date().toISOString().slice(0,10)}`;
  const releaseName = `Complete Project Backup - ${new Date().toISOString().slice(0,10)}`;
  const releaseBody = 'Automated complete project backup ZIP uploaded as a GitHub release asset.';

  // Create a new release
  const releaseResponse = await octokit.repos.createRelease({
    owner: repoOwner,
    repo: repoName,
    tag_name: tagName,
    name: releaseName,
    body: releaseBody,
    draft: false,
    prerelease: false,
  });

  const releaseId = releaseResponse.data.id;
  const uploadUrl = releaseResponse.data.upload_url;

  // Read the ZIP file
  const fileName = path.basename(filePath);
  const fileData = fs.readFileSync(filePath);

  // Upload the ZIP as a release asset
  const assetResponse = await octokit.repos.uploadReleaseAsset({
    url: uploadUrl,
    headers: {
      "content-type": "application/zip",
      "content-length": fileData.length,
    },
    name: fileName,
    data: fileData,
  });

  return {
    releaseId,
    assetId: assetResponse.data.id,
    downloadUrl: assetResponse.data.browser_download_url,
  };
}

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node upload-release.js <path-to-zip-file>');
    process.exit(1);
  }
  uploadBackupToGitHubRelease(filePath)
    .then((result) => {
      console.log('Upload successful:', result);
    })
    .catch((err) => {
      console.error('Upload failed:', err);
    });
}

module.exports = { uploadBackupToGitHubRelease };
