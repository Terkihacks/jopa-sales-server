const request = require('supertest');
const express = require('express');

// IMPORTANT: Mock must be declared BEFORE importing modules that use it
jest.mock('../src/prismaClient', () => ({
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Import AFTER the mock is set up
const prisma = require('../src/prismaClient');
const productRoutes = require('../src/routes/productRoutes');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/v1/products', productRoutes);

describe('Product Routes', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up after all tests
    jest.restoreAllMocks();
  });

  describe('POST /v1/products/create-product', () => {
    it('should create a product successfully', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        code: 'TP001',
        category: 'Electronics',
        price: 99.99,
      };

      prisma.product.create.mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/v1/products/create-product')
        .send({
          name: 'Test Product',
          code: 'TP001',
          category: 'Electronics',
          price: 99.99,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Product',
          code: 'TP001',
          category: 'Electronics',
          price: 99.99,
        },
      });
    });

    it('should return 500 if product creation fails', async () => {
      prisma.product.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/v1/products/create-product')
        .send({
          name: 'Test Product',
          code: 'TP001',
          category: 'Electronics',
          price: 99.99,
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create product' });
    });
  });

  describe('GET /v1/products/products', () => {
    it('should fetch all products with sales', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          code: 'P001',
          category: 'Electronics',
          price: 99.99,
          sales: [],
        },
        {
          id: 2,
          name: 'Product 2',
          code: 'P002',
          category: 'Furniture',
          price: 199.99,
          sales: [{ id: 1, quantity: 5 }],
        },
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts);

      const response = await request(app).get('/v1/products/products');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        include: { sales: true },
      });
    });

    it('should return 500 if fetching products fails', async () => {
      prisma.product.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/v1/products/products');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch products' });
    });
  });

  describe('PUT /v1/products/update-product/:id', () => {
    it('should update a product successfully', async () => {
      const mockUpdatedProduct = {
        id: 1,
        name: 'Updated Product',
        code: 'UP001',
        category: 'Electronics',
        price: 149.99,
      };

      prisma.product.update.mockResolvedValue(mockUpdatedProduct);

      const response = await request(app)
        .put('/v1/products/update-product/1')
        .send({
          name: 'Updated Product',
          code: 'UP001',
          category: 'Electronics',
          price: 149.99,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedProduct);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Product',
          code: 'UP001',
          category: 'Electronics',
          price: 149.99,
        },
      });
    });

    it('should return 500 if product update fails', async () => {
      prisma.product.update.mockRejectedValue(new Error('Product not found'));

      const response = await request(app)
        .put('/v1/products/update-product/999')
        .send({
          name: 'Updated Product',
          code: 'UP001',
          category: 'Electronics',
          price: 149.99,
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update product' });
    });
  });

  describe('DELETE /v1/products/delete-product/:id', () => {
    it('should delete a product successfully', async () => {
      prisma.product.delete.mockResolvedValue({ id: 1 });

      const response = await request(app).delete('/v1/products/delete-product/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Product deleted successfully' });
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return 500 if product deletion fails', async () => {
      prisma.product.delete.mockRejectedValue(new Error('Product not found'));

      const response = await request(app).delete('/v1/products/delete-product/999');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to delete product' });
    });
  });
});