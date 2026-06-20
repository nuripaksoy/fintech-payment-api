# Fintech Payment API

A production-ready REST API for payment processing, built with **Node.js**, **Express**, and **Stripe**. Designed for fintech applications requiring secure payment flows, refund handling, and webhook processing.

## Features

- **Payment Intents** — Create and track Stripe payment flows
- **Refund processing** — Full and partial refunds with reason tracking
- **Customer management** — Store customers for recurring payments
- **Webhook handler** — Verified Stripe event processing (payment success, failure, refund)
- **Security** — API key auth, rate limiting, Helmet headers, input validation
- **Tests** — 13 tests with Jest + Supertest (zero real API calls via mocking)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 |
| Framework | Express 4 |
| Payments | Stripe API (`2024-12-18`) |
| Security | Helmet, express-rate-limit |
| Testing | Jest, Supertest |

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/YOUR_USERNAME/fintech-payment-api
cd fintech-payment-api
npm install

# 2. Configure environment
cp .env.example .env
# Add your Stripe test keys from https://dashboard.stripe.com/test/apikeys

# 3. Run
npm run dev       # development (nodemon)
npm start         # production
npm test          # run all tests
```

## API Reference

All endpoints require `Authorization: Bearer <api-key>` header.

### Create Payment Intent
```
POST /api/payments/intent
```
```json
{
  "amount": 2000,
  "currency": "usd",
  "description": "Order #1234",
  "orderId": "order_abc123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pi_...",
    "clientSecret": "pi_..._secret_...",
    "amount": 2000,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
```
> The `clientSecret` is passed to your frontend Stripe.js to confirm payment — the card never touches your server.

---

### Get Payment Status
```
GET /api/payments/intent/:id
```

---

### Create Refund
```
POST /api/payments/refund
```
```json
{
  "paymentIntentId": "pi_...",
  "amount": 1000,
  "reason": "requested_by_customer"
}
```
Omit `amount` for a full refund.

---

### Create Customer
```
POST /api/payments/customer
```
```json
{
  "email": "user@example.com",
  "name": "Jane Doe"
}
```

---

### Stripe Webhook
```
POST /api/webhooks/stripe
```
Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `customer.created`.

Stripe signature verification is enforced — invalid requests return `400`.

## Project Structure

```
src/
├── app.js                    # Express app setup
├── server.js                 # Entry point
├── routes/
│   ├── payments.js           # Payment routes
│   └── webhooks.js           # Stripe webhook handler
├── controllers/
│   └── paymentController.js  # Request/response logic
├── services/
│   └── stripeService.js      # Stripe API integration
├── middleware/
│   ├── auth.js               # API key authentication
│   ├── errorHandler.js       # Global error handling
│   └── logger.js             # Request logger
└── utils/
    └── asyncHandler.js       # Async error wrapper

tests/
└── payments.test.js          # 13 integration tests
```

## Security Notes

- API keys are never logged or exposed in error responses
- Webhook events are verified via Stripe signatures before processing
- Rate limiting: 100 requests / 15 minutes per IP
- In production: use secrets manager (AWS Secrets Manager / HashiCorp Vault) instead of `.env`

## Extending This Project

Ideas to expand the portfolio value:
- [ ] Add PostgreSQL for transaction audit log
- [ ] Implement idempotency keys (prevent duplicate charges)
- [ ] Add Swagger/OpenAPI documentation
- [ ] Docker + docker-compose setup
- [ ] Deploy to Railway or Render (free tier)

## License

MIT
