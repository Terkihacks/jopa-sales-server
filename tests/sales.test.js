const request = require('supertest');
const express = require('express');

// Mock Prisma Client BEFORE imports
jest.mock('../src/prismaClient', () => ({
  product: {
    findUnique: jest.fn(),
  },
  sale: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require('../src/prismaClient');
const salesRoutes = require('../src/routes/salesRoutes');

const app = express();
app.use(express.json());
app.use('/v1/sales', salesRoutes);

describe('Sales Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('POST /v1/sales/create-sale', () => {
    it('should create a sale successfully', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 100,
      };

      const mockSale = {
        id: 1,
        productId: 1,
        quantity: 5,
        total: 500,
        profit: 50,
        userId: 1,
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.sale.create.mockResolvedValue(mockSale);

      const response = await request(app)
        .post('/v1/sales/create-sale')
        .send({
          productId: 1,
          quantity: 5,
          profit: 50,
          userId: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockSale);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.sale.create).toHaveBeenCalledWith({
        data: {
          productId: 1,
          quantity: 5,
          total: 500,
          profit: 50,
          userId: 1,
        },
      });
    });

    it('should return 404 if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/v1/sales/create-sale')
        .send({
          productId: 999,
          quantity: 5,
          profit: 50,
          userId: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Product not found' });
    });

    it('should return 500 if sale creation fails', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 1, price: 100 });
      prisma.sale.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/v1/sales/create-sale')
        .send({
          productId: 1,
          quantity: 5,
          profit: 50,
          userId: 1,
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to record sale' });
    });
  });

  describe('GET /v1/sales/sales', () => {
    it('should fetch all sales with product and user data', async () => {
      const mockSales = [
        {
          id: 1,
          productId: 1,
          quantity: 5,
          total: 500,
          profit: 50,
          userId: 1,
          product: { id: 1, name: 'Product 1' },
          user: { id: 1, name: 'User 1' },
        },
        {
          id: 2,
          productId: 2,
          quantity: 3,
          total: 300,
          profit: 30,
          userId: 2,
          product: { id: 2, name: 'Product 2' },
          user: { id: 2, name: 'User 2' },
        },
      ];

      prisma.sale.findMany.mockResolvedValue(mockSales);

      const response = await request(app).get('/v1/sales/sales');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSales);
      expect(prisma.sale.findMany).toHaveBeenCalledWith({
        include: { product: true, user: true },
      });
    });

    it('should return 500 if fetching sales fails', async () => {
      prisma.sale.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/v1/sales/sales');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch sales' });
    });
  });

  describe('PUT /v1/sales/update-sale/:id', () => {
    it('should update a sale successfully', async () => {
      const mockExistingSale = {
        id: 1,
        productId: 1,
        quantity: 5,
        total: 500,
        profit: 50,
        product: { id: 1, price: 100 },
      };

      const mockUpdatedSale = {
        id: 1,
        productId: 1,
        quantity: 10,
        total: 1000,
        profit: 100,
      };

      prisma.sale.findUnique.mockResolvedValue(mockExistingSale);
      prisma.sale.update.mockResolvedValue(mockUpdatedSale);

      const response = await request(app)
        .put('/v1/sales/update-sale/1')
        .send({
          quantity: 10,
          profit: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedSale);
      expect(prisma.sale.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity: 10, total: 1000, profit: 100 },
      });
    });

    it('should return 404 if sale not found', async () => {
      prisma.sale.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/v1/sales/update-sale/999')
        .send({
          quantity: 10,
          profit: 100,
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Sale not found' });
    });

    it('should return 500 if update fails', async () => {
      prisma.sale.findUnique.mockResolvedValue({
        id: 1,
        product: { price: 100 },
      });
      prisma.sale.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/v1/sales/update-sale/1')
        .send({
          quantity: 10,
          profit: 100,
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update sale' });
    });
  });

  describe('DELETE /v1/sales/delete-sale/:id', () => {
    it('should delete a sale successfully', async () => {
      prisma.sale.delete.mockResolvedValue({ id: 1 });

      const response = await request(app).delete('/v1/sales/delete-sale/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Sale deleted successfully' });
      expect(prisma.sale.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return 500 if deletion fails', async () => {
      prisma.sale.delete.mockRejectedValue(new Error('Sale not found'));

      const response = await request(app).delete('/v1/sales/delete-sale/999');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to delete sale' });
    });
  });
});