const express = require('express');
const prisma = require('../prismaClient');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Create a sale
router.post('/create-sale', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { productId, quantity, userId } = req.body;

    // Ensure numeric inputs
    const parsedProductId = parseInt(productId);
    const parsedQuantity = parseInt(quantity);
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedProductId) || isNaN(parsedQuantity) || isNaN(parsedUserId)) {
      return res.status(400).json({ error: 'Invalid input types' });
    }

    // --- Check if product exists ---
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // --- Calculate total & profit ---
    const total = product.price * parsedQuantity;
    const profit = total * 0.2; 

    // --- Create sale ---
    const sale = await prisma.sale.create({
      data: {
        productId: parsedProductId,
        quantity: parsedQuantity,
        total,
        profit,
        userId: parsedUserId,
      },
    });

    res.status(201).json({
      message: 'Sale recorded successfully',
      sale,
    });

  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

// Get all sales
router.get('/get-sales', async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' } 
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

// Get a sale by product ID
router.get('/get-sale-by-product/:productId', async (req, res) => {
   try {
    const sales = await prisma.sale.findMany({
      where: { productId: parseInt(req.params.productId) },
      include: { product: true }
    });
    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
})

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