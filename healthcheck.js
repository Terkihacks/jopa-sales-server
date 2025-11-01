const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

if (require.main === module) {
  const PORT = process.env.HEALTH_PORT || 4001;
  app.listen(PORT, () => {
    console.log(`Health check server running on port ${PORT}`);
  });
}

module.exports = app;
