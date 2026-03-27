import { useState } from 'react';
import { type User } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import ClassesView from '@/components/teacher/ClassesView';
import ScheduleView from '@/components/teacher/ScheduleView';
import GradesView from '@/components/teacher/GradesView';
import StudentsView from '@/components/teacher/StudentsView';

interface Props {
  user: User;
  onLogout: () => void;
}

type Tab = 'classes' | 'schedule' | 'grades' | 'students';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'classes', label: 'Классы', icon: 'School' },
  { id: 'students', label: 'Ученики', icon: 'Users' },
  { id: 'schedule', label: 'Расписание', icon: 'Calendar' },
  { id: 'grades', label: 'Журнал', icon: 'BookOpen' },
];

export default function TeacherDashboard({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('classes');

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-[#e8e8e8] flex flex-col fixed h-full">
        <div className="px-6 py-6 border-b border-[#e8e8e8]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Ж</span>
            </div>
            <span className="font-semibold text-[#1a1a1a] text-sm">Журнал</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-[#555] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#e8e8e8]">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-[#888]">Учитель</p>
            <p className="text-sm font-medium text-[#1a1a1a] truncate">{user.full_name}</p>
            <p className="text-xs text-[#aaa]">@{user.login}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#888] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-colors"
          >
            <Icon name="LogOut" size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        {activeTab === 'classes' && <ClassesView />}
        {activeTab === 'students' && <StudentsView />}
        {activeTab === 'schedule' && <ScheduleView />}
        {activeTab === 'grades' && <GradesView />}
      </main>
    </div>
  );
}