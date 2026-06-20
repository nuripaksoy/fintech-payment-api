const stripeService = require('../services/stripeService');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * POST /api/payments/intent
 * Yeni ödeme başlat
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency = 'usd', description, metadata, orderId } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'amount is required' });
  }

  const intent = await stripeService.createPaymentIntent({
    amount,
    currency,
    description: description || `Payment ${orderId || ''}`.trim(),
    metadata: { ...metadata, orderId, source: 'fintech-api' },
  });

  res.status(201).json({
    success: true,
    data: intent,
    // clientSecret frontend'e gönderilir — Stripe.js ile ödemeyi tamamlar
    message: 'Payment intent created. Use clientSecret to confirm payment on frontend.',
  });
});

/**
 * GET /api/payments/intent/:id
 * Ödeme durumu sorgula
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id.startsWith('pi_')) {
    return res.status(400).json({ error: 'Invalid payment intent ID format' });
  }

  const intent = await stripeService.getPaymentIntent(id);

  res.json({ success: true, data: intent });
});

/**
 * POST /api/payments/refund
 * İade işlemi başlat
 */
const createRefund = asyncHandler(async (req, res) => {
  const { paymentIntentId, amount, reason } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'paymentIntentId is required' });
  }

  const refund = await stripeService.createRefund(paymentIntentId, amount, reason);

  res.status(201).json({
    success: true,
    data: refund,
    message: amount ? `Partial refund of ${amount} initiated` : 'Full refund initiated',
  });
});

/**
 * POST /api/payments/customer
 * Müşteri kaydı oluştur (kart kaydetmek için)
 */
const createCustomer = asyncHandler(async (req, res) => {
  const { email, name, metadata } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  const customer = await stripeService.createCustomer({ email, name, metadata });

  res.status(201).json({ success: true, data: customer });
});

module.exports = { createPaymentIntent, getPaymentStatus, createRefund, createCustomer };
