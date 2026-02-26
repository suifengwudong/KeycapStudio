# KeycapStudio Release Automation

This folder contains all release-related files and binaries for KeycapStudio.

## Files:
- `KeycapStudio-v*.zip`: Release packages containing the built application
- `RELEASES.md`: Release notes and changelog
- `DEPLOYMENT.md`: Deployment instructions

## Automated Release Process

### Prerequisites:
1. Install GitHub CLI (gh):
   ```powershell
   winget install --id GitHub.cli
   ```
   Or download from: https://cli.github.com/

2. Authenticate with GitHub:
   ```bash
   gh auth login
   ```

### Usage:
Run the automated release script:
```bash
npm run release
```

This will:
1. Build the project (`npm run build`)
2. Create a release package in `releases/`
3. Create a GitHub release with the package and release notes

### Manual Release:
If you prefer manual control:
```bash
gh release create v{VERSION} releases/KeycapStudio-v{VERSION}.zip --title "KeycapStudio v{VERSION}" --notes-file releases/RELEASES.md
```