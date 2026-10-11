# Publish Lounna’s Chiktay website with Stripe

## What is included
- Shopping basket: 12 oz jar = $30, 32 oz jar = $40.
- Secure Stripe-hosted payment redirect.
- Stripe-signed webhook route at `/api/stripe-webhook`.
- Render hosting configuration (`render.yaml`).

**This website is not published or connected to Stripe yet.** A domain/hosting login and Stripe secret settings are still required. Do not send your Stripe password or secret keys in chat.

## Deployment
1. Create a PRIVATE GitHub repository and upload the contents of this folder to the repo root. Do not commit `.env` files or Stripe secrets.
2. In [Render](https://dashboard.render.com/), create **New → Blueprint** and connect the repository. Render reads `render.yaml`. If prompted to choose a service plan, confirm costs before deploying.
3. In Render, set **STRIPE_SECRET_KEY** to your Stripe **test** secret key using the host's secret environment variable settings; never put it into `index.html` or a public repository.
4. After Render creates the URL (e.g., `https://lounna-chiktay.onrender.com`), set **PUBLIC_BASE_URL** to that **exact** HTTPS address without a trailing slash. Redeploy/restart if needed.
5. In Stripe Dashboard → Developers → Webhooks, add `https://YOUR-RENDER-URL/api/stripe-webhook`, select `checkout.session.completed`, and copy the webhook signing secret into Render's **STRIPE_WEBHOOK_SECRET** setting.
6. Test both jar sizes, quantities, cancel, payment success, and webhook receipt with Stripe test-mode cards. Check server logs. The current webhook only logs payments, and DOES NOT save orders or notify the seller. Add durable order storage and owner notifications before fulfilling live orders.
7. Before enabling production payments, configure sales tax, shipping/delivery fees, pickup procedure, service area, allergen/ingredients information, food safety compliance, refunds, and fulfillment policy. Current checkout charges the item subtotal only. Confirm every fee with the customer BEFORE payment. If your product is eligible for Stripe's services, switch the test key to your live Stripe key and set the corresponding live webhook secret, then test again.
8. You can attach a purchased domain in Render's custom-domain settings and update **PUBLIC_BASE_URL** to that domain after HTTPS is activated.

## Important
- Opening `index.html` from a file on your phone shows the design, but payment checkout requires the running Node.js server.
- Neither this package nor the Render blueprint automatically signs in to hosting or Stripe for you.
- Stripe's eligible digital wallets depend on device, browser and Stripe account settings.
