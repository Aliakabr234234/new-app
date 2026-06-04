import { Response } from 'express';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/authenticateToken';
import { createAuditLog } from '../utils/auditLog';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export async function listProjects(req: AuthRequest, res: Response): Promise<void> {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          include: {
            resource: { select: { id: true, name: true, role: true, colorTag: true } },
          },
        },
      },
    });

    res.json({ projects });
  } catch (error) {
    logger.error('List projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        assignments: {
          include: {
            resource: { select: { id: true, name: true, role: true, colorTag: true, dailyCapacityHours: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ project });
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, startDate, endDate, colorTag, status } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        colorTag,
        status: (status as ProjectStatus) || ProjectStatus.PLANNING,
        createdById: req.user!.id,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_PROJECT',
      entity: 'Project',
      entityId: project.id,
      details: { name, status },
      ip: req.ip,
    });

    res.status(201).json({ project });
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, colorTag, status } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (colorTag !== undefined) updateData.colorTag = colorTag;
    if (status !== undefined) updateData.status = status;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_PROJECT',
      entity: 'Project',
      entityId: id,
      details: updateData,
      ip: req.ip,
    });

    res.json({ project });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    logger.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.project.delete({ where: { id } });

    await createAuditLog({
      userId: req.user!.id,
      action: 'DELETE_PROJECT',
      entity: 'Project',
      entityId: id,
      ip: req.ip,
    });

    res.json({ message: 'Project deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    logger.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
