/**
 * Async route handler wrapper
 * Express 4'te async hataları next()'e iletmek için gerekli.
 * Express 5'te built-in geliyor ama henüz stabil değil.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
