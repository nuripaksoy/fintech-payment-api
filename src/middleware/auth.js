/**
 * API Key authentication middleware
 *
 * Fintech API'lerde yaygın pattern: her istek Authorization header'ı taşır.
 * Gerçek projede API key'ler DB'de hash'lenerek saklanır (bcrypt ile).
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header required: Bearer <api-key>',
    });
  }

  const apiKey = authHeader.split(' ')[1];

  // Demo: sabit API key — gerçekte DB lookup yapılır
  const validKey = process.env.API_KEY || 'demo-api-key-12345';

  if (apiKey !== validKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  // Gerçek projede: req.user = await ApiKeyService.lookup(apiKey)
  req.apiKey = apiKey;
  next();
}

module.exports = { authenticate };
