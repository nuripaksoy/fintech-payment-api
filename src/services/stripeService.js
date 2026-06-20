const Stripe = require('stripe');

// Stripe instance — gerçek projede bu singleton pattern ile yönetilir
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo', {
  apiVersion: '2024-12-18.acacia',
  telemetry: false,
});

/**
 * Payment Intent oluştur
 * Stripe'ın önerilen ödeme akışı: önce intent oluştur, sonra client'ta onayla
 *
 * @param {Object} params
 * @param {number} params.amount       - Kuruş cinsinden (örn: 1000 = $10.00)
 * @param {string} params.currency     - ISO 4217 (usd, eur, try...)
 * @param {string} params.description  - Ödeme açıklaması
 * @param {Object} params.metadata     - İş mantığı verileri (order_id vb.)
 */
async function createPaymentIntent({ amount, currency, description, metadata = {} }) {
  validateAmount(amount, currency);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    description,
    metadata,
    // Otomatik ödeme yöntemleri — Stripe en uygun seçeneği belirler
    automatic_payment_methods: { enabled: true },
  });

  return {
    id: intent.id,
    clientSecret: intent.client_secret,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
    createdAt: new Date(intent.created * 1000).toISOString(),
  };
}

/**
 * Payment Intent sorgula
 */
async function getPaymentIntent(intentId) {
  const intent = await stripe.paymentIntents.retrieve(intentId);
  return formatIntent(intent);
}

/**
 * Iade işlemi (tam veya kısmi)
 *
 * @param {string} paymentIntentId
 * @param {number} [amount] - Belirtilmezse tam iade
 * @param {string} [reason] - duplicate | fraudulent | requested_by_customer
 */
async function createRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
  const refundParams = {
    payment_intent: paymentIntentId,
    reason,
  };

  if (amount) {
    validateAmount(amount);
    refundParams.amount = amount;
  }

  const refund = await stripe.refunds.create(refundParams);

  return {
    id: refund.id,
    amount: refund.amount,
    currency: refund.currency,
    status: refund.status,
    reason: refund.reason,
    paymentIntentId: refund.payment_intent,
    createdAt: new Date(refund.created * 1000).toISOString(),
  };
}

/**
 * Müşteri oluştur (kart kaydetmek için)
 */
async function createCustomer({ email, name, metadata = {} }) {
  const customer = await stripe.customers.create({ email, name, metadata });

  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    createdAt: new Date(customer.created * 1000).toISOString(),
  };
}

/**
 * Webhook imza doğrulama
 * Sahte webhook'lara karşı kritik güvenlik katmanı
 */
function constructWebhookEvent(rawBody, signature, secret) {
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

// ── Yardımcı fonksiyonlar ──────────────────────────────────────────────────

function validateAmount(amount, currency) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ValidationError('Amount must be a positive integer (in smallest currency unit)');
  }
  // Sıfır ondalıklı para birimleri (JPY, KRW vb.) için minimum kontrol
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd', 'clp'];
  const isZeroDecimal = currency && zeroDecimalCurrencies.includes(currency.toLowerCase());
  const minimumAmount = isZeroDecimal ? 1 : 50; // $0.50 minimum
  if (amount < minimumAmount) {
    throw new ValidationError(`Minimum amount is ${minimumAmount} for ${currency || 'this currency'}`);
  }
}

function formatIntent(intent) {
  return {
    id: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
    description: intent.description,
    metadata: intent.metadata,
    createdAt: new Date(intent.created * 1000).toISOString(),
  };
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
  createRefund,
  createCustomer,
  constructWebhookEvent,
  ValidationError,
};
