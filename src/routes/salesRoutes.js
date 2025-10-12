const express = require('express');
const prisma = require('../prismaClient');
const router = express.Router();

// Create a sale
router.post('/create-sale', async (req, res) => {
  const { productId, quantity, profit, userId } = req.body;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const total = product.price * quantity;

    const sale = await prisma.sale.create({
      data: { productId, quantity, total, profit, userId },
    });
    res.status(201).json(sale);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

// Get all sales
router.get('/sales', async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: { product: true, user: true },
    });
    res.status(200).json(sales);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Update a sale
router.put('/update-sale/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, profit } = req.body;

  try {
    const existingSale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: { product: true },
    });
    if (!existingSale) return res.status(404).json({ error: 'Sale not found' });

    const updatedTotal = existingSale.product.price * quantity;

    const updatedSale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: { quantity, total: updatedTotal, profit },
    });

    res.status(200).json(updatedSale);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
});

// Delete a sale
router.delete('/delete-sale/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.sale.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

module.exports = router;