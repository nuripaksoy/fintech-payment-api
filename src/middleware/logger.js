/**
 * Request logger
 * Fintech API'lerde her isteğin loglanması audit trail için zorunlu.
 * Gerçek projede Winston veya Pino kullanılır, loglar merkezi sisteme gönderilir.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  // Response tamamlandığında logla
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '31' : status >= 400 ? '33' : status >= 200 ? '32' : '36';

    console.log(
      `\x1b[${color}m${status}\x1b[0m ${req.method} ${req.path} — ${duration}ms`
    );
  });

  next();
}

module.exports = { requestLogger };
