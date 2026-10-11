LOUNNA'S CHIKTAY — STRIPE CHECKOUT STARTER

WHAT WORKS
Responsive storefront, two jar sizes, basket, customer order details, and live redirect to Stripe-hosted Checkout after configuration. Stripe handles card information. Apple Pay / Google Pay may appear to eligible customers depending on device, browser, and Stripe settings. A verified webhook endpoint is included for the checkout.session.completed event.

IMPORTANT: This starter is NOT LIVE and cannot charge cards until you connect your own Stripe account, configure environment variables, and deploy to a Node.js hosting service. Opening index.html alone lets you preview the storefront, but /api/checkout requires the Node server.

SETUP
1. Create/activate your Stripe account at stripe.com. Complete verification and enable payment methods.
2. Install Node.js 20 or newer. From the chiktay_store folder run: node server.js
3. Set STRIPE_SECRET_KEY to your Stripe restricted/secret key on your web host (NEVER in HTML/client JS).
4. Set PUBLIC_BASE_URL to the exact published HTTPS URL of the store (for example https://yourdomain.com). Set PORT if required by hosting.
5. Deploy this folder to a Node.js-compatible host such as Render, Railway, or a VPS, using start command `node server.js`.
6. In Stripe Developers → Webhooks, add https://yourdomain.com/api/stripe-webhook, subscribe to checkout.session.completed, and set STRIPE_WEBHOOK_SECRET to the webhook signing secret. Persist and reconcile payments with a database/order system before real fulfillment; current webhook only logs paid session ids.
7. In Stripe test mode use a test secret key and Stripe test cards. Verify the whole order flow and webhook before switching to live keys.

BEFORE TAKING REAL ORDERS
- The prices confirmed by the owner are 12 oz $30 and 32 oz $40, set in BOTH index.html and server.js. The server catalog is authoritative for charging customers. Confirm descriptions and inventory before launch.
- Taxes, delivery charges, shipping rules, refunds, cancellation policy, product ingredients, allergens, legal food production/handling, and fulfillment area must be configured or clarified first. Delivery request as presently coded does not add a delivery fee. Do not go live without settling how final amounts are charged and which delivery areas you serve.
- Configure reliable order notifications, persistence, webhook idempotency, and customer confirmation. The current webhook is a demo that logs successful transactions; it does NOT automatically message the business or email an order summary.
- Do not treat arrival on the success page as proof of payment: verify the signed webhook event and payment_status server-side.
- Only send customers to this checkout after pricing and fulfillment details are finalized.

SECURITY
Never publish STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET; store both as host secrets. HTTPS is required for a production web address. The server independently validates cart items and amounts; customer-side prices are never trusted.
