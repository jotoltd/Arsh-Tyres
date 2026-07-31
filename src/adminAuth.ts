const ADMIN_KEY = 'arsh_admin_auth';
const ADMIN_USER = 'Josh';
const ADMIN_PASS = 'R1l3yj014!';

export function isAdminAuthed(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    sessionStorage.setItem(ADMIN_KEY, 'true');
    return true;
  }
  return false;
}

export function adminLogout() {
  sessionStorage.removeItem(ADMIN_KEY);
}
