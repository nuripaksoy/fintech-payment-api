const express = require('express');
const router = express.Router();
const { constructWebhookEvent } = require('../services/stripeService');

// Stripe webhook'ları için raw body gerekiyor — JSON parse yapma
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event;
    try {
      event = constructWebhookEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_demo'
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    // Event'i işle
    try {
      await handleStripeEvent(event);
      res.json({ received: true, type: event.type });
    } catch (err) {
      console.error(`Webhook handler error: ${err.message}`);
      // 200 döndür — Stripe başarısız event'i tekrar gönderir
      res.status(200).json({ received: true, warning: 'Handler error, event logged' });
    }
  }
);

/**
 * Stripe event router
 * Gerçek projede bu event'ler DB'ye yazılır, bildirim gönderilir vb.
 */
async function handleStripeEvent(event) {
  const { type, data } = event;

  console.log(`[Webhook] Received: ${type}`);

  switch (type) {
    case 'payment_intent.succeeded':
      await onPaymentSucceeded(data.object);
      break;

    case 'payment_intent.payment_failed':
      await onPaymentFailed(data.object);
      break;

    case 'payment_intent.canceled':
      console.log(`[Webhook] Payment canceled: ${data.object.id}`);
      break;

    case 'charge.refunded':
      await onRefundProcessed(data.object);
      break;

    case 'customer.created':
      console.log(`[Webhook] New customer: ${data.object.id} (${data.object.email})`);
      break;

    default:
      // Beklenmeyen event'leri sessizce logla
      console.log(`[Webhook] Unhandled event type: ${type}`);
  }
}

async function onPaymentSucceeded(paymentIntent) {
  console.log(`[Webhook] ✅ Payment succeeded: ${paymentIntent.id}`);
  console.log(`           Amount : ${paymentIntent.amount} ${paymentIntent.currency.toUpperCase()}`);
  console.log(`           Order  : ${paymentIntent.metadata?.orderId || 'N/A'}`);

  // Gerçek projede yapılacaklar:
  // 1. DB'de sipariş durumunu "paid" yap
  // 2. E-posta / bildirim gönder
  // 3. Envanter düş, fulfillment başlat
}

async function onPaymentFailed(paymentIntent) {
  const failureCode = paymentIntent.last_payment_error?.code;
  console.log(`[Webhook] ❌ Payment failed: ${paymentIntent.id}`);
  console.log(`           Reason : ${failureCode || 'unknown'}`);

  // Gerçek projede yapılacaklar:
  // 1. DB'de sipariş durumunu "payment_failed" yap
  // 2. Kullanıcıya hata bildirimi gönder
  // 3. Retry logic (kart değiştirme linki vb.)
}

async function onRefundProcessed(charge) {
  console.log(`[Webhook] 💰 Refund processed for charge: ${charge.id}`);
  console.log(`           Refunded: ${charge.amount_refunded} ${charge.currency.toUpperCase()}`);
}

module.exports = router;
