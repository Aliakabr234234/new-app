import { useAuth } from './useAuth';

/**
 * RoleGate — renders children only if user has one of the allowed roles.
 * Renders null for unauthorized roles — no error, just hidden.
 */
export function RoleGate({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
}
