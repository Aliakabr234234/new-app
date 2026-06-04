import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const getAllRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.resourceRequest.findMany({
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    logger.error('Error fetching resource requests', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await prisma.resourceRequest.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (error) {
    logger.error('Error fetching resource request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createRequest = async (req: Request, res: Response) => {
  try {
    const { projectId, resourceId, requestedById, startDate, endDate, dailyHours, justification } = req.body;
    const request = await prisma.resourceRequest.create({
      data: {
        projectId,
        resourceId,
        requestedById,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        dailyHours,
        justification,
        status: 'PENDING',
      },
      include: { project: true },
    });
    res.status(201).json(request);
  } catch (error) {
    logger.error('Error creating resource request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewedById, reviewNote } = req.body;
    const request = await prisma.resourceRequest.update({
      where: { id },
      data: { status, reviewedById, reviewNote },
      include: { project: true },
    });
    res.json(request);
  } catch (error) {
    logger.error('Error updating resource request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
