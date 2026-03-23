// Role-based access control utilities for Sanitation Worker Dashboard

export const ROLES = {
  SANITATION_WORKER: 'sanitation_worker',
  ANGANWADI_WORKER: 'anganwadi_worker',
  ASHA_WORKER: 'asha_worker',
  ADMIN: 'admin'
};

export const PERMISSIONS = {
  // Waste Management Permissions
  WASTE_LOG_CREATE: 'waste_log_create',
  WASTE_LOG_VIEW: 'waste_log_view',
  WASTE_LOG_EDIT: 'waste_log_edit',
  WASTE_LOG_DELETE: 'waste_log_delete',
  
  // Hygiene Management Permissions
  HYGIENE_CHECKLIST_CREATE: 'hygiene_checklist_create',
  HYGIENE_CHECKLIST_VIEW: 'hygiene_checklist_view',
  HYGIENE_CHECKLIST_EDIT: 'hygiene_checklist_edit',
  HYGIENE_CHECKLIST_DELETE: 'hygiene_checklist_delete',
  
  // Issue Management Permissions
  ISSUE_CREATE: 'issue_create',
  ISSUE_VIEW: 'issue_view',
  ISSUE_EDIT: 'issue_edit',
  ISSUE_DELETE: 'issue_delete',
  ISSUE_ASSIGN: 'issue_assign',
  ISSUE_RESOLVE: 'issue_resolve',
  
  // Verification Permissions
  VERIFICATION_SUBMIT: 'verification_submit',
  VERIFICATION_REVIEW: 'verification_review',
  VERIFICATION_APPROVE: 'verification_approve',
  VERIFICATION_REJECT: 'verification_reject',
  
  // Reports Permissions
  REPORTS_GENERATE: 'reports_generate',
  REPORTS_VIEW: 'reports_view',
  REPORTS_DOWNLOAD: 'reports_download',
  REPORTS_EXPORT: 'reports_export',
  
  // Notifications Permissions
  NOTIFICATIONS_VIEW: 'notifications_view',
  NOTIFICATIONS_MANAGE: 'notifications_manage',
  NOTIFICATIONS_SEND: 'notifications_send',
  
  // Dashboard Permissions
  DASHBOARD_VIEW: 'dashboard_view',
  DASHBOARD_OVERVIEW: 'dashboard_overview',
  
  // System Permissions
  SYSTEM_CONFIG: 'system_config',
  USER_MANAGE: 'user_manage',
  ROLE_MANAGE: 'role_manage'
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.SANITATION_WORKER]: [
    // Waste Management
    PERMISSIONS.WASTE_LOG_CREATE,
    PERMISSIONS.WASTE_LOG_VIEW,
    PERMISSIONS.WASTE_LOG_EDIT,
    
    // Hygiene Management
    PERMISSIONS.HYGIENE_CHECKLIST_CREATE,
    PERMISSIONS.HYGIENE_CHECKLIST_VIEW,
    PERMISSIONS.HYGIENE_CHECKLIST_EDIT,
    
    // Issue Management
    PERMISSIONS.ISSUE_CREATE,
    PERMISSIONS.ISSUE_VIEW,
    PERMISSIONS.ISSUE_EDIT,
    
    // Verification
    PERMISSIONS.VERIFICATION_SUBMIT,
    
    // Reports
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_DOWNLOAD,
    
    // Notifications
    PERMISSIONS.NOTIFICATIONS_VIEW,
    
    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_OVERVIEW
  ],
  
  [ROLES.ANGANWADI_WORKER]: [
    // Waste Management (View Only)
    PERMISSIONS.WASTE_LOG_VIEW,
    
    // Hygiene Management (Full Access)
    PERMISSIONS.HYGIENE_CHECKLIST_CREATE,
    PERMISSIONS.HYGIENE_CHECKLIST_VIEW,
    PERMISSIONS.HYGIENE_CHECKLIST_EDIT,
    PERMISSIONS.HYGIENE_CHECKLIST_DELETE,
    
    // Issue Management (View and Edit)
    PERMISSIONS.ISSUE_VIEW,
    PERMISSIONS.ISSUE_EDIT,
    
    // Verification (Review and Approve)
    PERMISSIONS.VERIFICATION_REVIEW,
    PERMISSIONS.VERIFICATION_APPROVE,
    PERMISSIONS.VERIFICATION_REJECT,
    
    // Reports
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_DOWNLOAD,
    
    // Notifications
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_MANAGE,
    
    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_OVERVIEW
  ],
  
  [ROLES.ASHA_WORKER]: [
    // Limited access - mainly viewing
    PERMISSIONS.WASTE_LOG_VIEW,
    PERMISSIONS.HYGIENE_CHECKLIST_VIEW,
    PERMISSIONS.ISSUE_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW
  ],
  
  [ROLES.ADMIN]: [
    // Full system access
    ...Object.values(PERMISSIONS)
  ]
};

// Permission checking utilities
export const hasPermission = (userRole, permission) => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return userPermissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (userRole, permissions) => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.every(permission => userPermissions.includes(permission));
};

// Route protection utilities
export const canAccessRoute = (userRole, routePermissions) => {
  if (!routePermissions || routePermissions.length === 0) {
    return true; // Public route
  }
  return hasAnyPermission(userRole, routePermissions);
};

// Component permission checking
export const withPermission = (WrappedComponent, requiredPermissions) => {
  return (props) => {
    const { userRole } = props;
    
    if (!hasAnyPermission(userRole, requiredPermissions)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this feature.</p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Sanitation Worker specific permission checks
export const canLogWaste = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.WASTE_LOG_CREATE);
};

export const canCreateChecklist = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.HYGIENE_CHECKLIST_CREATE);
};

export const canReportIssues = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.ISSUE_CREATE);
};

export const canVerifyLogs = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.VERIFICATION_REVIEW);
};

export const canGenerateReports = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.REPORTS_GENERATE);
};

export const canManageNotifications = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.NOTIFICATIONS_MANAGE);
};

// Feature access control for Sanitation Worker Dashboard
export const SANITATION_DASHBOARD_FEATURES = {
  overview: {
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
    roles: [ROLES.SANITATION_WORKER, ROLES.ANGANWADI_WORKER, ROLES.ASHA_WORKER, ROLES.ADMIN]
  },
  wasteLogging: {
    permissions: [PERMISSIONS.WASTE_LOG_CREATE],
    roles: [ROLES.SANITATION_WORKER, ROLES.ADMIN]
  },
  hygieneChecklist: {
    permissions: [PERMISSIONS.HYGIENE_CHECKLIST_CREATE],
    roles: [ROLES.SANITATION_WORKER, ROLES.ANGANWADI_WORKER, ROLES.ADMIN]
  },
  issueReporting: {
    permissions: [PERMISSIONS.ISSUE_CREATE],
    roles: [ROLES.SANITATION_WORKER, ROLES.ANGANWADI_WORKER, ROLES.ADMIN]
  },
  reports: {
    permissions: [PERMISSIONS.REPORTS_VIEW],
    roles: [ROLES.SANITATION_WORKER, ROLES.ANGANWADI_WORKER, ROLES.ASHA_WORKER, ROLES.ADMIN]
  },
  activities: {
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
    roles: [ROLES.SANITATION_WORKER, ROLES.ANGANWADI_WORKER, ROLES.ASHA_WORKER, ROLES.ADMIN]
  },
  notifications: {
    permissions: [PERMISSIONS.NOTIFICATIONS_VIEW],
    roles: [ROLES.SANITATION_WORKER, ROLES.ANGANWADI_WORKER, ROLES.ASHA_WORKER, ROLES.ADMIN]
  }
};

// Check if user can access specific dashboard feature
export const canAccessDashboardFeature = (userRole, feature) => {
  const featureConfig = SANITATION_DASHBOARD_FEATURES[feature];
  if (!featureConfig) return false;
  
  return featureConfig.roles.includes(userRole) && 
         hasAnyPermission(userRole, featureConfig.permissions);
};

// Get accessible features for a role
export const getAccessibleFeatures = (userRole) => {
  return Object.keys(SANITATION_DASHBOARD_FEATURES).filter(feature => 
    canAccessDashboardFeature(userRole, feature)
  );
};

// Data access control - what data can a role see
export const DATA_ACCESS_CONTROL = {
  [ROLES.SANITATION_WORKER]: {
    wasteLogs: 'own', // Can only see their own logs
    checklists: 'own', // Can only see their own checklists
    issues: 'own', // Can only see issues they reported
    reports: 'own', // Can only see their own reports
    notifications: 'own' // Can only see their own notifications
  },
  [ROLES.ANGANWADI_WORKER]: {
    wasteLogs: 'center', // Can see all logs for their center
    checklists: 'center', // Can see all checklists for their center
    issues: 'center', // Can see all issues for their center
    reports: 'center', // Can see all reports for their center
    notifications: 'center' // Can see center-wide notifications
  },
  [ROLES.ASHA_WORKER]: {
    wasteLogs: 'view', // Read-only access
    checklists: 'view', // Read-only access
    issues: 'view', // Read-only access
    reports: 'view', // Read-only access
    notifications: 'view' // Read-only access
  },
  [ROLES.ADMIN]: {
    wasteLogs: 'all', // Can see all logs
    checklists: 'all', // Can see all checklists
    issues: 'all', // Can see all issues
    reports: 'all', // Can see all reports
    notifications: 'all' // Can see all notifications
  }
};

// Check data access level for a role
export const getDataAccessLevel = (userRole, dataType) => {
  return DATA_ACCESS_CONTROL[userRole]?.[dataType] || 'none';
};

// Export default for easy importing
export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  withPermission,
  canLogWaste,
  canCreateChecklist,
  canReportIssues,
  canVerifyLogs,
  canGenerateReports,
  canManageNotifications,
  SANITATION_DASHBOARD_FEATURES,
  canAccessDashboardFeature,
  getAccessibleFeatures,
  DATA_ACCESS_CONTROL,
  getDataAccessLevel
};
