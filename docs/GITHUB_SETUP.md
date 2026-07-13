# DEAP — GitHub Repository Setup Guide

> Prepared 13 July 2026
> Follow these steps to connect the DEAP project to a GitHub remote repository.

---

## Prerequisites

1. A GitHub account — create one at https://github.com/signup if you don't have one
2. Git installed on your machine — verify with `git --version` in your terminal
3. GitHub CLI (optional but recommended) — install from https://cli.github.com/

---

## Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Enter a repository name: **deap-dynamic-employee-assessment-portal** (or your preferred name)
3. Add an optional description: "DEAP — Dynamic Employee Assessment Portal for Nigerian SMEs. Employee training, assessment, analytics, and AI-powered insights."
4. Keep the repository **Public** or **Private** as you prefer
5. **DO NOT** initialise with README, .gitignore, or license (the project already has these)
6. Click **Create repository**

---

## Step 2: Connect Local Repository to GitHub

Run these commands in your terminal (PowerShell) from the project root:

```powershell
# Add the remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/deap-dynamic-employee-assessment-portal.git

# Verify the remote was added
git remote -v
```

---

## Step 3: Push the Code to GitHub

```powershell
# Push the main branch to GitHub
git push -u origin main
```

If your default branch is named `master` instead of `main`:

```powershell
# Rename branch to main
git branch -M main

# Then push
git push -u origin main
```

---

## Step 4: Authenticate with GitHub

If you get an authentication error, use one of these methods:

### Option A: GitHub CLI (Recommended)

```powershell
# Install GitHub CLI if not installed
winget install GitHub.cli

# Authenticate
gh auth login

# Then push again
git push -u origin main
```

### Option B: Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Fine-grained token**
3. Set permissions: **Contents: Read and write**
4. Copy the token
5. Use the token as your password when prompted:

```powershell
git push -u origin main
# Username: YOUR_USERNAME
# Password: (paste the token)
```

### Option C: SSH Key

```powershell
# Generate SSH key (press Enter for defaults)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy the public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: https://github.com/settings/keys

# Then update remote to use SSH
git remote set-url origin git@github.com:YOUR_USERNAME/deap-dynamic-employee-assessment-portal.git

# Push
git push -u origin main
```

---

## Step 5: Verify the Push

1. Go to https://github.com/YOUR_USERNAME/deap-dynamic-employee-assessment-portal
2. You should see all project files
3. The repository will show the full commit history

---

## Step 6: Set Up Branch Protection (Optional)

For production safety, consider setting up branch protection:

1. Go to your repository on GitHub → **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks (if you add CI later)
   - ✅ Do not allow bypassing the above settings

---

## Post-Setup: Update the Progress Log

After successfully pushing to GitHub, update `docs/DEAP_CODEX_PROGRESS.md`:

1. Open the file
2. In the **Project Overview** table, update the **Repository** row to point to your GitHub URL
3. Save and commit

---

## Useful Git Commands

```powershell
# Check current status
git status

# Stage all changes
git add .

# Commit with message
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull

# View commit history
git log --oneline
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `fatal: remote origin already exists` | Run `git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git` |
| `fatal: not a git repository` | Run `git init` first, then add the remote |
| `error: failed to push some refs` | Run `git pull origin main --rebase` first, then push again |
| `Support for password authentication was removed` | Use a Personal Access Token or SSH key (see Step 4) |
