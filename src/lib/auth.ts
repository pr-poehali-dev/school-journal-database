export interface User {
  id: number;
  login: string;
  role: 'teacher' | 'student';
  full_name: string;
}

const KEY = 'journal_user';

export function saveUser(user: User) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(KEY);
}
