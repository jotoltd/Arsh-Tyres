const ADMIN_KEY = 'arsh_admin_auth';
const ADMIN_USER_KEY = 'arsh_admin_user';

export type AdminRole = 'admin' | 'staff';

export type AdminPermission =
  | 'dashboard'
  | 'inventory'
  | 'bookings'
  | 'customers'
  | 'promos'
  | 'schedule'
  | 'staff'
  | 'reports'
  | 'settings';

export interface AdminUser {
  username: string;
  password: string;
  name: string;
  role: AdminRole;
  email: string;
  permissions: AdminPermission[];
}

export const ALL_PERMISSIONS: AdminPermission[] = [
  'dashboard', 'inventory', 'bookings', 'customers', 'promos', 'schedule', 'staff', 'reports', 'settings'
];

export const STAFF_USERS: AdminUser[] = [
  {
    username: 'Josh',
    password: 'R1l3yj014!',
    name: 'Josh',
    role: 'admin',
    email: '',
    permissions: ALL_PERMISSIONS,
  },
  {
    username: 'Arash',
    password: 'Payamminab123@',
    name: 'Arash',
    role: 'admin',
    email: 'arshtyres25@gmail.com',
    permissions: ALL_PERMISSIONS,
  },
];

export function isAdminAuthed(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function getCurrentAdminUser(): AdminUser | null {
  const username = sessionStorage.getItem(ADMIN_USER_KEY);
  if (!username) return null;
  return STAFF_USERS.find(u => u.username === username) ?? null;
}

export function adminLogin(username: string, password: string): boolean {
  const user = STAFF_USERS.find(u => u.username === username && u.password === password);
  if (user) {
    sessionStorage.setItem(ADMIN_KEY, 'true');
    sessionStorage.setItem(ADMIN_USER_KEY, user.username);
    return true;
  }
  return false;
}

export function adminLogout() {
  sessionStorage.removeItem(ADMIN_KEY);
  sessionStorage.removeItem(ADMIN_USER_KEY);
}

export function hasPermission(permission: AdminPermission): boolean {
  const user = getCurrentAdminUser();
  if (!user) return false;
  return user.permissions.includes(permission);
}

