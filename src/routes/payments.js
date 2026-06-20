const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createPaymentIntent,
  getPaymentStatus,
  createRefund,
  createCustomer,
} = require('../controllers/paymentController');

// Tüm payment route'ları API key ile korunuyor
router.use(authenticate);

// POST /api/payments/intent   → Yeni ödeme başlat
router.post('/intent', createPaymentIntent);

// GET  /api/payments/intent/:id → Ödeme durumu sorgula
router.get('/intent/:id', getPaymentStatus);

// POST /api/payments/refund   → İade işlemi
router.post('/refund', createRefund);

// POST /api/payments/customer → Müşteri oluştur
router.post('/customer', createCustomer);

module.exports = router;
