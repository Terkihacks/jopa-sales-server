import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = express.Router();
const prisma = new PrismaClient();

/* ===========================================
   CREATE — Register a new Record Keeper
   Endpoint: POST /record-keepers
   Access: Admin only
=========================================== */
router.post('/regiser-record-keeper', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingRecordKeeper = await prisma.recordKeeper.findUnique({
      where: { email },
    });

    if (existingRecordKeeper) {
      return res.status(400).json({ message: 'Record Keeper already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const recordKeeper = await prisma.recordKeeper.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'RECORD_KEEPER',
      },
    });

    res.status(201).json({
      message: 'Record Keeper created successfully',
      recordKeeper: {
        id: recordKeeper.id,
        name: recordKeeper.name,
        email: recordKeeper.email,
        role: recordKeeper.role,
        createdAt: recordKeeper.createdAt,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

/* ===========================================
    CREATE — Create an Admin (for initial setup)
  ===========================================
*/ 
router.post('/create-admin', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newAdmin = await prisma.recordKeeper.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating admin' });
  }
});


/* ===========================================
   ADMIN LOGIN
   Endpoint: POST /admin/login
=========================================== */
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Check if user exists
    const admin = await prisma.recordKeeper.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // 2️⃣ Ensure role is ADMIN
    if (admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Not an admin.' });
    }

    // 3️⃣ Verify password
    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      { adminId: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5️⃣ Respond with token and profile info
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
   Access: Public
=========================================== */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const recordKeeper = await prisma.recordKeeper.findUnique({ where: { email } });

    if (!recordKeeper) return res.status(404).json({ message: 'Record Keeper not found' });

    const validPassword = bcrypt.compareSync(password, recordKeeper.password);
    if (!validPassword)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { recordKeeperId: recordKeeper.id, role: recordKeeper.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      recordKeeper: {
        id: recordKeeper.id,
        name: recordKeeper.name,
        email: recordKeeper.email,
        role: recordKeeper.role,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
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

export default router;
