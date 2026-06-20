const request = require('supertest');
const app = require('../src/app');

// Stripe mock — gerçek API çağrısı yapmadan test
jest.mock('../src/services/stripeService', () => ({
  createPaymentIntent: jest.fn(),
  getPaymentIntent: jest.fn(),
  createRefund: jest.fn(),
  createCustomer: jest.fn(),
  constructWebhookEvent: jest.fn(),
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
      this.statusCode = 400;
    }
  },
}));

const stripeService = require('../src/services/stripeService');

const AUTH_HEADER = { Authorization: 'Bearer demo-api-key-12345' };

describe('Payment API', () => {

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('fintech-payment-api');
    });
  });

  describe('POST /api/payments/intent', () => {
    const mockIntent = {
      id: 'pi_test_123',
      clientSecret: 'pi_test_123_secret_abc',
      amount: 2000,
      currency: 'usd',
      status: 'requires_payment_method',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    beforeEach(() => {
      stripeService.createPaymentIntent.mockResolvedValue(mockIntent);
    });

    it('creates payment intent successfully', async () => {
      const res = await request(app)
        .post('/api/payments/intent')
        .set(AUTH_HEADER)
        .send({ amount: 2000, currency: 'usd', description: 'Test payment' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('pi_test_123');
      expect(res.body.data.clientSecret).toBeDefined();
    });

    it('defaults currency to usd', async () => {
      await request(app)
        .post('/api/payments/intent')
        .set(AUTH_HEADER)
        .send({ amount: 1000 });

      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'usd' })
      );
    });

    it('returns 400 when amount is missing', async () => {
      const res = await request(app)
        .post('/api/payments/intent')
        .set(AUTH_HEADER)
        .send({ currency: 'usd' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 401 without API key', async () => {
      const res = await request(app)
        .post('/api/payments/intent')
        .send({ amount: 2000 });

      expect(res.status).toBe(401);
    });

    it('returns 401 with wrong API key', async () => {
      const res = await request(app)
        .post('/api/payments/intent')
        .set({ Authorization: 'Bearer wrong-key' })
        .send({ amount: 2000 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/payments/intent/:id', () => {
    const mockIntent = {
      id: 'pi_test_123',
      amount: 2000,
      currency: 'usd',
      status: 'succeeded',
    };

    it('returns payment intent status', async () => {
      stripeService.getPaymentIntent.mockResolvedValue(mockIntent);

      const res = await request(app)
        .get('/api/payments/intent/pi_test_123')
        .set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('succeeded');
    });

    it('returns 400 for invalid intent ID format', async () => {
      const res = await request(app)
        .get('/api/payments/intent/invalid_id')
        .set(AUTH_HEADER);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/payments/refund', () => {
    it('creates full refund successfully', async () => {
      stripeService.createRefund.mockResolvedValue({
        id: 're_test_123',
        amount: 2000,
        currency: 'usd',
        status: 'succeeded',
      });

      const res = await request(app)
        .post('/api/payments/refund')
        .set(AUTH_HEADER)
        .send({ paymentIntentId: 'pi_test_123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when paymentIntentId is missing', async () => {
      const res = await request(app)
        .post('/api/payments/refund')
        .set(AUTH_HEADER)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/payments/customer', () => {
    it('creates customer successfully', async () => {
      stripeService.createCustomer.mockResolvedValue({
        id: 'cus_test_123',
        email: 'test@example.com',
        name: 'Test User',
      });

      const res = await request(app)
        .post('/api/payments/customer')
        .set(AUTH_HEADER)
        .send({ email: 'test@example.com', name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('cus_test_123');
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/payments/customer')
        .set(AUTH_HEADER)
        .send({ name: 'Test User' });

      expect(res.status).toBe(400);
    });
  });

  describe('404 handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.status).toBe(404);
    });
  });
});
