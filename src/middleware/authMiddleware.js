const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verify JWT and attach user info to req.user
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) return res.status(401).json({ message: 'Access token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user; // attach user to request
    next();
  } catch (err) {
    console.error(err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Restrict access by role
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: 'Not authenticated' });

    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ message: 'Access denied' });

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };