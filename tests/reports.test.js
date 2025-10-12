const request = require('supertest');
const express = require('express');

// Mock Prisma Client BEFORE imports
jest.mock('../src/prismaClient', () => ({
  sale: {
    findMany: jest.fn(),
  },
  report: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require('../src/prismaClient');
const reportsRoutes = require('../src/routes/reportsRoutes');

const app = express();
app.use(express.json());
app.use('/v1/reports', reportsRoutes);

describe('Reports Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('POST /v1/reports/generate', () => {
    it('should generate a report successfully', async () => {
      const mockSales = [
        { id: 1, total: 500, profit: 50, createdAt: new Date() },
        { id: 2, total: 300, profit: 30, createdAt: new Date() },
      ];

      const mockReport = {
        id: 1,
        title: 'Daily Report - 10/12/2025',
        reportType: 'daily',
        totalSales: 800,
        totalProfit: 80,
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-12'),
        userId: 1,
        salesIncluded: mockSales,
        createdBy: { id: 1, name: 'Test User' },
      };

      prisma.sale.findMany.mockResolvedValue(mockSales);
      prisma.report.create.mockResolvedValue(mockReport);

      const response = await request(app)
        .post('/v1/reports/generate')
        .send({
          reportType: 'daily',
          startDate: '2025-10-01',
          endDate: '2025-10-12',
          userId: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Report generated successfully');
      expect(response.body.report.id).toBe(mockReport.id);
      expect(response.body.report.reportType).toBe(mockReport.reportType);
      expect(response.body.report.totalSales).toBe(mockReport.totalSales);
      expect(response.body.report.totalProfit).toBe(mockReport.totalProfit);
      expect(prisma.sale.findMany).toHaveBeenCalled();
      expect(prisma.report.create).toHaveBeenCalled();
    });

    it('should return 400 if reportType is missing', async () => {
      const response = await request(app)
        .post('/v1/reports/generate')
        .send({
          userId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'reportType and userId are required',
      });
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .post('/v1/reports/generate')
        .send({
          reportType: 'daily',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'reportType and userId are required',
      });
    });

    it('should return 404 if no sales found for the period', async () => {
      prisma.sale.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/v1/reports/generate')
        .send({
          reportType: 'daily',
          startDate: '2025-10-01',
          endDate: '2025-10-12',
          userId: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'No sales found for this period',
      });
    });

    it('should return 500 if report generation fails', async () => {
      const mockSales = [
        { id: 1, total: 500, profit: 50, createdAt: new Date() },
      ];

      prisma.sale.findMany.mockResolvedValue(mockSales);
      prisma.report.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/v1/reports/generate')
        .send({
          reportType: 'daily',
          startDate: '2025-10-01',
          endDate: '2025-10-12',
          userId: 1,
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to generate report' });
    });
  });

  describe('GET /v1/reports/', () => {
    it('should fetch all reports', async () => {
      const mockReports = [
        {
          id: 1,
          title: 'Daily Report',
          reportType: 'daily',
          totalSales: 800,
          totalProfit: 80,
          generatedAt: new Date(),
          createdBy: { id: 1, name: 'User 1' },
        },
        {
          id: 2,
          title: 'Weekly Report',
          reportType: 'weekly',
          totalSales: 5000,
          totalProfit: 500,
          generatedAt: new Date(),
          createdBy: { id: 2, name: 'User 2' },
        },
      ];

      prisma.report.findMany.mockResolvedValue(mockReports);

      const response = await request(app).get('/v1/reports/');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0].id).toBe(mockReports[0].id);
      expect(response.body[0].title).toBe(mockReports[0].title);
      expect(response.body[1].id).toBe(mockReports[1].id);
      expect(response.body[1].title).toBe(mockReports[1].title);
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        orderBy: { generatedAt: 'desc' },
        include: { createdBy: true },
      });
    });

    it('should return 500 if fetching reports fails', async () => {
      prisma.report.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/v1/reports/');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch reports' });
    });
  });

  describe('GET /v1/reports/:id', () => {
    it('should fetch a single report by ID', async () => {
      const mockReport = {
        id: 1,
        title: 'Daily Report',
        reportType: 'daily',
        totalSales: 800,
        totalProfit: 80,
        createdBy: { id: 1, name: 'User 1' },
        salesIncluded: [
          {
            id: 1,
            total: 500,
            product: { id: 1, name: 'Product 1' },
            user: { id: 1, name: 'User 1' },
          },
        ],
      };

      prisma.report.findUnique.mockResolvedValue(mockReport);

      const response = await request(app).get('/v1/reports/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockReport);
      expect(prisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          createdBy: true,
          salesIncluded: {
            include: { product: true, user: true },
          },
        },
      });
    });

    it('should return 404 if report not found', async () => {
      prisma.report.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/v1/reports/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Report not found' });
    });

    it('should return 500 if fetching report fails', async () => {
      prisma.report.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/v1/reports/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch report' });
    });
  });

  describe('DELETE /v1/reports/:id', () => {
    it('should delete a report successfully', async () => {
      const mockDeleted = {
        id: 1,
        title: 'Daily Report',
      };

      prisma.report.delete.mockResolvedValue(mockDeleted);

      const response = await request(app).delete('/v1/reports/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Report deleted successfully',
        deleted: mockDeleted,
      });
      expect(prisma.report.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return 500 if deletion fails', async () => {
      prisma.report.delete.mockRejectedValue(new Error('Report not found'));

      const response = await request(app).delete('/v1/reports/999');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to delete report' });
    });
  });
});