import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ResourceView from './pages/ResourceView';
import ProjectView from './pages/ProjectView';
import Timeline from './pages/Timeline';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import SkillsMatrix from './pages/SkillsMatrix';
import Leave from './pages/Leave';
import Timesheet from './pages/Timesheet';
import Forecast from './pages/Forecast';
import Templates from './pages/Templates';
import Scenarios from './pages/Scenarios';
import Requests from './pages/Requests';
import Reports from './pages/Reports';
import HealthScores from './pages/HealthScores';
import { ErrorBoundary } from './components/shared';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected routes */}
                <Route element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/resources/:id" element={<ResourceDetail />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                  <Route path="/resource-view" element={<ResourceView />} />
                  <Route path="/project-view" element={<ProjectView />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/skills" element={<SkillsMatrix />} />
                  <Route path="/leave" element={<Leave />} />
                  <Route path="/timesheet" element={<Timesheet />} />
                  <Route path="/forecast" element={<Forecast />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/scenarios" element={<Scenarios />} />
                  <Route path="/requests" element={<Requests />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/health" element={<HealthScores />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
