import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any>;
  ip?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details || undefined,
        ip: params.ip || undefined,
      },
    });
  } catch (error) {
    // Don't let audit log failures break the main flow
    console.error('Failed to create audit log:', error);
  }
}
