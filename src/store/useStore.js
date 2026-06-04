import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format, startOfDay, eachDayOfInterval, isWeekend, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getISOWeek, getYear, isSameDay, differenceInCalendarDays } from 'date-fns';
import { createSkillsSlice, createLeaveSlice, createTimeLogSlice, createConflictSlice, createTemplateSlice, createRequestSlice, createScenarioSlice, createHealthScoreSlice, createForecastSlice, createBudgetSlice } from './slices';

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const today = startOfDay(new Date());

const defaultSettings = {
  appName: 'ResourceFlow',
  workingHoursPerDay: 8,
  workingDays: [1, 2, 3, 4, 5], // Mon-Fri (0=Sun, 1=Mon, ...)
  accentColor: '#6366F1',
  theme: 'dark', // 'dark' or 'light'
};

const seedResources = [
  {
    id: 'res-alex',
    name: 'Alex Chen',
    role: 'Developer',
    dailyCapacityHours: 8,
    colorTag: '#3B82F6',
    createdAt: today.toISOString(),
  },
  {
    id: 'res-sara',
    name: 'Sara Kim',
    role: 'Designer',
    dailyCapacityHours: 8,
    colorTag: '#8B5CF6',
    createdAt: today.toISOString(),
  },
  {
    id: 'res-mike',
    name: 'Mike Johnson',
    role: 'Project Manager',
    dailyCapacityHours: 8,
    colorTag: '#EC4899',
    createdAt: today.toISOString(),
  },
  {
    id: 'res-emily',
    name: 'Emily Davis',
    role: 'Backend Developer',
    dailyCapacityHours: 8,
    colorTag: '#14B8A6',
    createdAt: today.toISOString(),
  },
];

const seedProjects = [
  {
    id: 'proj-website',
    name: 'New Website Redesign',
    description: 'Complete redesign of the company website with modern UI/UX',
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(addDays(today, 20), 'yyyy-MM-dd'),
    colorTag: '#6366F1',
    status: 'active',
    createdAt: today.toISOString(),
  },
  {
    id: 'proj-mobile',
    name: 'Mobile App MVP',
    description: 'Build the first version of our mobile application',
    startDate: format(addDays(today, 5), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 30), 'yyyy-MM-dd'),
    colorTag: '#10B981',
    status: 'planning',
    createdAt: today.toISOString(),
  },
  {
    id: 'proj-api',
    name: 'API Integration',
    description: 'Integrate third-party APIs for payment and analytics',
    startDate: format(addDays(today, -3), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 14), 'yyyy-MM-dd'),
    colorTag: '#F59E0B',
    status: 'active',
    createdAt: today.toISOString(),
  },
];

const seedAssignments = [
  {
    id: 'asgn-1',
    projectId: 'proj-website',
    resourceId: 'res-sara',
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(addDays(today, 6), 'yyyy-MM-dd'),
    dailyHours: 2,
  },
  {
    id: 'asgn-2',
    projectId: 'proj-website',
    resourceId: 'res-alex',
    startDate: format(addDays(today, 7), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 20), 'yyyy-MM-dd'),
    dailyHours: 3,
  },
  {
    id: 'asgn-3',
    projectId: 'proj-mobile',
    resourceId: 'res-alex',
    startDate: format(addDays(today, 5), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 25), 'yyyy-MM-dd'),
    dailyHours: 3,
  },
  {
    id: 'asgn-4',
    projectId: 'proj-mobile',
    resourceId: 'res-emily',
    startDate: format(addDays(today, 7), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 28), 'yyyy-MM-dd'),
    dailyHours: 5,
  },
  {
    id: 'asgn-5',
    projectId: 'proj-api',
    resourceId: 'res-emily',
    startDate: format(addDays(today, -3), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 10), 'yyyy-MM-dd'),
    dailyHours: 3,
  },
  {
    id: 'asgn-6',
    projectId: 'proj-api',
    resourceId: 'res-mike',
    startDate: format(addDays(today, -3), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 14), 'yyyy-MM-dd'),
    dailyHours: 2,
  },
  {
    id: 'asgn-7',
    projectId: 'proj-website',
    resourceId: 'res-mike',
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(addDays(today, 20), 'yyyy-MM-dd'),
    dailyHours: 1,
  },
];

const useStore = create(
  persist(
    (set, get) => ({
      // Data
      resources: seedResources,
      projects: seedProjects,
      assignments: seedAssignments,
      settings: defaultSettings,
      _seeded: true,

      // Resource Actions
      addResource: (resource) => set((state) => ({
        resources: [...state.resources, { ...resource, id: generateId(), createdAt: new Date().toISOString() }],
      })),
      updateResource: (id, updates) => set((state) => ({
        resources: state.resources.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      })),
      deleteResource: (id) => set((state) => ({
        resources: state.resources.filter((r) => r.id !== id),
        assignments: state.assignments.filter((a) => a.resourceId !== id),
      })),

      // Project Actions
      addProject: (project) => set((state) => ({
        projects: [...state.projects, { ...project, id: generateId(), createdAt: new Date().toISOString() }],
      })),
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        assignments: state.assignments.filter((a) => a.projectId !== id),
      })),

      // Assignment Actions
      addAssignment: (assignment) => set((state) => ({
        assignments: [...state.assignments, { ...assignment, id: generateId() }],
      })),
      updateAssignment: (id, updates) => set((state) => ({
        assignments: state.assignments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),
      deleteAssignment: (id) => set((state) => ({
        assignments: state.assignments.filter((a) => a.id !== id),
      })),

      // Settings
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      // Clear all data
      clearAllData: () => set({
        resources: [],
        projects: [],
        assignments: [],
        settings: defaultSettings,
        _seeded: false,
      }),

      // Export data
      exportData: () => {
        const state = get();
        return {
          resources: state.resources,
          projects: state.projects,
          assignments: state.assignments,
          settings: state.settings,
          exportedAt: new Date().toISOString(),
        };
      },

      // Utility Functions
      getResourceUtilizationOnDate: (resourceId, date) => {
        const state = get();
        const resource = state.resources.find((r) => r.id === resourceId);
        if (!resource) return { hoursAllocated: 0, capacityHours: 8, utilizationPercent: 0 };

        const dateStr = typeof date === 'string' ? date : format(startOfDay(date), 'yyyy-MM-dd');
        const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : startOfDay(date);
        const dayOfWeek = dateObj.getDay();

        // Check if it's a working day
        if (!state.settings.workingDays.includes(dayOfWeek)) {
          return { hoursAllocated: 0, capacityHours: 0, utilizationPercent: 0, isNonWorking: true };
        }

        // Check leave
        if (state.isResourceOnLeave && state.isResourceOnLeave(resourceId, dateStr)) {
          return { hoursAllocated: 0, capacityHours: 0, utilizationPercent: 0, onLeave: true };
        }

        let hoursAllocated = 0;
        const projectBreakdown = [];
        state.assignments.forEach((a) => {
          if (a.resourceId === resourceId) {
            const aStart = a.startDate;
            const aEnd = a.endDate;
            if (dateStr >= aStart && dateStr <= aEnd) {
              hoursAllocated += a.dailyHours;
              const project = state.projects.find((p) => p.id === a.projectId);
              projectBreakdown.push({
                projectId: a.projectId,
                projectName: project ? project.name : 'Unknown',
                projectColor: project ? project.colorTag : '#666',
                hours: a.dailyHours,
              });
            }
          }
        });

        const capacityHours = resource.dailyCapacityHours;
        const utilizationPercent = capacityHours > 0 ? (hoursAllocated / capacityHours) * 100 : 0;

        return { hoursAllocated, capacityHours, utilizationPercent, projectBreakdown };
      },

      getResourceUtilizationRange: (resourceId, startDate, endDate) => {
        const state = get();
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        return days.map((day) => ({
          date: day,
          dateStr: format(day, 'yyyy-MM-dd'),
          ...state.getResourceUtilizationOnDate(resourceId, day),
        }));
      },

      getProjectAssignments: (projectId) => {
        const state = get();
        return state.assignments
          .filter((a) => a.projectId === projectId)
          .map((a) => {
            const resource = state.resources.find((r) => r.id === a.resourceId);
            const workingDays = eachDayOfInterval({
              start: new Date(a.startDate + 'T00:00:00'),
              end: new Date(a.endDate + 'T00:00:00'),
            }).filter((d) => state.settings.workingDays.includes(d.getDay())).length;
            return {
              ...a,
              resource,
              totalHours: a.dailyHours * workingDays,
              workingDays,
            };
          });
      },

      getCompanyUtilizationByWeek: (startDate, endDate) => {
        const state = get();
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weekMap = {};

        days.forEach((day) => {
          const weekStart = startOfWeek(day, { weekStartsOn: 1 });
          const weekKey = format(weekStart, 'yyyy-MM-dd');

          if (!weekMap[weekKey]) {
            weekMap[weekKey] = {
              weekStart: weekStart,
              weekLabel: `Week of ${format(weekStart, 'MMM d')}`,
              totalCapacity: 0,
              totalAllocated: 0,
              projectBreakdown: {},
              resourceUtilization: {},
            };
          }

          const dayOfWeek = day.getDay();
          if (!state.settings.workingDays.includes(dayOfWeek)) return;

          state.resources.forEach((resource) => {
            weekMap[weekKey].totalCapacity += resource.dailyCapacityHours;
            const util = state.getResourceUtilizationOnDate(resource.id, day);
            weekMap[weekKey].totalAllocated += util.hoursAllocated;

            if (!weekMap[weekKey].resourceUtilization[resource.id]) {
              weekMap[weekKey].resourceUtilization[resource.id] = {
                resourceId: resource.id,
                totalCapacity: 0,
                totalAllocated: 0,
              };
            }
            weekMap[weekKey].resourceUtilization[resource.id].totalCapacity += resource.dailyCapacityHours;
            weekMap[weekKey].resourceUtilization[resource.id].totalAllocated += util.hoursAllocated;

            if (util.projectBreakdown) {
              util.projectBreakdown.forEach((pb) => {
                if (!weekMap[weekKey].projectBreakdown[pb.projectId]) {
                  weekMap[weekKey].projectBreakdown[pb.projectId] = {
                    projectId: pb.projectId,
                    projectName: pb.projectName,
                    projectColor: pb.projectColor,
                    totalHours: 0,
                  };
                }
                weekMap[weekKey].projectBreakdown[pb.projectId].totalHours += pb.hours;
              });
            }
          });
        });

        return Object.values(weekMap).map((w) => ({
          ...w,
          utilizationPercent: w.totalCapacity > 0 ? (w.totalAllocated / w.totalCapacity) * 100 : 0,
          projectBreakdown: Object.values(w.projectBreakdown),
          resourceUtilization: Object.values(w.resourceUtilization),
        }));
      },

      getResourceWeeklyUtilization: (resourceId) => {
        const state = get();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        return state.getResourceUtilizationRange(resourceId, weekStart, weekEnd);
      },

      getResourceMonthlyHeatmap: (resourceId, months = 3) => {
        const state = get();
        const start = today;
        const end = addDays(today, months * 30);
        return state.getResourceUtilizationRange(resourceId, start, end);
      },

      // Quick stats
      getTotalActiveProjects: () => {
        return get().projects.filter((p) => p.status === 'active').length;
      },

      getTotalResources: () => {
        return get().resources.length;
      },

      getWeeklyAllocatedHours: () => {
        const state = get();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        let total = 0;
        state.resources.forEach((r) => {
          const utils = state.getResourceUtilizationRange(r.id, weekStart, weekEnd);
          utils.forEach((u) => { total += u.hoursAllocated; });
        });
        return total;
      },

      getOverallUtilization: () => {
        const state = get();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        let totalCap = 0;
        let totalAlloc = 0;
        state.resources.forEach((r) => {
          const utils = state.getResourceUtilizationRange(r.id, weekStart, weekEnd);
          utils.forEach((u) => {
            totalCap += u.capacityHours;
            totalAlloc += u.hoursAllocated;
          });
        });
        return totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0;
      },

      getTopBusyResources: (count = 3) => {
        const state = get();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

        const resourceStats = state.resources.map((r) => {
          const utils = state.getResourceUtilizationRange(r.id, weekStart, weekEnd);
          const totalAlloc = utils.reduce((sum, u) => sum + u.hoursAllocated, 0);
          const totalCap = utils.reduce((sum, u) => sum + u.capacityHours, 0);
          return {
            ...r,
            totalAllocated: totalAlloc,
            totalCapacity: totalCap,
            utilizationPercent: totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0,
            dailyData: utils,
          };
        });

        return resourceStats.sort((a, b) => b.utilizationPercent - a.utilizationPercent).slice(0, count);
      },

      getUpcomingAvailability: () => {
        const state = get();
        const results = [];
        state.resources.forEach((r) => {
          const assignments = state.assignments.filter((a) => a.resourceId === r.id);
          if (assignments.length === 0) return;
          
          const latestEnd = assignments.reduce((latest, a) => {
            return a.endDate > latest ? a.endDate : latest;
          }, '');
          
          const endDate = new Date(latestEnd + 'T00:00:00');
          const daysUntilFree = differenceInCalendarDays(endDate, today);
          
          if (daysUntilFree >= 0 && daysUntilFree <= 7) {
            results.push({ ...r, freeDate: latestEnd, daysUntilFree });
          }
        });
        return results.sort((a, b) => a.daysUntilFree - b.daysUntilFree);
      },
      // Module slices
      ...createSkillsSlice(set, get),
      ...createLeaveSlice(set, get),
      ...createTimeLogSlice(set, get),
      ...createConflictSlice(set, get),
      ...createTemplateSlice(set, get),
      ...createRequestSlice(set, get),
      ...createScenarioSlice(set, get),
      ...createHealthScoreSlice(set, get),
      ...createForecastSlice(set, get),
      ...createBudgetSlice(set, get),
    }),
    {
      name: 'resourceflow-storage',
    }
  )
);

export default useStore;
