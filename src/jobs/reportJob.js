const cron = require('node-cron');
const prisma = require('../prismaClient');
const { format, startOfDay, endOfDay } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');
const kpiMetrics = require('../utils/kpiMetrics');
const generateReportHTML = require('../utils/reportTemplate');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const path = require('path');
const TIMEZONE = 'Africa/Nairobi';


const scheduleDailyReport = () => {
  // Run every day at midnight in Nairobi timezone
  // '*/5 * * * *' , 0 0 * * *
  let runner = false
  cron.schedule('*/5 * * * *', async () => {
    console.log(`Generating daily report at ${new Date().toISOString()}`);
    if (runner) {
      console.log('Previous report generation still in progress. Skipping this run.');
      return;
    }
    runner = true;

    try {
      // KPI metrics
      const metrics = await kpiMetrics();

      // Get start/end of today in Nairobi timezone
      const nowInTZ = toZonedTime(new Date(), TIMEZONE);
      const startOfDayInTZ = startOfDay(nowInTZ);
      const endOfDayInTZ = endOfDay(nowInTZ);

      // Aggregate today's sales
      const todaysTotals = await prisma.sale.aggregate({
        _sum: { total: true, profit: true },
        where: {
          createdAt: {
            gte: startOfDayInTZ,
            lte: endOfDayInTZ,
          },
        },
      });

      // Create report in DB
      const report = await prisma.report.create({
        data: {
          title: `Daily Report - ${format(startOfDayInTZ, 'yyyy-MM-dd')}`,
          reportType: 'DAILY',
          totalSales: todaysTotals.totalSales || 0,
          totalProfit: todaysTotals._sum.profit || 0,
          startDate: startOfDayInTZ,
          endDate: endOfDayInTZ,
          generatedById: 1,
          summary: `
            Report Date: ${format(startOfDayInTZ, 'yyyy-MM-dd')}
            Total Sales (Today): ${todaysTotals._sum.total || 0}
            Total Profit (Today): ${todaysTotals._sum.profit || 0}
            Average Sale Value (All time): ${metrics.averagesaleValue}
            Top Product (All time): ${metrics.topProduct?.name || 'N/A'}
          `,
        },
      });

       // Generate HTML for the report
        const html = generateReportHTML(report);

        // Create PDF using Puppeteer
        const browser = await puppeteer.launch({ 
          headless: true,
          args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // '--disable-dev-shm-usage',
        // '--disable-gpu',
        // '--no-zygote',
        // '--single-process', 
         ],
         });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '1mm', bottom: '0mm', left: '1mm', right: '1mm' },
        });
        await browser.close();

        // Configure Gmail transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASS,
          },
        });

        transporter.verify((error, success) => {
          if (error) {
            console.error(' Gmail connection failed:', error.message);
          } else {
            console.log(' Gmail connection verified. Ready to send report.');
          }
        });

        // Send email with PDF attachment
        await transporter.sendMail({
          from: `"Jopa Sales System" <${process.env.GMAIL_USER}>`,
          to: 'raymondmunguti4894@gmail.com, jobgani845@gmail.com ',// admin email
          subject: ` Daily Sales Report - ${format(startOfDayInTZ, 'yyyy-MM-dd')}`,
          text: `Please find attached the sales report for ${format(startOfDayInTZ, 'yyyy-MM-dd')}.`,
          attachments: [
            {
              filename: `Daily_Report_${format(startOfDayInTZ, 'yyyy-MM-dd')}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        console.log('📩 Daily report emailed successfully.');
      } catch (error) {
        console.error('🚨 Error generating daily report:', error);
      } finally {
        runner = false;
      }
  }, {
    timezone: TIMEZONE
  });
};

module.exports = scheduleDailyReport;
