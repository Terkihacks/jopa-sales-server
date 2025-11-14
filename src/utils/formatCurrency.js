function formatCurrency(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(amount || 0);
}

module.exports = { formatCurrency };