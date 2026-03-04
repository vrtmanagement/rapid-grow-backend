const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  TEAM_LEAD: "TEAM_LEAD",
  EMPLOYEE: "EMPLOYEE",
};

const CREATION_MATRIX = {
  [ROLES.SUPER_ADMIN]: [ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE],
  [ROLES.ADMIN]: [ROLES.TEAM_LEAD, ROLES.EMPLOYEE],
  [ROLES.TEAM_LEAD]: [ROLES.EMPLOYEE],
  [ROLES.EMPLOYEE]: [],
};

function canCreateRole(creatorRole, targetRole) {
  const allowed = CREATION_MATRIX[creatorRole] || [];
  return allowed.includes(targetRole);
}

module.exports = {
  ROLES,
  canCreateRole,
};
