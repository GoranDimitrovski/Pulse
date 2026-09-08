export const ROLES = ['owner', 'admin', 'member'] as const;
export type Role = (typeof ROLES)[number];

const ROLE_RANK: Record<Role, number> = {
  member: 0,
  admin: 1,
  owner: 2,
};

/** True when `actual` grants at least the privileges of `required`. */
export function roleAtLeast(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}
