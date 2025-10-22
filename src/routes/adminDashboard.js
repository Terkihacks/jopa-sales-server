const express = require('express');
const prisma = require('../prismaClient');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);
const router = express.Router();

// ============================================
// GET /api/get-admin-dashboard
// Overview metrics + recent sales + trend data
// ============================================
router.get('/admin-dashboard', async (req, res) => {
  try {
    // 1️⃣ Aggregate totals
    const [totalSales, totalProfit, totalTransactions, totalProducts] = await Promise.all([
      prisma.sale.aggregate({ _sum: { total: true } }),
      prisma.sale.aggregate({ _sum: { profit: true } }),
      prisma.sale.count(),
      prisma.product.count(),
    ]);

    // Fetch recent sales (limit 5)
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
        user: { select: { name: true } },
      },
    });

    const formattedRecentSales = recentSales.map((sale) => ({
      id: sale.id,
      product: sale.product.name,
      amount: sale.total,
      customer: sale.user.name,
      time: dayjs(sale.createdAt).fromNow(),
    }));

    // Generate sales trend (last 7 days)
    const salesByDay = await prisma.sale.groupBy({
      by: ['createdAt'],
      _sum: { total: true, profit: true },
    });

    const trend = salesByDay.map((day) => ({
      day: dayjs(day.createdAt).format('ddd'),
      sales: day._sum.total ?? 0,
      profit: day._sum.profit ?? 0,
    }));

    //  Send response
    res.status(200).json({
      success: true,
      stats: {
        totalSales: totalSales._sum.total || 0,
        totalProfit: totalProfit._sum.profit || 0,
        totalTransactions,
        totalProducts,
      },
      recentSales: formattedRecentSales,
      salesTrend: trend,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
