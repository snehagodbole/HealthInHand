# CI/CD Setup

This repository includes a GitHub Actions workflow at `.github/workflows/azure-app-service.yml`.

The workflow:

- Runs `npm ci`, `npm run lint`, and `npm run build` for pull requests.
- Runs the same validation on pushes to `main` or `master`.
- Deploys a standalone Next.js build to Azure App Service after a successful push build by using GitHub OpenID Connect.

## Azure Target

Use a Linux Azure App Service configured for Node.js 22 LTS. Set the App Service startup command to:

```bash
node server.js
```

Azure DevOps is not itself a hosting runtime. If you meant an Azure DevOps Pipeline instead of GitHub Actions, the same build and package steps can be moved into `azure-pipelines.yml`.

## Azure Authentication

The workflow uses GitHub OpenID Connect instead of a publish profile. This works when Azure App Service basic authentication is disabled.

Create an Azure identity for GitHub Actions, give it permission to deploy to the App Service, and add a federated credential for this repository and branch.

The GitHub federated credential subject for the production branch should be:

```bash
repo:<github-owner>/<github-repo>:ref:refs/heads/main
```

If your production branch is `master`, use:

```bash
repo:<github-owner>/<github-repo>:ref:refs/heads/master
```

## GitHub Repository Secrets

Add these secrets in GitHub under `Settings > Secrets and variables > Actions`:

```bash
AZURE_WEBAPP_NAME=your-app-service-name
AZURE_CLIENT_ID=your-azure-identity-client-id
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_SUBSCRIPTION_ID=your-azure-subscription-id
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-public-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=optional-legacy-public-key
```

Use either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do not use a Supabase secret or service-role key in any `NEXT_PUBLIC_*` secret.

## Azure App Service Settings

Set these application settings in the Azure App Service configuration:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-public-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=optional-legacy-public-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=HealthInHand <invites@yourdomain.com>
NEXT_TELEMETRY_DISABLED=1
```

The Supabase public settings are needed during the GitHub Actions build and again at runtime for server-side routes and middleware. Resend settings are runtime-only and should stay in Azure App Service settings, not client code.

## Required Azure Role

Give the Azure identity at least `Website Contributor` access scoped to the App Service resource.
