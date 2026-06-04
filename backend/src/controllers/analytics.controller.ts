import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authenticateToken';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [totalProjects, activeResources, assignments, resources] = await Promise.all([
      prisma.project.count(),
      prisma.resource.count({ where: { isActive: true } }),
      prisma.assignment.findMany({
        include: {
          resource: { select: { dailyCapacityHours: true } },
        },
      }),
      prisma.resource.findMany({ where: { isActive: true } }),
    ]);

    // Calculate hours this week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let hoursThisWeek = 0;
    let totalCapacity = 0;
    let totalAllocated = 0;

    // For each day of the work week
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dayNum = d.getDay();
      if (dayNum === 0 || dayNum === 6) continue; // Skip weekends

      resources.forEach((resource) => {
        totalCapacity += resource.dailyCapacityHours;

        let dayAlloc = 0;
        assignments.forEach((a) => {
          if (a.resourceId === resource.id) {
            const aStart = new Date(a.startDate);
            aStart.setHours(0, 0, 0, 0);
            const aEnd = new Date(a.endDate);
            aEnd.setHours(23, 59, 59, 999);
            const currentDay = new Date(d);
            currentDay.setHours(12, 0, 0, 0);
            if (currentDay >= aStart && currentDay <= aEnd) {
              dayAlloc += a.dailyHours;
            }
          }
        });
        hoursThisWeek += dayAlloc;
        totalAllocated += dayAlloc;
      });
    }

    const utilization = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

    // Top 3 busiest resources
    const resourceStats = resources.map((resource) => {
      let totalAlloc = 0;
      let totalCap = 0;

      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dayNum = d.getDay();
        if (dayNum === 0 || dayNum === 6) continue;
        totalCap += resource.dailyCapacityHours;

        assignments.forEach((a) => {
          if (a.resourceId === resource.id) {
            const aStart = new Date(a.startDate);
            aStart.setHours(0, 0, 0, 0);
            const aEnd = new Date(a.endDate);
            aEnd.setHours(23, 59, 59, 999);
            const currentDay = new Date(d);
            currentDay.setHours(12, 0, 0, 0);
            if (currentDay >= aStart && currentDay <= aEnd) {
              totalAlloc += a.dailyHours;
            }
          }
        });
      }

      return {
        ...resource,
        totalAllocated: totalAlloc,
        totalCapacity: totalCap,
        utilizationPercent: totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0,
      };
    });

    const topBusy = resourceStats
      .sort((a, b) => b.utilizationPercent - a.utilizationPercent)
      .slice(0, 3);

    // Upcoming availability (resources becoming free within 7 days)
    const upcomingAvailability = [];
    for (const resource of resources) {
      const resAssignments = assignments.filter((a) => a.resourceId === resource.id);
      if (resAssignments.length === 0) continue;

      const latestEnd = resAssignments.reduce((latest, a) => {
        const endDate = new Date(a.endDate);
        return endDate > latest ? endDate : latest;
      }, new Date(0));

      const daysUntilFree = Math.ceil((latestEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilFree >= 0 && daysUntilFree <= 7) {
        upcomingAvailability.push({
          ...resource,
          freeDate: latestEnd.toISOString().split('T')[0],
          daysUntilFree,
        });
      }
    }
    upcomingAvailability.sort((a, b) => a.daysUntilFree - b.daysUntilFree);

    // Recent projects
    const recentProjects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        assignments: {
          include: {
            resource: { select: { id: true, name: true, colorTag: true } },
          },
        },
      },
    });

    res.json({
      stats: {
        totalProjects,
        activeResources,
        hoursThisWeek,
        utilization,
      },
      topBusy,
      upcomingAvailability,
      recentProjects,
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUtilization(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { from, to, resourceId } = req.query;

    const startDate = from ? new Date(from as string) : new Date();
    const endDate = to ? new Date(to as string) : new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000);

    const whereResource: any = { isActive: true };
    if (resourceId) whereResource.id = resourceId as string;

    const [resources, assignments] = await Promise.all([
      prisma.resource.findMany({ where: whereResource }),
      prisma.assignment.findMany({
        where: {
          ...(resourceId ? { resourceId: resourceId as string } : {}),
          endDate: { gte: startDate },
          startDate: { lte: endDate },
        },
      }),
    ]);

    // Build daily utilization per resource
    const result: any[] = [];
    for (const resource of resources) {
      const dailyData: any[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayNum = d.getDay();
        const isWorking = dayNum !== 0 && dayNum !== 6;
        let allocated = 0;

        if (isWorking) {
          assignments.forEach((a) => {
            if (a.resourceId !== resource.id) return;
            const aStart = new Date(a.startDate);
            aStart.setHours(0, 0, 0, 0);
            const aEnd = new Date(a.endDate);
            aEnd.setHours(23, 59, 59, 999);
            const currentDay = new Date(d);
            currentDay.setHours(12, 0, 0, 0);
            if (currentDay >= aStart && currentDay <= aEnd) {
              allocated += a.dailyHours;
            }
          });
        }

        dailyData.push({
          date: new Date(d).toISOString().split('T')[0],
          hoursAllocated: allocated,
          capacityHours: isWorking ? resource.dailyCapacityHours : 0,
          utilizationPercent: isWorking && resource.dailyCapacityHours > 0
            ? Math.round((allocated / resource.dailyCapacityHours) * 100) : 0,
          isNonWorking: !isWorking,
        });
      }

      result.push({
        resource,
        dailyData,
      });
    }

    res.json({ utilization: result });
  } catch (error) {
    logger.error('Utilization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCompanyTimeline(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { from, to } = req.query;

    const startDate = from ? new Date(from as string) : new Date();
    const endDate = to ? new Date(to as string) : new Date(startDate.getTime() + 56 * 24 * 60 * 60 * 1000);

    const [resources, assignments, projects] = await Promise.all([
      prisma.resource.findMany({ where: { isActive: true } }),
      prisma.assignment.findMany({
        where: {
          endDate: { gte: startDate },
          startDate: { lte: endDate },
        },
        include: {
          project: { select: { id: true, name: true, colorTag: true } },
        },
      }),
      prisma.project.findMany(),
    ]);

    // Build weekly aggregation
    const weeks: any[] = [];
    const ws = new Date(startDate);
    // Align to Monday
    while (ws.getDay() !== 1) ws.setDate(ws.getDate() - 1);

    while (ws <= endDate) {
      const weekEnd = new Date(ws);
      weekEnd.setDate(ws.getDate() + 6);

      let totalCapacity = 0;
      let totalAllocated = 0;
      const projectBreakdown: Record<string, any> = {};
      const resourceUtilization: any[] = [];

      for (const resource of resources) {
        let resCap = 0;
        let resAlloc = 0;

        for (let d = new Date(ws); d <= weekEnd && d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayNum = d.getDay();
          if (dayNum === 0 || dayNum === 6) continue;

          resCap += resource.dailyCapacityHours;
          totalCapacity += resource.dailyCapacityHours;

          assignments.forEach((a) => {
            if (a.resourceId !== resource.id) return;
            const aStart = new Date(a.startDate);
            aStart.setHours(0, 0, 0, 0);
            const aEnd = new Date(a.endDate);
            aEnd.setHours(23, 59, 59, 999);
            const currentDay = new Date(d);
            currentDay.setHours(12, 0, 0, 0);
            if (currentDay >= aStart && currentDay <= aEnd) {
              resAlloc += a.dailyHours;
              totalAllocated += a.dailyHours;

              const projId = a.projectId;
              if (!projectBreakdown[projId]) {
                projectBreakdown[projId] = {
                  projectId: projId,
                  projectName: a.project?.name || 'Unknown',
                  projectColor: a.project?.colorTag || '#666',
                  totalHours: 0,
                };
              }
              projectBreakdown[projId].totalHours += a.dailyHours;
            }
          });
        }

        resourceUtilization.push({
          resourceId: resource.id,
          resourceName: resource.name,
          resourceColor: resource.colorTag,
          totalCapacity: resCap,
          totalAllocated: resAlloc,
          utilizationPercent: resCap > 0 ? Math.round((resAlloc / resCap) * 100) : 0,
        });
      }

      weeks.push({
        weekStart: ws.toISOString().split('T')[0],
        weekLabel: `Week of ${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        totalCapacity,
        totalAllocated,
        utilizationPercent: totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0,
        projectBreakdown: Object.values(projectBreakdown),
        resourceUtilization,
      });

      ws.setDate(ws.getDate() + 7);
    }

    res.json({ weeks });
  } catch (error) {
    logger.error('Company timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { userId, action, from, to } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (action) where.action = action as string;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getForecast(req: AuthRequest, res: Response): Promise<void> {
  try {
    // A simplified placeholder for a demand vs capacity forecasting engine
    const resources = await prisma.resource.findMany({ where: { isActive: true } });
    const totalDailyCapacity = resources.reduce((sum, r) => sum + r.dailyCapacityHours, 0);

    const forecast = [];
    let date = new Date();
    date.setHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const totalCapacity = isWeekend ? 0 : totalDailyCapacity;
      
      // Random demand generation for demonstration
      const baseDemand = totalCapacity * 0.7;
      const volatility = totalCapacity * 0.4;
      const randomDemand = Math.max(0, baseDemand + (Math.random() * volatility - volatility/2));
      
      forecast.push({
        date: new Date(date).toISOString().split('T')[0],
        totalCapacity,
        totalDemand: isWeekend ? 0 : Math.round(randomDemand),
      });

      date.setDate(date.getDate() + 1);
    }

    res.json({ forecast });
  } catch (error) {
    logger.error('Forecast error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
