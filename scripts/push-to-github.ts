import { getUncachableGitHubClient } from '../server/github-client';
import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = 'expense-tracker-personal';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.config',
  '.local',
  'dist',
  '.replit',
  'replit.nix',
  '.upm',
  'attached_assets',
  'scripts/push-to-github.ts',
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative('.', fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

async function main() {
  try {
    console.log('Getting GitHub client...');
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    let repo;
    try {
      const { data } = await octokit.repos.get({
        owner: user.login,
        repo: REPO_NAME,
      });
      repo = data;
      console.log(`Repository ${REPO_NAME} exists`);
    } catch (e: any) {
      if (e.status === 404) {
        console.log(`Creating repository ${REPO_NAME}...`);
        const { data } = await octokit.repos.createForAuthenticatedUser({
          name: REPO_NAME,
          description: 'Daily Expense Tracking App - Built with React, Express, and PostgreSQL',
          private: false,
          auto_init: true,
        });
        repo = data;
        console.log(`Repository created: ${repo.html_url}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw e;
      }
    }
    
    console.log('Collecting files...');
    const files = getAllFiles('.');
    console.log(`Found ${files.length} files to upload`);
    
    let mainSha: string | undefined;
    try {
      const { data: ref } = await octokit.git.getRef({
        owner: user.login,
        repo: REPO_NAME,
        ref: 'heads/main',
      });
      mainSha = ref.object.sha;
    } catch (e) {
      console.log('No main branch yet, will create initial commit');
    }
    
    console.log('Creating blobs...');
    const blobs: { path: string; sha: string; mode: string; type: string }[] = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file);
        const { data: blob } = await octokit.git.createBlob({
          owner: user.login,
          repo: REPO_NAME,
          content: content.toString('base64'),
          encoding: 'base64',
        });
        blobs.push({
          path: file,
          sha: blob.sha,
          mode: '100644',
          type: 'blob',
        });
        process.stdout.write('.');
      } catch (e) {
        console.log(`\nSkipping ${file}: unable to read`);
      }
    }
    console.log('\nBlobs created');
    
    console.log('Creating tree...');
    const { data: tree } = await octokit.git.createTree({
      owner: user.login,
      repo: REPO_NAME,
      tree: blobs as any,
      base_tree: mainSha,
    });
    
    console.log('Creating commit...');
    const { data: commit } = await octokit.git.createCommit({
      owner: user.login,
      repo: REPO_NAME,
      message: 'Update expense tracker app with currency selection and category fixes',
      tree: tree.sha,
      parents: mainSha ? [mainSha] : [],
    });
    
    console.log('Updating main branch...');
    if (mainSha) {
      await octokit.git.updateRef({
        owner: user.login,
        repo: REPO_NAME,
        ref: 'heads/main',
        sha: commit.sha,
      });
    } else {
      await octokit.git.createRef({
        owner: user.login,
        repo: REPO_NAME,
        ref: 'refs/heads/main',
        sha: commit.sha,
      });
    }
    
    console.log(`\nSuccess! Code pushed to: https://github.com/${user.login}/${REPO_NAME}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
