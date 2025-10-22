const express = require('express');
const prisma = require('../prismaClient');
const router = express.Router();

// Create a product
router.post('/create-product', async (req, res) => {
  const { name, code, category, price } = req.body;
  try {
    const product = await prisma.product.create({
    data: { name, code, category, price },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});


// Get all products with sales
router.get('/get-products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { sales: true },
    });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

//Get product by ID
router.get('/get-product/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { sales: true }
    });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a product
router.put('/update-product/:id', async (req, res) => {
  const { id } = req.params;
  const { name, code, category, price } = req.body;

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { name, code, category, price },
    });
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
router.delete('/delete-product/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

/*
http://localhost:8000/v1/products/create-product

*/

module.exports = router;