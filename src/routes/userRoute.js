const express = require('express');
const prisma = require('../prismaClient');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
// Create a user
router.post('/create-user', async (req, res) => {
    try{
        const { name, email, password, role } = req.body;

        const user = await prisma.user.create({
            data: { name, email, password, role },
        });
        res.status(201).json({ message: 'User created successfully', user });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Failed to create user', error });  
    }
}
);
// Get all users
router.get('/get-users', authenticateToken,authorizeRoles('ADMIN'),async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});


module.exports = router;