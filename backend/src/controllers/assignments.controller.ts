import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authenticateToken';
import { createAuditLog } from '../utils/auditLog';
import logger from '../utils/logger';
import { eachDayOfInterval, isSameDay } from 'date-fns';

const prisma = new PrismaClient();

export async function listAssignments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { resourceId, projectId, from, to } = req.query;

    const where: any = {};
    if (resourceId) where.resourceId = resourceId as string;
    if (projectId) where.projectId = projectId as string;
    if (from || to) {
      where.AND = [];
      if (from) where.AND.push({ endDate: { gte: new Date(from as string) } });
      if (to) where.AND.push({ startDate: { lte: new Date(to as string) } });
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        resource: { select: { id: true, name: true, role: true, colorTag: true, dailyCapacityHours: true } },
        project: { select: { id: true, name: true, colorTag: true, status: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    res.json({ assignments });
  } catch (error) {
    logger.error('List assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createAssignment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { projectId, resourceId, startDate, endDate, dailyHours } = req.body;

    // Verify project and resource exist
    const [project, resource] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.resource.findUnique({ where: { id: resourceId } }),
    ]);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    // Conflict Engine Check
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const existingAssignments = await prisma.assignment.findMany({
      where: {
        resourceId,
        AND: [
          { endDate: { gte: start } },
          { startDate: { lte: end } }
        ]
      }
    });

    // Simple conflict check: total hours on overlapping days
    if (existingAssignments.length > 0) {
      const days = eachDayOfInterval({ start, end });
      let maxDaily = 0;
      
      for (const day of days) {
        if (day.getDay() === 0 || day.getDay() === 6) continue; // Skip weekends
        
        let dayHours = dailyHours;
        for (const a of existingAssignments) {
          if (day >= a.startDate && day <= a.endDate) {
            dayHours += a.dailyHours;
          }
        }
        
        if (dayHours > resource.dailyCapacityHours) {
          maxDaily = Math.max(maxDaily, dayHours);
        }
      }
      
      if (maxDaily > 0) {
        res.status(409).json({ 
          error: 'Resource overallocated', 
          conflictDetails: { maxDaily, capacity: resource.dailyCapacityHours, resourceName: resource.name }
        });
        return;
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        projectId,
        resourceId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        dailyHours,
      },
      include: {
        resource: { select: { id: true, name: true, role: true, colorTag: true } },
        project: { select: { id: true, name: true, colorTag: true } },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_ASSIGNMENT',
      entity: 'Assignment',
      entityId: assignment.id,
      details: { projectId, resourceId, dailyHours },
      ip: req.ip,
    });

    res.status(201).json({ assignment });
  } catch (error) {
    logger.error('Create assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateAssignment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { startDate, endDate, dailyHours } = req.body;

    const updateData: any = {};
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (dailyHours !== undefined) updateData.dailyHours = dailyHours;

    const assignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
      include: {
        resource: { select: { id: true, name: true, role: true, colorTag: true } },
        project: { select: { id: true, name: true, colorTag: true } },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_ASSIGNMENT',
      entity: 'Assignment',
      entityId: id,
      details: updateData,
      ip: req.ip,
    });

    res.json({ assignment });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    logger.error('Update assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAssignment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.assignment.delete({ where: { id } });

    await createAuditLog({
      userId: req.user!.id,
      action: 'DELETE_ASSIGNMENT',
      entity: 'Assignment',
      entityId: id,
      ip: req.ip,
    });

    res.json({ message: 'Assignment deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    logger.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
