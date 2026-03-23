// Role-based Access Control Utilities

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

// Helper functions for role validation
const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

const isValidPermission = (permission) => {
  return Object.values(PERMISSIONS).includes(permission);
};

const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

const hasPermission = (role, permission) => {
  const rolePermissions = getRolePermissions(role);
  return rolePermissions.includes(permission);
};

const hasAnyPermission = (role, permissions) => {
  const rolePermissions = getRolePermissions(role);
  return permissions.some(permission => rolePermissions.includes(permission));
};

const hasAllPermissions = (role, permissions) => {
  const rolePermissions = getRolePermissions(role);
  return permissions.every(permission => rolePermissions.includes(permission));
};

// Get role hierarchy for escalation
const getRoleHierarchy = () => {
  return [
    ROLES.ANGANWADI_WORKER,
    ROLES.ASHA_WORKER,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN
  ];
};

const canEscalateTo = (fromRole, toRole) => {
  const hierarchy = getRoleHierarchy();
  const fromIndex = hierarchy.indexOf(fromRole);
  const toIndex = hierarchy.indexOf(toRole);
  
  return fromIndex !== -1 && toIndex !== -1 && toIndex > fromIndex;
};

// Get dashboard access rules
const getDashboardAccessRules = () => {
  return {
    [ROLES.ASHA_WORKER]: ['asha'],
    [ROLES.ANGANWADI_WORKER]: ['anganwadi'],
    [ROLES.ADMIN]: ['asha', 'anganwadi', 'admin'],
    [ROLES.SUPER_ADMIN]: ['asha', 'anganwadi', 'admin']
  };
};

const canAccessDashboard = (role, dashboard) => {
  const rules = getDashboardAccessRules();
  const allowedDashboards = rules[role] || [];
  return allowedDashboards.includes(dashboard);
};

// Get cross-dashboard permissions
const getCrossDashboardPermissions = (role) => {
  const crossDashboardPerms = [
    PERMISSIONS.FORWARD_TO_AWW,
    PERMISSIONS.FORWARD_TO_ADMIN,
    PERMISSIONS.VIEW_VERIFICATION_STATUS
  ];
  
  return crossDashboardPerms.filter(perm => hasPermission(role, perm));
};

// Permission validation for API endpoints
const validatePermission = (role, requiredPermission) => {
  if (!isValidRole(role)) {
    return {
      valid: false,
      error: `Invalid role: ${role}`
    };
  }
  
  if (!isValidPermission(requiredPermission)) {
    return {
      valid: false,
      error: `Invalid permission: ${requiredPermission}`
    };
  }
  
  if (!hasPermission(role, requiredPermission)) {
    return {
      valid: false,
      error: `Role ${role} does not have permission ${requiredPermission}`
    };
  }
  
  return {
    valid: true,
    error: null
  };
};

// Get all permissions for a role
const getAllPermissionsForRole = (role) => {
  return getRolePermissions(role);
};

// Check if role can manage other role
const canManageRole = (managerRole, targetRole) => {
  const hierarchy = getRoleHierarchy();
  const managerIndex = hierarchy.indexOf(managerRole);
  const targetIndex = hierarchy.indexOf(targetRole);
  
  return managerIndex !== -1 && targetIndex !== -1 && managerIndex > targetIndex;
};

// Get role display information
const getRoleDisplayInfo = (role) => {
  const roleInfo = {
    [ROLES.ASHA_WORKER]: {
      name: 'ASHA Worker',
      description: 'Community health worker responsible for field visits and health monitoring',
      level: 2,
      color: '#10B981'
    },
    [ROLES.ANGANWADI_WORKER]: {
      name: 'Anganwadi Worker',
      description: 'Childcare center worker responsible for nutrition and early education',
      level: 1,
      color: '#F59E0B'
    },
    [ROLES.ADMIN]: {
      name: 'Administrator',
      description: 'System administrator with full access to all features',
      level: 3,
      color: '#3B82F6'
    },
    [ROLES.SUPER_ADMIN]: {
      name: 'Super Administrator',
      description: 'Super administrator with system-wide access and management capabilities',
      level: 4,
      color: '#8B5CF6'
    }
  };
  
  return roleInfo[role] || {
    name: 'Unknown Role',
    description: 'Role not found',
    level: 0,
    color: '#6B7280'
  };
};

// Export all utilities
module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  isValidRole,
  isValidPermission,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRoleHierarchy,
  canEscalateTo,
  getDashboardAccessRules,
  canAccessDashboard,
  getCrossDashboardPermissions,
  validatePermission,
  getAllPermissionsForRole,
  canManageRole,
  getRoleDisplayInfo
};
