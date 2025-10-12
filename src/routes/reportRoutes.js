const express = require('express');
const prisma = require('../prismaClient');
const router = express.Router();


// Generate a new report (daily, weekly, or custom)
router.post('/generate', async (req, res) => {
  const { reportType, startDate, endDate, userId } = req.body;

  try {
    // Validate required fields
    if (!reportType || !userId) {
      return res.status(400).json({ error: 'reportType and userId are required' });
    }

    // Determine date range
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    // Get all sales within range
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } }
    });

    if (!sales.length) {
      return res.status(404).json({ message: 'No sales found for this period' });
    }

    // Compute totals
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);

    // Create a new report
    const newReport = await prisma.report.create({
      data: {
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        reportType,
        totalSales,
        totalProfit,
        startDate: start,
        endDate: end,
        userId,
        salesIncluded: {
          connect: sales.map(s => ({ id: s.id }))
        }
      },
      include: { salesIncluded: true, createdBy: true }
    });

    res.status(201).json({
      message: 'Report generated successfully',
      report: newReport
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});


// Get all reports
router.get('/', async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { generatedAt: 'desc' },
      include: { createdBy: true }
    });
    res.status(200).json(reports);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});


//  Get single report by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: true,
        salesIncluded: {
          include: { product: true, user: true }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(200).json(report);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});


// Delete a report
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await prisma.report.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ message: 'Report deleted successfully', deleted });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});
module.exports = router;
