// Role-based Access Control Middleware

// Role definitions
const ROLES = {
  ASHA_WORKER: 'asha_worker',
  ANGANWADI_WORKER: 'anganwadi_worker',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Permission levels
const PERMISSIONS = {
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
const ROLE_PERMISSIONS = {
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

// Get user role from request
const getUserRole = (req) => {
  // Try to get role from user object
  if (req.user && req.user.role) {
    return req.user.role;
  }
  
  // Try to get role from headers
  const roleHeader = req.headers['x-user-role'];
  if (roleHeader) {
    return roleHeader;
  }
  
  // Default to ASHA worker for backward compatibility
  return ROLES.ASHA_WORKER;
};

// Check if user has specific permission
const hasPermission = (req, permission) => {
  const userRole = getUserRole(req);
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  
  return rolePermissions ? rolePermissions.includes(permission) : false;
};

// Check if user has any of the specified permissions
const hasAnyPermission = (req, permissions) => {
  const userRole = getUserRole(req);
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  
  if (!rolePermissions) return false;
  
  return permissions.some(permission => rolePermissions.includes(permission));
};

// Check if user has all of the specified permissions
const hasAllPermissions = (req, permissions) => {
  const userRole = getUserRole(req);
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  
  if (!rolePermissions) return false;
  
  return permissions.every(permission => rolePermissions.includes(permission));
};

// Middleware for single permission requirement
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!hasPermission(req, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredPermission: permission,
        userRole: getUserRole(req)
      });
    }
    next();
  };
};

// Middleware for multiple permissions (any)
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!hasAnyPermission(req, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredPermissions: permissions,
        userRole: getUserRole(req)
      });
    }
    next();
  };
};

// Middleware for multiple permissions (all)
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!hasAllPermissions(req, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredPermissions: permissions,
        userRole: getUserRole(req)
      });
    }
    next();
  };
};

// Middleware to check if user can access specific dashboard
const requireDashboardAccess = (dashboardType) => {
  return (req, res, next) => {
    const userRole = getUserRole(req);
    
    switch (dashboardType) {
      case 'asha':
        if (userRole !== ROLES.ASHA_WORKER) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. ASHA dashboard access required.',
            userRole
          });
        }
        break;
      case 'anganwadi':
        if (userRole !== ROLES.ANGANWADI_WORKER) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Anganwadi dashboard access required.',
            userRole
          });
        }
        break;
      case 'admin':
        if (userRole !== ROLES.ADMIN && userRole !== ROLES.SUPER_ADMIN) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Admin dashboard access required.',
            userRole
          });
        }
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Access denied. Invalid dashboard type.',
          userRole
        });
    }
    
    next();
  };
};

// Middleware to check if user can perform cross-dashboard actions
const requireCrossDashboardAccess = (req, res, next) => {
  const userRole = getUserRole(req);
  const allowedRoles = [ROLES.ASHA_WORKER, ROLES.ADMIN, ROLES.SUPER_ADMIN];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Cross-dashboard actions not allowed.',
      userRole
    });
  }
  
  next();
};

// Get user permissions for display
const getUserPermissions = (req) => {
  const userRole = getUserRole(req);
  return ROLE_PERMISSIONS[userRole] || [];
};

// Get accessible dashboards for user
const getAccessibleDashboards = (req) => {
  const userRole = getUserRole(req);
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

// Add user role information to request object
const attachUserRole = (req, res, next) => {
  req.userRole = getUserRole(req);
  req.userPermissions = getUserPermissions(req);
  req.accessibleDashboards = getAccessibleDashboards(req);
  next();
};

module.exports = {
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
  requireDashboardAccess,
  requireCrossDashboardAccess,
  getUserPermissions,
  getAccessibleDashboards,
  attachUserRole
};
