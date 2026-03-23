// Role-based Access Control for ASHA Worker Dashboard

// Role definitions
export const ROLES = {
  ASHA_WORKER: 'asha_worker',
  ANGANWADI_WORKER: 'anganwadi_worker',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Permission levels
export const PERMISSIONS = {
  // Field Visit permissions
  CREATE_FIELD_VISIT: 'create_field_visit',
  VIEW_FIELD_VISITS: 'view_field_visits',
  UPDATE_FIELD_VISIT: 'update_field_visit',
  DELETE_FIELD_VISIT: 'delete_field_visit',
  
  // Awareness Session permissions
  CREATE_AWARENESS_SESSION: 'create_awareness_session',
  VIEW_AWARENESS_SESSIONS: 'view_awareness_sessions',
  UPDATE_AWARENESS_SESSION: 'update_awareness_session',
  DELETE_AWARENESS_SESSION: 'delete_awareness_session',
  
  // Alert permissions
  CREATE_ALERT: 'create_alert',
  VIEW_ALERTS: 'view_alerts',
  UPDATE_ALERT: 'update_alert',
  DELETE_ALERT: 'delete_alert',
  
  // Notification permissions
  VIEW_NOTIFICATIONS: 'view_notifications',
  UPDATE_NOTIFICATION: 'update_notification',
  DELETE_NOTIFICATION: 'delete_notification',
  
  // Report permissions
  VIEW_REPORTS: 'view_reports',
  DOWNLOAD_REPORTS: 'download_reports',
  GENERATE_REPORTS: 'generate_reports',
  
  // Profile permissions
  VIEW_PROFILE: 'view_profile',
  UPDATE_PROFILE: 'update_profile',
  
  // Cross-dashboard permissions
  FORWARD_TO_AWW: 'forward_to_aww',
  FORWARD_TO_ADMIN: 'forward_to_admin',
  VIEW_VERIFICATION_STATUS: 'view_verification_status',
  
  // Admin-only permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_ALL_DATA: 'view_all_data',
  EXPORT_DATA: 'export_data'
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ASHA_WORKER]: [
    PERMISSIONS.CREATE_FIELD_VISIT,
    PERMISSIONS.VIEW_FIELD_VISITS,
    PERMISSIONS.UPDATE_FIELD_VISIT,
    PERMISSIONS.CREATE_AWARENESS_SESSION,
    PERMISSIONS.VIEW_AWARENESS_SESSIONS,
    PERMISSIONS.UPDATE_AWARENESS_SESSION,
    PERMISSIONS.CREATE_ALERT,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.UPDATE_ALERT,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.UPDATE_NOTIFICATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.DOWNLOAD_REPORTS,
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.UPDATE_PROFILE,
    PERMISSIONS.FORWARD_TO_AWW,
    PERMISSIONS.FORWARD_TO_ADMIN,
    PERMISSIONS.VIEW_VERIFICATION_STATUS
  ],
  
  [ROLES.ANGANWADI_WORKER]: [
    PERMISSIONS.VIEW_FIELD_VISITS,
    PERMISSIONS.VIEW_AWARENESS_SESSIONS,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.DOWNLOAD_REPORTS,
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.UPDATE_PROFILE,
    PERMISSIONS.VIEW_VERIFICATION_STATUS
  ],
  
  [ROLES.ADMIN]: [
    ...Object.values(PERMISSIONS) // Admin has all permissions
  ],
  
  [ROLES.SUPER_ADMIN]: [
    ...Object.values(PERMISSIONS) // Super Admin has all permissions
  ]
};

// Get user role from session or token
export const getUserRole = () => {
  // Try to get role from multiple sources
  const role = localStorage.getItem('userRole') ||
               localStorage.getItem('role') ||
               sessionStorage.getItem('userRole') ||
               null;
  
  return role;
};

// Check if user has specific permission
export const hasPermission = (permission) => {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions ? rolePermissions.includes(permission) : false;
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (permissions) => {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  
  return permissions.some(permission => rolePermissions.includes(permission));
};

// Check if user has all of the specified permissions
export const hasAllPermissions = (permissions) => {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  
  return permissions.every(permission => rolePermissions.includes(permission));
};

// Middleware for route protection
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredPermission: permission
      });
    }
    next();
  };
};

// Middleware for multiple permissions (any)
export const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!hasAnyPermission(permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredPermissions: permissions
      });
    }
    next();
  };
};

// Middleware for multiple permissions (all)
export const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!hasAllPermissions(permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredPermissions: permissions
      });
    }
    next();
  };
};

// Get user permissions for UI display
export const getUserPermissions = () => {
  const userRole = getUserRole();
  if (!userRole) return [];
  
  return ROLE_PERMISSIONS[userRole] || [];
};

// Check if user can access specific dashboard
export const canAccessDashboard = (dashboardType) => {
  const userRole = getUserRole();
  
  switch (dashboardType) {
    case 'asha':
      return userRole === ROLES.ASHA_WORKER;
    case 'anganwadi':
      return userRole === ROLES.ANGANWADI_WORKER;
    case 'admin':
      return userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;
    default:
      return false;
  }
};

// Check if user can perform cross-dashboard actions
export const canPerformCrossDashboardAction = () => {
  return hasPermission(PERMISSIONS.FORWARD_TO_AWW) || 
         hasPermission(PERMISSIONS.FORWARD_TO_ADMIN);
};

// Get accessible dashboards for current user
export const getAccessibleDashboards = () => {
  const userRole = getUserRole();
  const dashboards = [];
  
  switch (userRole) {
    case ROLES.ASHA_WORKER:
      dashboards.push('asha');
      break;
    case ROLES.ANGANWADI_WORKER:
      dashboards.push('anganwadi');
      break;
    case ROLES.ADMIN:
    case ROLES.SUPER_ADMIN:
      dashboards.push('asha', 'anganwadi', 'admin');
      break;
  }
  
  return dashboards;
};

// Component permission checker for conditional rendering
export const withPermission = (permission, component) => {
  return hasPermission(permission) ? component : null;
};

// Higher-order component for permission-based rendering
export const withRoleCheck = (allowedRoles, component) => {
  const userRole = getUserRole();
  const isAllowed = allowedRoles.includes(userRole);
  
  return isAllowed ? component : (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h3>
        <p className="text-red-700">You don't have permission to access this page.</p>
      </div>
    </div>
  );
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getUserRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  getUserPermissions,
  canAccessDashboard,
  canPerformCrossDashboardAction,
  getAccessibleDashboards,
  withPermission,
  withRoleCheck
};
