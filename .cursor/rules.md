# Cursor Coding Rules

✅ Use environment variables for all API keys and secrets.
✅ Never commit secrets or keys in code.
✅ Use Supabase RLS policies for table access control.
✅ Confirm before running destructive DB migrations.
✅ When implementing concurrency, use safe limits (max 5 parallel for OpenAI).
✅ Use p-limit for concurrency management.
✅ All DB writes should be batched where possible for performance.
✅ Always write TypeScript with strict types enabled.
✅ Follow existing file structure and module patterns.
✅ Document major changes in comments within PRs or commits.

✅ Validate upstream and downstream dependencies before refactoring shared modules.
✅ Maintain API contract consistency across modules.
✅ Do not remove existing environment variables or change their naming without explicit confirmation.
✅ For Supabase migrations, check existing policies and triggers before altering schemas.
✅ Provide data migration strategy when altering schemas.
✅ Confirm input-output schema compatibility when changing AI model calls.
✅ Validate concurrency changes against OpenAI rate limits and Supabase write limits.
✅ Do not modify job processing logic without assessing performance, transactional integrity, and logging.
✅ Prefer lightweight, audited packages for new dependencies.
✅ Maintain functional parity in UI changes unless explicitly approved.
✅ Ensure public routes remain authenticated or protected per RLS.
✅ Keep CORS policies secure on API routes.
✅ Lint and format code before finalizing changes.
✅ Write tests for critical workflow changes.
✅ Prefer progressive enhancement over destructive refactors.
