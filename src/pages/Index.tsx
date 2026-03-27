import { useState, useEffect } from 'react';
import { getUser, saveUser, logout, type User } from '@/lib/auth';
import LoginPage from '@/components/LoginPage';
import TeacherDashboard from '@/components/TeacherDashboard';
import StudentDashboard from '@/components/StudentDashboard';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogin = (u: User) => {
    saveUser(u);
    setUser(u);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;
  if (user.role === 'teacher') return <TeacherDashboard user={user} onLogout={handleLogout} />;
  return <StudentDashboard user={user} onLogout={handleLogout} />;
}
