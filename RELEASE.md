# Release Process

This project uses Release Please for automated releases.

> [!WARNING]
> Before doing anything, ensure the [`NPM_TOKEN` secret](#npm-token-authentication) is configured in the repository.

## Release Workflow

### Conventional Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `fix:` patches
- `feat:` minor features
- `feat!:` or `fix!:` breaking changes

### Pre-1.0 Versioning

While version is `0.x.x`, breaking changes bump **minor** version.

### Release Process

1. Push commits to `main` branch
2. Release Please will:
   - Analyze commits
   - Determine version bump
   - Update `package.json`
   - Update `CHANGELOG.md`
   - Create a release PR

3. Review and merge the Release Please PR

### Commit Message Examples

- `fix: resolve task tracking issue`
- `feat: add global task support`
- `feat!: change task management API`
- `docs: improve README`
- `chore: update dependencies`

## Advanced Release Features

### Force a Specific Version

Use the `Release-As` footer in your commit message to force a specific version, bypassing conventional commit analysis:

```bash
git commit --allow-empty -m "chore: release 2.0.0" -m "Release-As: 2.0.0"
```

This creates a commit:

```
chore: release 2.0.0

Release-As: 2.0.0
```

Release Please will open a PR for version `2.0.0` regardless of commit message types.

### Update Extra Files During Release

If you have version numbers in other files beyond `package.json`, configure them in `release-please-config.json`:

```json
{
  "extra-files": [
    "src/version.ts",
    {
      "type": "generic",
      "path": "docs/VERSION.md"
    },
    {
      "type": "yaml",
      "path": ".tool-versions",
      "jsonpath": "$.node"
    }
  ]
}
```

**Supported file types:**

- Generic files (any type)
- JSON files (with JSONPath)
- YAML files (with JSONPath)
- XML files (with XPath)
- TOML files (with JSONPath)

### Magic Comments for Version Markers

Use inline comments to mark where versions should be updated:

```javascript
// x-release-please-version
const VERSION = '1.0.0';

// x-release-please-major
const MAJOR = '1';
```

Or use block markers:

```markdown
<!-- x-release-please-start-version -->

- Current version: 1.0.0
<!-- x-release-please-end -->
```

Available markers:

- `x-release-please-version` - Full semver
- `x-release-please-major` - Major number
- `x-release-please-minor` - Minor number
- `x-release-please-patch` - Patch number

## Do Not

- Manually edit Release Please PRs
- Manually create GitHub releases
- Modify version numbers directly

## Publishing

Releases are automatically published to NPM when the Release Please PR is merged.

### NPM Token Authentication

Publishing authenticates to npm with an [access token](https://docs.npmjs.com/about-access-tokens) stored as the `NPM_TOKEN` repository secret. The [`publish.yml`](.github/workflows/publish.yml) workflow writes it to `~/.npmrc` before running `npm publish`.

**How it works:**

- The `publish` job authenticates with `secrets.NPM_TOKEN` (no interactive 2FA prompt).
- `id-token: write` is still granted so npm can attach **provenance attestations** proving where and how the package was built.
- Publishing is triggered automatically by Release Please via `repository_dispatch`, or manually via the workflow's `workflow_dispatch` input.

**Setup required (one-time):**

1. On npmjs.com, create an **Automation** access token (Automation tokens bypass publish 2FA, which CI requires). A **Granular** token with publish access and "bypass 2FA" enabled, scoped to this package, also works.
2. Store it as a repository secret:

   ```bash
   gh secret set NPM_TOKEN --body "<your-npm-token>"
   ```

3. In **Settings → Actions → General → Workflow permissions**, ensure:
   - **Read and write permissions** is selected (Release Please needs it to push the version/changelog commit and create the release).
   - **Allow GitHub Actions to create and approve pull requests** is enabled (Release Please opens the release PR).

> [!IMPORTANT]
> Treat `NPM_TOKEN` as a long-lived credential: rotate it periodically, and immediately if it is ever exposed. Regenerate on npmjs.com, then re-run `gh secret set NPM_TOKEN`.

When you merge a release PR, the GitHub Actions workflow will automatically:

1. Build the plugin
2. Authenticate to npm with `NPM_TOKEN`
3. Publish to npm and attach provenance attestations
4. Create a GitHub release

### Manual Publishing

You can trigger a publish on demand from the **Actions** tab using the **Publish Package** workflow's `workflow_dispatch` input (choose the `latest` or `next` tag). This uses the same `NPM_TOKEN` authentication as the automated flow.

For ad-hoc local publishing (testing only), use the mise task — it disables provenance outside CI and supports OTP:

```bash
npm login
mise run publish --tag latest
# if your npm account enforces publish 2FA:
mise run publish --tag latest --otp <one-time-code>
```

Prefer the automated Release Please flow for real releases so versioning, the changelog, and the GitHub release stay consistent.
