import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authenticateToken';
import { createAuditLog } from '../utils/auditLog';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export async function listResources(req: AuthRequest, res: Response): Promise<void> {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          include: {
            project: { select: { id: true, name: true, colorTag: true, status: true } },
          },
        },
      },
    });

    res.json({ resources });
  } catch (error) {
    logger.error('List resources error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createResource(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, role, dailyCapacityHours, colorTag } = req.body;

    const resource = await prisma.resource.create({
      data: {
        name,
        role,
        dailyCapacityHours: dailyCapacityHours || 8,
        colorTag,
        createdById: req.user!.id,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_RESOURCE',
      entity: 'Resource',
      entityId: resource.id,
      details: { name, role },
      ip: req.ip,
    });

    res.status(201).json({ resource });
  } catch (error) {
    logger.error('Create resource error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateResource(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, role, dailyCapacityHours, colorTag, isActive } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (dailyCapacityHours !== undefined) updateData.dailyCapacityHours = dailyCapacityHours;
    if (colorTag !== undefined) updateData.colorTag = colorTag;
    if (isActive !== undefined) updateData.isActive = isActive;

    const resource = await prisma.resource.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_RESOURCE',
      entity: 'Resource',
      entityId: id,
      details: updateData,
      ip: req.ip,
    });

    res.json({ resource });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    logger.error('Update resource error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteResource(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.resource.delete({ where: { id } });

    await createAuditLog({
      userId: req.user!.id,
      action: 'DELETE_RESOURCE',
      entity: 'Resource',
      entityId: id,
      ip: req.ip,
    });

    res.json({ message: 'Resource deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    logger.error('Delete resource error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
