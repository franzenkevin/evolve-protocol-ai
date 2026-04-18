
The user is asking why the shareable link after publishing is different. Let me check the publish settings and project URLs to understand.

Project URLs from context:
- Preview: `https://id-preview--d5acd8e1-618e-400a-b85d-e21966eecfc6.lovable.app`
- Published: `https://evolve-protocol-ai.lovable.app`
- Custom domain: none

The published URL `evolve-protocol-ai.lovable.app` doesn't match the project name "Hypertrophy". This is likely because the project was renamed after the first publish, but the published subdomain stays as the original slug from when it was first published. Lovable doesn't automatically rename the published subdomain when the project is renamed.

## Why the link looks different

Your published URL is `https://evolve-protocol-ai.lovable.app`, which doesn't match the current project name "Hypertrophy". This happens because:

1. **The published subdomain is locked to the slug used when you first published.** When the project was created/first published, it was named "evolve-protocol-ai". Renaming the project later (to "Hypertrophy") does NOT automatically rename the `.lovable.app` subdomain.

2. **The preview URL is also different by design.** Preview uses the project ID format (`id-preview--<uuid>.lovable.app`), while published uses a friendly slug. These two URLs are always different — preview is for in-editor testing (login-gated), published is the public live site.

## Options to fix

**Option A — Connect a custom domain (recommended for branding)**
Buy or connect `hypertrophy.app` (or similar) via Project Settings → Domains. This gives you a clean branded URL like `https://hypertrophy.app` regardless of the internal slug.

**Option B — Request a subdomain change**
Lovable does not expose a self-serve "rename published subdomain" option in the UI. To change `evolve-protocol-ai.lovable.app` to `hypertrophy.lovable.app`, you'd need to contact Lovable support, OR remix the project under the desired name and republish (but this creates a new project).

**Option C — Workspace branded URLs (Business/Enterprise plan)**
If you're on Business or Enterprise, you can configure branded app URLs like `*.yourcompany.lovable.app` in workspace settings.

## Recommendation

Since the app has paid features (Paddle checkout, push notifications, manifest pointing to Hypertrophy branding), I recommend **Option A**: connect a custom domain like `hypertrophy.app` or `app.hypertrophy.com.br`. This:
- Fixes the inconsistency permanently
- Improves trust in checkout flows (Paddle)
- Allows you to send auth emails from `@hypertrophy.app` (fixing the iCloud/Gmail confirmation issue you reported earlier)
- Auto-provisions SSL

No code changes are needed for this — it's done in **Project Settings → Domains → Connect Domain**.

Want me to also update the manifest, OG tags, and Paddle return URLs to use the new custom domain once you've connected it? Or if you'd prefer, I can guide you through buying a domain directly inside Lovable (Project Settings → Domains → "Buy new domain").
