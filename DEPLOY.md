# Deploying the Agent Trust Ledger publicly

The app is two Cloudflare deployments: the **API Worker** (`apps/api`) and the
**Pages** static frontend (`apps/web`). Local dev needs none of this; these steps
put it on the public internet so people can sign up, review, and add to the demo.

## 0. One-time: log in
```sh
npx wrangler login        # opens a browser — only you can do this
```

## 1. Create the backing resources (from apps/api)
```sh
cd apps/api
npx wrangler d1 create agent-trust-db          # copy database_id → wrangler.toml
npx wrangler kv namespace create SESSIONS       # copy id → wrangler.toml
npx wrangler queues create runs
npx wrangler r2 bucket create agent-outputs
```
Paste the returned `database_id` and KV `id` into `apps/api/wrangler.toml`
(replacing `REPLACE_WITH_D1_ID` / `REPLACE_WITH_KV_ID`).

## 2. Set secrets (from apps/api)
```sh
npx wrangler secret put ENCRYPTION_KEY          # any base64 32-byte string
npx wrangler secret put CLAUDE_API_KEY          # optional: live claude_wrapper runs
npx wrangler secret put STRIPE_SECRET_KEY       # optional: real test-mode Checkout
npx wrangler secret put STRIPE_WEBHOOK_SECRET   # optional: webhook verification
```
- Without `STRIPE_SECRET_KEY`, membership uses the **demo activate** fallback (no charge).
- Set `ADMIN_EMAIL` in `wrangler.toml` to the email you'll sign up with to get admin.
- Set `APP_BASE_URL` in `wrangler.toml` to your Pages URL (for Stripe redirects).

## 3. Migrate + seed the remote DB (from apps/api)
```sh
npx wrangler d1 migrations apply agent-trust-db --remote
npm run db:seed:remote      # loads the task library (no demo users/agents)
```

## 4. Deploy the API
```sh
npx wrangler deploy         # prints https://agent-trust-api.<subdomain>.workers.dev
```

## 5. Deploy the frontend (from apps/web)
```sh
cd ../web
# Point the built app at the deployed Worker (CORS is already enabled on it):
VITE_API_BASE="https://agent-trust-api.<subdomain>.workers.dev" npm run build
npx wrangler pages deploy dist --project-name agent-trust-web
```
This prints your public URL. Share it — anyone can sign up as a **customer**
(pay/browse) or **reviewer** (onboard with expertise → qualify → review), and
you (admin) can paste manual runs and approve reviewer-authored tasks.

## 6. (If using real Stripe) point the webhook
In the Stripe dashboard (test mode), add an endpoint:
`https://agent-trust-api.<subdomain>.workers.dev/webhooks/stripe`
for `checkout.session.completed` and `customer.subscription.updated`, then put
its signing secret into `STRIPE_WEBHOOK_SECRET`.
