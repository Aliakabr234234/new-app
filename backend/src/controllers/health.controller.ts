import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const getHealthScores = async (req: Request, res: Response) => {
  try {
    const scores = await prisma.workloadHealthScore.findMany({
      include: {
        resource: true,
      },
      orderBy: { calculatedAt: 'desc' },
      take: 100, // For demonstration
    });
    res.json(scores);
  } catch (error) {
    logger.error('Error fetching health scores', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getResourceHealthScore = async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    const score = await prisma.workloadHealthScore.findFirst({
      where: { resourceId },
      orderBy: { calculatedAt: 'desc' },
    });
    
    if (!score) return res.status(404).json({ error: 'Health score not found for resource' });
    
    res.json(score);
  } catch (error) {
    logger.error('Error fetching resource health score', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const computeHealthScores = async (req: Request, res: Response) => {
  try {
    // In a real application, this would be a complex cron job calculating burnout factors.
    // Here we'll simulate a simple generation based on utilization from existing assignments.
    const resources = await prisma.resource.findMany({
      include: { assignments: true },
    });
    
    const newScores = [];
    
    for (const r of resources) {
      // Simulate score based on number of assignments
      const baseScore = Math.max(30, 100 - (r.assignments.length * 10));
      const score = await prisma.workloadHealthScore.create({
        data: {
          resourceId: r.id,
          overallScore: baseScore,
          utilizationBalance: 80,
          scheduleStability: 80,
          burnoutRisk: r.assignments.length > 2 ? 80 : 30,
          leaveBalance: 15,
          actualAlignment: 75,
        }
      });
      newScores.push(score);
    }
    
    res.status(201).json({ message: 'Health scores computed successfully', count: newScores.length });
  } catch (error) {
    logger.error('Error computing health scores', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
