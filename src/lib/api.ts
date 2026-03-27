const URLS = {
  auth: 'https://functions.poehali.dev/d61e1289-9b62-4fd6-b87d-1677526ae3a0',
  classes: 'https://functions.poehali.dev/b7a52bdc-afef-4fa0-acf1-9834d8ae649a',
  schedule: 'https://functions.poehali.dev/3a914bc0-025c-4dfa-bb3d-f493a5fd2ede',
  grades: 'https://functions.poehali.dev/6a138c47-8252-46bf-8a35-6c5ef4443060',
};

async function req(url: string, method = 'GET', body?: object, params?: Record<string, string>) {
  const u = new URL(url);
  if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetch(u.toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  // Auth / Users
  login: (login: string, password: string) =>
    req(URLS.auth, 'POST', { login, password, action: 'login' }),
  getUsers: (params?: Record<string, string>) =>
    req(URLS.auth, 'GET', undefined, params),
  createUser: (data: object) =>
    req(URLS.auth, 'POST', { ...data, action: 'create' }),
  updateUser: (data: object) =>
    req(URLS.auth, 'PUT', data),
  deleteUser: (id: number, class_id?: number) =>
    req(URLS.auth, 'DELETE', { id, class_id }),

  // Classes
  getClasses: () =>
    req(URLS.classes, 'GET'),
  createClass: (data: object) =>
    req(URLS.classes, 'POST', data),
  updateClass: (data: object) =>
    req(URLS.classes, 'PUT', data),
  deleteClass: (id: number) =>
    req(URLS.classes, 'DELETE', { id }),

  // Subjects
  getSubjects: (class_id?: number) =>
    req(URLS.classes, 'GET', undefined, class_id ? { entity: 'subject', class_id: String(class_id) } : { entity: 'subject' }),
  createSubject: (data: object) =>
    req(URLS.classes, 'POST', { ...data, entity: 'subject' }),
  updateSubject: (data: object) =>
    req(URLS.classes, 'PUT', { ...data, entity: 'subject' }),
  deleteSubject: (id: number) =>
    req(URLS.classes, 'DELETE', { id, entity: 'subject' }),

  // Schedule
  getSchedule: (params?: Record<string, string>) =>
    req(URLS.schedule, 'GET', undefined, params),
  createSchedule: (data: object) =>
    req(URLS.schedule, 'POST', data),
  updateSchedule: (data: object) =>
    req(URLS.schedule, 'PUT', data),
  deleteSchedule: (id: number) =>
    req(URLS.schedule, 'DELETE', { id }),

  // Grades
  getGrades: (params?: Record<string, string>) =>
    req(URLS.grades, 'GET', undefined, params),
  createGrade: (data: object) =>
    req(URLS.grades, 'POST', data),
  updateGrade: (data: object) =>
    req(URLS.grades, 'PUT', data),
  deleteGrade: (id: number) =>
    req(URLS.grades, 'DELETE', { id }),
};
