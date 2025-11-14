module.exports = function generateReportHTML(report) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${report.title}</title>
    <style>
      body {
        font-family: 'Inter', Arial, sans-serif;
        color: #1f2937;
        background: #f9fafb;
        margin: 0;
        padding: 0px;
      }

      .container {
        max-width: 800px;
        margin: auto;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        overflow: hidden;
      }

      .header {
        text-align: center;
        background: linear-gradient(to right, #2563eb, #9333ea);
        color: white;
        padding: 30px 20px;
      }

      .header h1 {
        margin: 0;
        font-size: 24px;
      }

      .header p {
        font-size: 14px;
        opacity: 0.9;
      }

      .stats {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        padding: 20px;
        gap: 15px;
      }

      .card {
        flex: 1 1 30%;
        background: #f8fafc;
        padding: 15px;
        border-radius: 10px;
        text-align: center;
        border: 1px solid #e5e7eb;
      }

      .card h4 {
        margin: 0;
        color: #374151;
        font-size: 14px;
      }

      .card p {
        font-size: 22px;
        font-weight: bold;
        margin: 6px 0 0;
      }

      .sales-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }

      .sales-table th, .sales-table td {
        padding: 10px;
        border: 1px solid #e5e7eb;
        font-size: 13px;
      }

      .sales-table th {
        background: #f3f4f6;
        text-align: left;
      }

      .performance {
        background: linear-gradient(to right, #eff6ff, #ede9fe, #ecfdf5);
        border-top: 1px solid #e5e7eb;
        padding: 20px;
      }

      .performance h3 {
        color: #1e3a8a;
      }

      .footer {
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        padding: 15px 10px;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Jopa Daily Sales Performance Report</h1>
        <p>${new Date(report.startDate).toLocaleDateString('en-KE')}</p>
      </div>

      <div class="stats">
      <div class="card" style="background:#f5f3ff;">
          <h4>Total Profit</h4>
          <p>KES ${report.totalProfit.toLocaleString()}</p>
        </div>
        <div class="card" style="background:#eff6ff;">
          <h4>Total Sales</h4>
          <p>${report.totalSales || 0}</p>
        </div>
        
      </div>

     <!-- Summary Cards -->
    <div class="stats">
      <div class="card" style="background:#eff6ff;">
        <h4>Report Date</h4>
        <p>${report.summary?.match(/Report Date:\s*(.*)/)?.[1] || 'N/A'}</p>
      </div>
      <div class="card" style="background:#ecfdf5;">
        <h4>Total Sales (Today)</h4>
        <p>${report.summary?.match(/Total Sales \(Today\):\s*(.*)/)?.[1] || 0}</p>
      </div>
      <div class="card" style="background:#f5f3ff;">
        <h4>Total Profit (Today)</h4>
        <p>KES ${report.summary?.match(/Total Profit \(Today\):\s*(.*)/)?.[1] || 0}</p>
      </div>
      <div class="card" style="background:#fef3c7;">
        <h4>Average Sale Value</h4>
        <p>${report.summary?.match(/Average Sale Value.*?:\s*(.*)/)?.[1] || 'N/A'}</p>
      </div>
      <div class="card" style="background:#ede9fe;">
        <h4>Top Product</h4>
        <p>${report.summary?.match(/Top Product.*?:\s*(.*)/)?.[1] || 'N/A'}</p>
      </div>
      <div class="card" style="background:#fee2e2;">
        <h4>Top Salesperson</h4>
        <p>${report.summary?.match(/Top Salesperson.*?:\s*(.*)/)?.[1] || 'N/A'}</p>
      </div>
      <div class="card" style="background:#dcfce7;">
        <h4>Low Stock Items</h4>
        <p>${report.summary?.match(/Low Stock Items.*?:\s*(.*)/)?.[1] || 'N/A'}</p>
      </div>
    </div>


      <table class="sales-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Profit</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${(report.sales || []).map(s => `
            <tr>
              <td>${s.productName}</td>
              <td>${s.productCategory}</td>
              <td>${s.quantity}</td>
              <td>KES ${s.total.toLocaleString()}</td>
              <td style="color:#047857;">KES ${s.profit.toLocaleString()}</td>
              <td>${new Date(s.saleDate).toLocaleDateString('en-KE')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="performance">
        <h3>Performance Summary</h3>
        <p>
          Great job! Today’s total sales reached <strong>${report.totalSales}</strong>,
          earning <strong>KES ${report.totalProfit.toLocaleString()}</strong> in profit.
          Keep up the great work 🚀.
        </p>
      </div>

      <div class="footer">
        Generated automatically by <strong>JOPA Sales System</strong> —
        ${new Date().toLocaleString('en-KE')}
      </div>
    </div>
  </body>
  </html>
  `;
};

{/* <div class="card" style="background:#ecfdf5;">
          <h4>Total Revenue</h4>
          <p>KES ${(report.totalSales).toLocaleString()}</p>
        </div> */}