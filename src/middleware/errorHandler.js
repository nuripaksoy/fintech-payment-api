const Stripe = require('stripe');

/**
 * Global error handler
 * Fintech API'lerde hata mesajları tutarlı ve güvenli olmalı —
 * stack trace veya hassas veri asla client'a sızmamalı.
 */
function errorHandler(err, req, res, next) {
  // Konsola tam hata (sadece server tarafında)
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Stripe hataları
  if (err instanceof Stripe.errors.StripeError) {
    return res.status(err.statusCode || 402).json({
      error: 'Payment Error',
      code: err.code,
      message: err.message,
      // Decline code — kart reddinde kullanıcıya gösterilecek mesaj
      declineCode: err.decline_code || undefined,
    });
  }

  // Validation hataları (kendi fırlattığımız)
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', message: err.message });
  }

  // SyntaxError — bozuk JSON body
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid JSON body' });
  }

  // Default 500
  res.status(err.statusCode || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  });
}

module.exports = { errorHandler };
