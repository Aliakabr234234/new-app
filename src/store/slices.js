import { format, startOfDay, eachDayOfInterval, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';

const genId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export const createSkillsSlice = (set, get) => ({
  skills: [],
  resourceSkills: [],
  projectSkills: [],

  addSkill: (skill) => set((s) => ({ skills: [...s.skills, { ...skill, id: genId(), createdAt: new Date().toISOString() }] })),
  deleteSkill: (id) => set((s) => ({
    skills: s.skills.filter(sk => sk.id !== id),
    resourceSkills: s.resourceSkills.filter(rs => rs.skillId !== id),
    projectSkills: s.projectSkills.filter(ps => ps.skillId !== id),
  })),
  addResourceSkill: (rs) => set((s) => ({ resourceSkills: [...s.resourceSkills, { ...rs, id: genId() }] })),
  updateResourceSkill: (id, u) => set((s) => ({ resourceSkills: s.resourceSkills.map(rs => rs.id === id ? { ...rs, ...u } : rs) })),
  deleteResourceSkill: (id) => set((s) => ({ resourceSkills: s.resourceSkills.filter(rs => rs.id !== id) })),
  addProjectSkill: (ps) => set((s) => ({ projectSkills: [...s.projectSkills, { ...ps, id: genId() }] })),
  deleteProjectSkill: (id) => set((s) => ({ projectSkills: s.projectSkills.filter(ps => ps.id !== id) })),

  getResourceSkills: (resourceId) => {
    const s = get();
    return s.resourceSkills.filter(rs => rs.resourceId === resourceId).map(rs => ({
      ...rs, skill: s.skills.find(sk => sk.id === rs.skillId),
    }));
  },
  getProjectSkills: (projectId) => {
    const s = get();
    return s.projectSkills.filter(ps => ps.projectId === projectId).map(ps => ({
      ...ps, skill: s.skills.find(sk => sk.id === ps.skillId),
    }));
  },
  getResourceMatchScore: (resourceId, projectId) => {
    const s = get();
    const reqSkills = s.projectSkills.filter(ps => ps.projectId === projectId && ps.required);
    if (reqSkills.length === 0) return { score: 100, matched: 0, total: 0 };
    const resSkillIds = s.resourceSkills.filter(rs => rs.resourceId === resourceId).map(rs => rs.skillId);
    const matched = reqSkills.filter(ps => resSkillIds.includes(ps.skillId)).length;
    return { score: Math.round((matched / reqSkills.length) * 100), matched, total: reqSkills.length };
  },
});

export const createLeaveSlice = (set, get) => ({
  leaves: [],
  publicHolidays: [],

  addLeave: (leave) => set((s) => ({ leaves: [...s.leaves, { ...leave, id: genId(), createdAt: new Date().toISOString() }] })),
  updateLeave: (id, u) => set((s) => ({ leaves: s.leaves.map(l => l.id === id ? { ...l, ...u } : l) })),
  deleteLeave: (id) => set((s) => ({ leaves: s.leaves.filter(l => l.id !== id) })),
  addPublicHoliday: (h) => set((s) => ({ publicHolidays: [...s.publicHolidays, { ...h, id: genId(), createdAt: new Date().toISOString() }] })),
  deletePublicHoliday: (id) => set((s) => ({ publicHolidays: s.publicHolidays.filter(h => h.id !== id) })),

  isResourceOnLeave: (resourceId, dateStr) => {
    const s = get();
    const hasLeave = s.leaves.some(l => l.resourceId === resourceId && dateStr >= l.startDate && dateStr <= l.endDate);
    if (hasLeave) return true;
    const hasHoliday = s.publicHolidays.some(h => h.date === dateStr);
    return hasHoliday;
  },
});

export const createTimeLogSlice = (set, get) => ({
  timeLogs: [],

  upsertTimeLog: (entry) => set((s) => {
    const existing = s.timeLogs.find(t => t.resourceId === entry.resourceId && t.projectId === entry.projectId && t.date === entry.date);
    if (existing) {
      return { timeLogs: s.timeLogs.map(t => t.id === existing.id ? { ...t, ...entry, updatedAt: new Date().toISOString() } : t) };
    }
    return { timeLogs: [...s.timeLogs, { ...entry, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] };
  }),
  bulkUpsertTimeLogs: (entries) => {
    entries.forEach(e => get().upsertTimeLog(e));
  },
  deleteTimeLog: (id) => set((s) => ({ timeLogs: s.timeLogs.filter(t => t.id !== id) })),

  getTimeLogsForDate: (resourceId, dateStr) => {
    return get().timeLogs.filter(t => t.resourceId === resourceId && t.date === dateStr);
  },
  getProjectVariance: (projectId) => {
    const s = get();
    const assignments = s.assignments.filter(a => a.projectId === projectId);
    let totalPlanned = 0, totalActual = 0;
    assignments.forEach(a => {
      const days = eachDayOfInterval({ start: new Date(a.startDate + 'T00:00:00'), end: new Date(a.endDate + 'T00:00:00') })
        .filter(d => s.settings.workingDays.includes(d.getDay()));
      totalPlanned += a.dailyHours * days.length;
    });
    totalActual = s.timeLogs.filter(t => t.projectId === projectId).reduce((sum, t) => sum + (t.hoursLogged || 0), 0);
    return { totalPlanned, totalActual, variance: totalActual - totalPlanned };
  },
});

export const createConflictSlice = (set, get) => ({
  getConflicts: () => {
    const s = get();
    const conflicts = [];
    const today = startOfDay(new Date());
    const next7 = addDays(today, 7);

    s.resources.forEach(resource => {
      for (let d = new Date(today); d <= next7; d = addDays(d, 1)) {
        if (!s.settings.workingDays.includes(d.getDay())) continue;
        const dateStr = format(d, 'yyyy-MM-dd');
        if (s.isResourceOnLeave && s.isResourceOnLeave(resource.id, dateStr)) continue;

        let totalHours = 0;
        const affectedProjects = [];
        s.assignments.forEach(a => {
          if (a.resourceId === resource.id && dateStr >= a.startDate && dateStr <= a.endDate) {
            totalHours += a.dailyHours;
            const proj = s.projects.find(p => p.id === a.projectId);
            if (proj && !affectedProjects.find(ap => ap.id === proj.id)) affectedProjects.push(proj);
          }
        });

        if (totalHours > resource.dailyCapacityHours) {
          const existing = conflicts.find(c => c.type === 'overallocation' && c.resourceId === resource.id && c.date === dateStr);
          if (!existing) {
            conflicts.push({
              id: `conflict-${resource.id}-${dateStr}`,
              type: 'overallocation', resourceId: resource.id, resource,
              date: dateStr, totalHours, capacity: resource.dailyCapacityHours,
              description: `${resource.name} is allocated ${totalHours}h/day on ${dateStr} (capacity: ${resource.dailyCapacityHours}h)`,
              affectedProjects,
            });
          }
        }

        const utilPct = resource.dailyCapacityHours > 0 ? (totalHours / resource.dailyCapacityHours) * 100 : 0;
        if (utilPct >= 90 && utilPct <= 100) {
          const existing = conflicts.find(c => c.type === 'crunch' && c.resourceId === resource.id);
          if (!existing) {
            conflicts.push({
              id: `crunch-${resource.id}`, type: 'crunch', resourceId: resource.id, resource,
              date: dateStr, totalHours, capacity: resource.dailyCapacityHours,
              description: `${resource.name} will hit ${Math.round(utilPct)}% utilization on ${dateStr}`,
              affectedProjects,
            });
          }
        }
      }
    });
    return conflicts;
  },
});

export const createTemplateSlice = (set, get) => ({
  templates: [],
  templateRoles: [],

  addTemplate: (t) => {
    const id = genId();
    set((s) => ({ templates: [...s.templates, { ...t, id, createdAt: new Date().toISOString() }] }));
    return id;
  },
  updateTemplate: (id, u) => set((s) => ({ templates: s.templates.map(t => t.id === id ? { ...t, ...u } : t) })),
  deleteTemplate: (id) => set((s) => ({
    templates: s.templates.filter(t => t.id !== id),
    templateRoles: s.templateRoles.filter(r => r.templateId !== id),
  })),
  addTemplateRole: (r) => set((s) => ({ templateRoles: [...s.templateRoles, { ...r, id: genId() }] })),
  deleteTemplateRole: (id) => set((s) => ({ templateRoles: s.templateRoles.filter(r => r.id !== id) })),

  createProjectFromTemplate: (templateId, name, startDate, resourceMap = {}) => {
    const s = get();
    const template = s.templates.find(t => t.id === templateId);
    if (!template) return null;
    const roles = s.templateRoles.filter(r => r.templateId === templateId);
    const projectId = genId();
    const endDate = format(addDays(new Date(startDate + 'T00:00:00'), template.durationDays), 'yyyy-MM-dd');

    set((state) => {
      const newAssignments = [];
      roles.forEach(role => {
        const resId = resourceMap[role.roleTitle];
        if (resId) {
          newAssignments.push({
            id: genId(), projectId, resourceId: resId,
            startDate: format(addDays(new Date(startDate + 'T00:00:00'), role.startOffsetDays), 'yyyy-MM-dd'),
            endDate: format(addDays(new Date(startDate + 'T00:00:00'), role.startOffsetDays + role.durationDays), 'yyyy-MM-dd'),
            dailyHours: role.dailyHours,
          });
        }
      });
      return {
        projects: [...state.projects, {
          id: projectId, name, description: template.description || '',
          startDate, endDate, colorTag: template.colorTag, status: 'planning',
          createdAt: new Date().toISOString(),
        }],
        assignments: [...state.assignments, ...newAssignments],
      };
    });
    return projectId;
  },

  saveProjectAsTemplate: (projectId, templateName) => {
    const s = get();
    const project = s.projects.find(p => p.id === projectId);
    if (!project) return null;
    const assigns = s.assignments.filter(a => a.projectId === projectId);
    const projStart = new Date(project.startDate + 'T00:00:00');
    const projEnd = new Date(project.endDate + 'T00:00:00');
    const duration = Math.ceil((projEnd - projStart) / (1000 * 60 * 60 * 24));
    const tid = genId();
    const roles = assigns.map(a => {
      const resource = s.resources.find(r => r.id === a.resourceId);
      const startOffset = Math.ceil((new Date(a.startDate + 'T00:00:00') - projStart) / (1000 * 60 * 60 * 24));
      const dur = Math.ceil((new Date(a.endDate + 'T00:00:00') - new Date(a.startDate + 'T00:00:00')) / (1000 * 60 * 60 * 24));
      return { id: genId(), templateId: tid, roleTitle: resource?.role || 'Resource', dailyHours: a.dailyHours, startOffsetDays: startOffset, durationDays: dur };
    });
    set((state) => ({
      templates: [...state.templates, { id: tid, name: templateName, description: project.description, colorTag: project.colorTag, durationDays: duration, createdAt: new Date().toISOString() }],
      templateRoles: [...state.templateRoles, ...roles],
    }));
    return tid;
  },
});

export const createRequestSlice = (set, get) => ({
  resourceRequests: [],
  notifications: [],

  addRequest: (req) => set((s) => ({
    resourceRequests: [...s.resourceRequests, { ...req, id: genId(), status: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
  })),
  approveRequest: (id, reviewerId) => set((s) => {
    const req = s.resourceRequests.find(r => r.id === id);
    if (!req) return {};
    const newAssignment = {
      id: genId(), projectId: req.projectId, resourceId: req.resourceId,
      startDate: req.startDate, endDate: req.endDate, dailyHours: req.dailyHours,
    };
    return {
      resourceRequests: s.resourceRequests.map(r => r.id === id ? { ...r, status: 'APPROVED', reviewedById: reviewerId, updatedAt: new Date().toISOString() } : r),
      assignments: [...s.assignments, newAssignment],
      notifications: [...s.notifications, {
        id: genId(), userId: req.requestedById, type: 'request_approved',
        title: 'Request Approved', message: `Your resource request was approved`,
        linkUrl: '/requests', isRead: false, createdAt: new Date().toISOString(),
      }],
    };
  }),
  rejectRequest: (id, reviewerId, reviewNote) => set((s) => ({
    resourceRequests: s.resourceRequests.map(r => r.id === id ? { ...r, status: 'REJECTED', reviewedById: reviewerId, reviewNote, updatedAt: new Date().toISOString() } : r),
    notifications: [...s.notifications, {
      id: genId(), userId: s.resourceRequests.find(r => r.id === id)?.requestedById,
      type: 'request_rejected', title: 'Request Rejected',
      message: `Your resource request was rejected: ${reviewNote}`,
      linkUrl: '/requests', isRead: false, createdAt: new Date().toISOString(),
    }],
  })),
  cancelRequest: (id) => set((s) => ({
    resourceRequests: s.resourceRequests.map(r => r.id === id ? { ...r, status: 'CANCELLED', updatedAt: new Date().toISOString() } : r),
  })),
  addNotification: (n) => set((s) => ({ notifications: [...s.notifications, { ...n, id: genId(), isRead: false, createdAt: new Date().toISOString() }] })),
  markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) })),
  markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })) })),
});

export const createScenarioSlice = (set, get) => ({
  scenarios: [],
  scenarioAssignments: [],
  activeScenarioId: null,

  createScenario: (name, description) => {
    const s = get();
    const sid = genId();
    const clonedAssignments = s.assignments.map(a => ({
      ...a, id: genId(), scenarioId: sid, action: 'none',
    }));
    set((state) => ({
      scenarios: [...state.scenarios, { id: sid, name, description, isPublished: false, createdAt: new Date().toISOString() }],
      scenarioAssignments: [...state.scenarioAssignments, ...clonedAssignments],
      activeScenarioId: sid,
    }));
    return sid;
  },
  exitScenario: () => set({ activeScenarioId: null }),
  enterScenario: (id) => set({ activeScenarioId: id }),
  deleteScenario: (id) => set((s) => ({
    scenarios: s.scenarios.filter(sc => sc.id !== id),
    scenarioAssignments: s.scenarioAssignments.filter(sa => sa.scenarioId !== id),
    activeScenarioId: s.activeScenarioId === id ? null : s.activeScenarioId,
  })),
  publishScenario: (id) => set((s) => {
    const scAssignments = s.scenarioAssignments.filter(sa => sa.scenarioId === id && sa.action !== 'remove');
    const newAssignments = scAssignments.map(sa => ({
      id: genId(), projectId: sa.projectId, resourceId: sa.resourceId,
      startDate: sa.startDate, endDate: sa.endDate, dailyHours: sa.dailyHours,
    }));
    return {
      assignments: newAssignments,
      scenarios: s.scenarios.map(sc => sc.id === id ? { ...sc, isPublished: true } : sc),
      activeScenarioId: null,
    };
  }),
  addScenarioAssignment: (a) => set((s) => ({
    scenarioAssignments: [...s.scenarioAssignments, { ...a, id: genId(), scenarioId: s.activeScenarioId, action: 'add' }],
  })),
  updateScenarioAssignment: (id, u) => set((s) => ({
    scenarioAssignments: s.scenarioAssignments.map(sa => sa.id === id ? { ...sa, ...u, action: sa.action === 'add' ? 'add' : 'modify' } : sa),
  })),
  removeScenarioAssignment: (id) => set((s) => ({
    scenarioAssignments: s.scenarioAssignments.map(sa => sa.id === id ? { ...sa, action: 'remove' } : sa),
  })),
});

export const createHealthScoreSlice = (set, get) => ({
  getHealthScore: (resourceId) => {
    const s = get();
    const resource = s.resources.find(r => r.id === resourceId);
    if (!resource) return { overall: 0, factors: {} };

    const today = startOfDay(new Date());
    const weeks = [];
    for (let w = 0; w < 8; w++) {
      const ws = startOfWeek(subDays(today, w * 7), { weekStartsOn: 1 });
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: ws, end: we });
      let cap = 0, alloc = 0;
      days.forEach(d => {
        if (!s.settings.workingDays.includes(d.getDay())) return;
        cap += resource.dailyCapacityHours;
        const dateStr = format(d, 'yyyy-MM-dd');
        s.assignments.forEach(a => {
          if (a.resourceId === resourceId && dateStr >= a.startDate && dateStr <= a.endDate) alloc += a.dailyHours;
        });
      });
      weeks.push({ util: cap > 0 ? (alloc / cap) * 100 : 0 });
    }

    const avgUtil = weeks.reduce((s, w) => s + w.util, 0) / weeks.length;
    const utilizationBalance = avgUtil >= 70 && avgUtil <= 85 ? 20 : avgUtil < 30 ? 5 : avgUtil > 100 ? 3 : Math.max(2, 20 - Math.abs(avgUtil - 77.5) * 0.5);

    const variances = weeks.slice(0, -1).map((w, i) => Math.abs(w.util - weeks[i + 1].util));
    const avgVariance = variances.length > 0 ? variances.reduce((s, v) => s + v, 0) / variances.length : 0;
    const scheduleStability = Math.max(0, Math.round(20 - avgVariance * 0.4));

    let consecutiveHigh = 0, maxConsecutive = 0;
    weeks.forEach(w => {
      if (w.util > 90) { consecutiveHigh++; maxConsecutive = Math.max(maxConsecutive, consecutiveHigh); }
      else consecutiveHigh = 0;
    });
    const burnoutRisk = maxConsecutive >= 4 ? 2 : maxConsecutive === 3 ? 8 : maxConsecutive === 2 ? 14 : 20;

    const recentLeaves = s.leaves ? s.leaves.filter(l => l.resourceId === resourceId).length : 0;
    const leaveBalance = recentLeaves > 0 ? 18 : 8;

    const logs = s.timeLogs ? s.timeLogs.filter(t => t.resourceId === resourceId) : [];
    const actualAlignment = logs.length > 0 ? 16 : 12;

    const overall = Math.min(100, Math.round(utilizationBalance + scheduleStability + burnoutRisk + leaveBalance + actualAlignment));

    let recommendation = '';
    const minFactor = Math.min(utilizationBalance, scheduleStability, burnoutRisk, leaveBalance, actualAlignment);
    if (minFactor === burnoutRisk && maxConsecutive >= 3) recommendation = `${resource.name} has been above 90% utilization for ${maxConsecutive} consecutive weeks. Consider reducing their allocation.`;
    else if (minFactor === leaveBalance && recentLeaves === 0) recommendation = `${resource.name} has not taken any leave recently. Encourage time off.`;
    else if (minFactor === utilizationBalance && avgUtil > 95) recommendation = `${resource.name} is consistently over-allocated. Review their workload.`;
    else if (minFactor === utilizationBalance && avgUtil < 40) recommendation = `${resource.name} is significantly under-utilized. Consider additional assignments.`;

    return {
      overall, recommendation, weeklyUtils: weeks.map(w => w.util),
      factors: { utilizationBalance, scheduleStability, burnoutRisk, leaveBalance, actualAlignment },
    };
  },

  getTeamHealthScore: () => {
    const s = get();
    const scores = s.resources.map(r => ({ resource: r, ...s.getHealthScore(r.id) }));
    const avg = scores.length > 0 ? Math.round(scores.reduce((sum, sc) => sum + sc.overall, 0) / scores.length) : 0;
    const atRisk = scores.filter(sc => sc.overall < 70);
    return { average: avg, scores, atRisk };
  },
});

export const createForecastSlice = (set, get) => ({
  getForecast: (weeksAhead = 13) => {
    const s = get();
    const today = startOfDay(new Date());
    const result = [];
    for (let w = 0; w < weeksAhead; w++) {
      const ws = startOfWeek(addDays(today, w * 7), { weekStartsOn: 1 });
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      let totalCap = 0, totalCommitted = 0;
      const resourceData = [];

      s.resources.forEach(resource => {
        let cap = 0, committed = 0;
        const days = eachDayOfInterval({ start: ws, end: we });
        days.forEach(d => {
          if (!s.settings.workingDays.includes(d.getDay())) return;
          const dateStr = format(d, 'yyyy-MM-dd');
          const onLeave = s.isResourceOnLeave ? s.isResourceOnLeave(resource.id, dateStr) : false;
          if (onLeave) return;
          cap += resource.dailyCapacityHours;
          s.assignments.forEach(a => {
            if (a.resourceId === resource.id && dateStr >= a.startDate && dateStr <= a.endDate) committed += a.dailyHours;
          });
        });
        totalCap += cap; totalCommitted += committed;
        resourceData.push({ resourceId: resource.id, name: resource.name, cap, committed, util: cap > 0 ? Math.round((committed / cap) * 100) : 0 });
      });

      result.push({
        weekStart: format(ws, 'yyyy-MM-dd'),
        weekLabel: `Week of ${format(ws, 'MMM d')}`,
        totalCapacity: totalCap, totalCommitted,
        freeCapacity: totalCap - totalCommitted,
        utilPercent: totalCap > 0 ? Math.round((totalCommitted / totalCap) * 100) : 0,
        resources: resourceData,
      });
    }
    return result;
  },

  simulateProject: (requirements) => {
    const s = get();
    const conflicts = [];
    requirements.forEach(req => {
      const resource = s.resources.find(r => r.id === req.resourceId);
      if (!resource) return;
      const days = eachDayOfInterval({ start: new Date(req.startDate + 'T00:00:00'), end: new Date(req.endDate + 'T00:00:00') });
      days.forEach(d => {
        if (!s.settings.workingDays.includes(d.getDay())) return;
        const dateStr = format(d, 'yyyy-MM-dd');
        let existing = 0;
        s.assignments.forEach(a => {
          if (a.resourceId === req.resourceId && dateStr >= a.startDate && dateStr <= a.endDate) existing += a.dailyHours;
        });
        if (existing + req.dailyHours > resource.dailyCapacityHours) {
          if (!conflicts.find(c => c.resourceId === req.resourceId && c.date === dateStr)) {
            conflicts.push({ resourceId: req.resourceId, resourceName: resource.name, date: dateStr, totalHours: existing + req.dailyHours, capacity: resource.dailyCapacityHours });
          }
        }
      });
    });
    return { hasConflicts: conflicts.length > 0, conflicts };
  },
});

export const createBudgetSlice = (set, get) => ({
  getProjectBudget: (projectId) => {
    const s = get();
    const project = s.projects.find(p => p.id === projectId);
    if (!project) return null;
    const assignments = s.assignments.filter(a => a.projectId === projectId);

    let plannedCost = 0, actualCost = 0;
    const byResource = [];

    assignments.forEach(a => {
      const resource = s.resources.find(r => r.id === a.resourceId);
      const rate = resource?.hourlyRate || 0;
      const days = eachDayOfInterval({ start: new Date(a.startDate + 'T00:00:00'), end: new Date(a.endDate + 'T00:00:00') })
        .filter(d => s.settings.workingDays.includes(d.getDay()));
      const planned = a.dailyHours * days.length;
      const pCost = planned * rate;
      plannedCost += pCost;

      const logs = s.timeLogs ? s.timeLogs.filter(t => t.projectId === projectId && t.resourceId === a.resourceId) : [];
      const actual = logs.reduce((sum, t) => sum + (t.hoursLogged || 0), 0);
      const aCost = actual * rate;
      actualCost += aCost;

      byResource.push({ resource, plannedHours: planned, actualHours: actual, plannedCost: pCost, actualCost: aCost, rate });
    });

    const budget = project.budget || 0;
    const remaining = budget - actualCost;
    const burnRate = actualCost > 0 ? actualCost / 30 : plannedCost / 30;

    return { budget, plannedCost, actualCost, remaining, burnRate, percentUsed: budget > 0 ? Math.round((actualCost / budget) * 100) : 0, byResource, currency: project.currency || 'USD' };
  },
});
