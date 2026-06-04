import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.projectTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(templates);
  } catch (error) {
    logger.error('Error fetching templates', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, durationDays, roles, requiredSkills } = req.body;
    const template = await prisma.projectTemplate.create({
      data: {
        name,
        description,
        durationDays,
        createdById: req.user!.id,
        roles: {
          create: roles?.map((r: any) => ({
            roleTitle: r.roleTitle || r.role || 'Role',
            dailyHours: r.dailyHours || 8,
            startOffsetDays: r.startOffsetDays || 0,
            durationDays: r.durationDays || durationDays
          })) || []
        }
      },
      include: { roles: true }
    });
    res.status(201).json(template);
  } catch (error) {
    logger.error('Error creating template', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const applyTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, projectName } = req.body;
    
    const template = await prisma.projectTemplate.findUnique({ 
      where: { id },
      include: { roles: true }
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + template.durationDays);

    const project = await prisma.project.create({
      data: {
        name: projectName || `${template.name} Project`,
        description: template.description,
        startDate: new Date(startDate),
        endDate,
        status: 'PLANNING',
        budget: 0,
        colorTag: template.colorTag || '#6366F1',
        createdById: template.createdById,
      },
    });
    
    if (template.roles && Array.isArray(template.roles)) {
      for (const role of (template.roles as any[])) {
        await prisma.resourceRequest.create({
          data: {
            projectId: project.id,
            resourceId: '', // Requires an existing resourceId or handled later if optional
            requestedById: template.createdById,
            startDate: new Date(startDate),
            endDate,
            dailyHours: role.dailyHours,
            status: 'PENDING',
          }
        });
      }
    }

    res.status(201).json(project);
  } catch (error) {
    logger.error('Error applying template', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
