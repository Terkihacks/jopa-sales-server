const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

/* ===========================================
   CREATE — Register a new Record Keeper
   Endpoint: POST /record-keepers
   Access: Admin only
=========================================== */
// router.post('/regiser-record-keeper', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
//   const { name, email, password, role } = req.body;

//   try {
//     const existingRecordKeeper = await prisma.recordKeeper.findUnique({
//       where: { email },
//     });

//     if (existingRecordKeeper) {
//       return res.status(400).json({ message: 'Record Keeper already exists' });
//     }

//     const hashedPassword = bcrypt.hashSync(password, 10);

//     const recordKeeper = await prisma.recordKeeper.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         role: role || 'RECORD_KEEPER',
//       },
//     });

//     res.status(201).json({
//       message: 'Record Keeper created successfully',
//       recordKeeper: {
//         id: recordKeeper.id,
//         name: recordKeeper.name,
//         email: recordKeeper.email,
//         role: recordKeeper.role,
//         createdAt: recordKeeper.createdAt,
//       },
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.sendStatus(503);
//   }
// });

/* ===========================================
    CREATE — Create an Admin (for initial setup)
  ===========================================
*/ 
// router.post('/create-admin', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
//   const { name, email, password } = req.body;

//   try {
//     const hashedPassword = bcrypt.hashSync(password, 10);

//     const newAdmin = await prisma.recordKeeper.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         role: 'ADMIN',
//       },
//     });

//     res.status(201).json({
//       message: 'Admin created successfully',
//       admin: {
//         id: newAdmin.id,
//         name: newAdmin.name,
//         email: newAdmin.email,
//         role: newAdmin.role,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Error creating admin' });
//   }
// });

/* ===========================================
    CREATE — Register Admin or Record Keeper
   =========================================== */
router.post('/register-user',authenticateToken,authorizeRoles('ADMIN'),
  async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      // Ensure role is valid
      const validRoles = ['ADMIN', 'RECORD_KEEPER'];
      const userRole = role && validRoles.includes(role.toUpperCase())
        ? role.toUpperCase()
        : 'RECORD_KEEPER'; 

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create user (admin or record keeper)
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole,
        },
      });

      res.status(201).json({
        message: `${userRole === 'ADMIN' ? 'Admin' : 'Record Keeper'} created successfully`,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    } catch (err) {
      console.error('Error creating user:', err);
      res.status(500).json({ message: 'Error creating user' });
    }
  }
);

/* ===========================================
   ADMIN LOGIN
   Endpoint: POST /admin/login
=========================================== */
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Ensure role is ADMIN
    if (admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Not an admin.' });
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    //Generate JWT
    const token = jwt.sign(
      { adminId: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    //Respond with token and profile info
    res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Admin Login Error:', err.message);
    res.status(503).json({ message: 'Internal server error' });
  }
});


/* ===========================================
   LOGIN — Login a Record Keeper
   Endpoint: POST /record-keepers/login
=========================================== */
router.post('/record-keepers/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if record keeper exists
    const recordK = await prisma.user.findUnique({
      where: { email },
    });

    if (!recordK) {
      return res.status(404).json({ message: 'Record Keeper not found' });
    }

    // Ensure role is RECORD_KEEPER
    if (recordK.role !== 'RECORD_KEEPER') {
      return res.status(403).json({ message: 'Access denied. Not a record keeper.' });
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, recordK.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    //Generate JWT
    const token = jwt.sign(
      { id: recordK.id, role: recordK.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log(token)
    //Respond with token and profile info
    res.status(200).json({
      message: 'Record Keeper login successful',
      token,
      recordK: {
        id: recordK.id,
        name: recordK.name,
        email: recordK.email,
        role: recordK.role,
      },
    });
  } catch (err) {
    console.error('Record Keeper Login Error:', err.message);
    res.status(503).json({ message: 'Internal server error' });
  }
});


/* ===========================================
   READ — Get all Record Keepers
   Endpoint: GET /record-keepers
   Access: Admin only
=========================================== */
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const recordKeepers = await prisma.recordKeeper.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json(recordKeepers);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

/* ===========================================
   READ — Get single Record Keeper by ID
   Endpoint: GET /record-keepers/:id
   Access: Admin or self
=========================================== */
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Only admin or self
    if (req.user.role !== 'ADMIN' && req.user.id !== Number(id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const recordKeeper = await prisma.recordKeeper.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!recordKeeper) {
      return res.status(404).json({ message: 'Record Keeper not found' });
    }

    res.status(200).json(recordKeeper);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

/* ===========================================
   UPDATE — Update Record Keeper by ID
   Endpoint: PUT /record-keepers/:id
   Access: Admin or self
=========================================== */
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    const existingRecordKeeper = await prisma.recordKeeper.findUnique({
      where: { id: Number(id) },
    });

    if (!existingRecordKeeper) {
      return res.status(404).json({ message: 'Record Keeper not found' });
    }

    // Only admin or self
    if (req.user.role !== 'ADMIN' && req.user.id !== Number(id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedData = {
      name: name || existingRecordKeeper.name,
      email: email || existingRecordKeeper.email,
      role: role || existingRecordKeeper.role,
    };

    if (password) {
      updatedData.password = bcrypt.hashSync(password, 10);
    }

    const updatedRecordKeeper = await prisma.recordKeeper.update({
      where: { id: Number(id) },
      data: updatedData,
    });

    res.status(200).json({
      message: 'Record Keeper updated successfully',
      recordKeeper: {
        id: updatedRecordKeeper.id,
        name: updatedRecordKeeper.name,
        email: updatedRecordKeeper.email,
        role: updatedRecordKeeper.role,
        createdAt: updatedRecordKeeper.createdAt,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

/* ===========================================
   DELETE — Delete Record Keeper by ID
   Endpoint: DELETE /record-keepers/:id
   Access: Admin only
=========================================== */
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const existingRecordKeeper = await prisma.recordKeeper.findUnique({
      where: { id: Number(id) },
    });

    if (!existingRecordKeeper) {
      return res.status(404).json({ message: 'Record Keeper not found' });
    }

    await prisma.recordKeeper.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: 'Record Keeper deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

module.exports = router;
