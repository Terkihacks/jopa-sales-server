const prisma = require('../prismaClient');

const kpiMetrics = async () => {
  try {
    // Total sales and profit
    const totalSales = await prisma.sale.aggregate({
      _sum: { total: true },
    });

    const totalProfit = await prisma.sale.aggregate({
      _sum: { profit: true },
    });

    const averagesaleValue = await prisma.sale.aggregate({
      _avg: { total: true },
    });

    // Top product by sales
    const topProductSale = await prisma.sale.groupBy({
      by: ['productId'],
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 1,
    });

    let topProduct = null;
    if (topProductSale.length > 0) {
      topProduct = await prisma.product.findUnique({
        where: { id: topProductSale[0].productId },
      });
    }

    // Daily sales summary (latest 10 entries for example)
    const dailySales = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
     });

    // Weekly sales
    const weeklySales = await prisma.$queryRaw`
      SELECT
        date_trunc('week', "createdAt") AS week,
        SUM(total) AS total_sales,
        SUM(profit) AS total_profit
      FROM "Sale"
      GROUP BY week
      ORDER BY week ASC;
    `;

    // Monthly sales
    const monthlySales = await prisma.$queryRaw`
      SELECT
        date_trunc('month', "createdAt") AS month,
        SUM(total) AS total_sales,
        SUM(profit) AS total_profit
      FROM "Sale"
      GROUP BY month
      ORDER BY month ASC;
    `;

    // Top 5 users by sales
    const topUsersRaw = await prisma.sale.groupBy({
      by: ['userId'],
      _sum: { total: true, profit: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });

    const topUsers = await Promise.all(
      topUsersRaw.map(async (u) => ({
        ...u,
        user: await prisma.user.findUnique({ where: { id: u.userId } }),
      }))
    );

    // Low stock products (quantity <= 5)
    const lowStockProducts = await prisma.product.findMany({
      where: { quantity: { lte: 5 } },
      orderBy: { quantity: 'asc' },
    });

    // Add daily growth % (trend indicator) Compare yesterday vs today’s totals
    const [today, yesterday] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { total: true, profit: true },
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        },
      },
    }),
    prisma.sale.aggregate({
      _sum: { total: true, profit: true },
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 1)),
          lte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    })
  ]);

  const growthRate = ((today._sum.total - yesterday._sum.total) / (yesterday._sum.total || 1)) * 100;


    return {
      totalSales: totalSales._sum.total || 0,
      totalProfit: totalProfit._sum.profit || 0,
      averagesaleValue: averagesaleValue._avg.total || 0,
      topProduct,
      dailySales,
      weeklySales,
      monthlySales,
      topUsers,
      lowStockProducts,
      growthRate: isNaN(growthRate) ? 0 : growthRate,
    };
  } catch (error) {
    console.error('Error fetching KPI metrics:', error);
    return null;
  }
};

module.exports = kpiMetrics;
