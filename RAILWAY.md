# Deploying the API to Railway

The API (`@lokocontent/api`) depends on the workspace package `@lokocontent/db`. The build **must** run from the **repository root** so that `pnpm` can install and build the db package first.

## Required settings for the API service

1. **Root Directory**  
   Leave **empty** (repository root). Do **not** set it to `apps/api`.  
   If Root Directory is `apps/api`, the workspace is not available and you get many TypeScript errors (e.g. "Cannot find module '@lokocontent/db'").

2. **Build**  
   The repo root `railway.toml` configures:
   - **Builder**: Dockerfile  
   - **Dockerfile path**: `apps/api/Dockerfile`  

   The Dockerfile expects the build context to be the repo root (it copies `packages/db`, `apps/api`, root `package.json`, etc.).

3. **Start**  
   The Docker image already runs `node dist/main.js` from `apps/api`. No custom start command is required unless you override it.

## Optional: set Dockerfile path via variable

If the root `railway.toml` is not used (e.g. config is read from another path), set in the API service variables:

- `RAILWAY_DOCKERFILE_PATH` = `apps/api/Dockerfile`  
- Ensure the API service has **no Root Directory** so the build context is the repo root.
