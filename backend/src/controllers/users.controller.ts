import { Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/authenticateToken';
import { sendWelcomeEmail, sendTempPasswordEmail } from '../services/email.service';
import { createAuditLog } from '../utils/auditLog';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    logger.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: userSelect,
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, email, role } = req.body;

    // ADMIN can only create USER role
    if (req.user?.role === 'ADMIN' && role !== 'USER') {
      res.status(403).json({ error: 'Admins can only create USER-role accounts' });
      return;
    }

    // Check for existing email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
      },
      select: userSelect,
    });

    // Send welcome email with temp password
    await sendWelcomeEmail(email, name, tempPassword);

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      details: { name, email, role },
      ip: req.ip,
    });

    res.status(201).json({ user, tempPassword });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    // Prevent self-demotion or self-deactivation for SUPER_ADMIN
    if (id === req.user?.id) {
      if (role && role !== req.user.role) {
        res.status(400).json({ error: 'Cannot change your own role' });
        return;
      }
      if (isActive === false) {
        res.status(400).json({ error: 'Cannot deactivate your own account' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      details: updateData,
      ip: req.ip,
    });

    res.json({ user });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetUserPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await sendTempPasswordEmail(user.email, user.name, tempPassword);

    await createAuditLog({
      userId: req.user!.id,
      action: 'RESET_USER_PASSWORD',
      entity: 'User',
      entityId: id,
      ip: req.ip,
    });

    res.json({ tempPassword, message: 'Password reset and email sent' });
  } catch (error) {
    logger.error('Reset user password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
