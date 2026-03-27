import { useState, useEffect } from 'react';
import { type User } from '@/lib/auth';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  user: User;
  onLogout: () => void;
}

interface ScheduleItem {
  id: number;
  subject_name: string;
  day_of_week: number;
  day_name: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
  lesson_topic: string;
}

interface Grade {
  id: number;
  subject_id: number;
  subject_name: string;
  grade: number;
  note: string;
  grade_date: string;
}

interface Avg {
  subject_name: string;
  avg: number;
}

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const GRADE_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-blue-100 text-blue-700',
  5: 'bg-green-100 text-green-700',
};

type Tab = 'schedule' | 'grades';

export default function StudentDashboard({ user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('schedule');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [averages, setAverages] = useState<Record<number, Avg>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const [sch, gr] = await Promise.all([
        api.getSchedule({ student_id: String(user.id) }),
        api.getGrades({ student_id: String(user.id) }),
      ]);
      setSchedule(Array.isArray(sch) ? sch : []);
      setGrades(gr?.grades || []);
      setAverages(gr?.averages || {});
      setLoading(false);
    };
    loadAll();
  }, [user.id]);

  const grouped = DAYS.map((day, i) => ({
    day,
    dayNum: i + 1,
    lessons: schedule.filter(s => s.day_of_week === i + 1).sort((a, b) => a.lesson_number - b.lesson_number),
  }));

  const gradesBySubject: Record<string, Grade[]> = {};
  grades.forEach(g => {
    const key = g.subject_name;
    if (!gradesBySubject[key]) gradesBySubject[key] = [];
    gradesBySubject[key].push(g);
  });

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e8e8] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Ж</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">{user.full_name}</p>
              <p className="text-xs text-[#888]">Ученик · @{user.login}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-sm text-[#888] hover:text-[#1a1a1a] transition-colors">
            <Icon name="LogOut" size={16} />
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          {(['schedule', 'grades'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-[#1a1a1a] text-[#1a1a1a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
              {t === 'schedule' ? 'Расписание' : 'Оценки'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-[#888] text-sm">Загрузка...</div>
        ) : tab === 'schedule' ? (
          <div className="space-y-3">
            {grouped.every(g => g.lessons.length === 0) ? (
              <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center">
                <Icon name="Calendar" size={32} className="mx-auto text-[#ccc] mb-3" />
                <p className="text-[#888] text-sm">Расписание не добавлено</p>
              </div>
            ) : grouped.map(g => g.lessons.length > 0 ? (
              <div key={g.dayNum} className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                  <span className="text-sm font-medium text-[#1a1a1a]">{g.day}</span>
                </div>
                {g.lessons.map((lesson, i) => (
                  <div key={lesson.id} className={`flex items-center px-5 py-3.5 ${i > 0 ? 'border-t border-[#f0f0f0]' : ''}`}>
                    <div className="w-8 h-8 bg-[#f5f5f5] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-xs font-semibold text-[#666]">{lesson.lesson_number}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1a1a1a]">{lesson.subject_name}</p>
                      {lesson.lesson_topic && (
                        <p className="text-xs text-[#555] mt-0.5">{lesson.lesson_topic}</p>
                      )}
                      {lesson.start_time && (
                        <p className="text-xs text-[#aaa] mt-0.5">{lesson.start_time}{lesson.end_time ? ` — ${lesson.end_time}` : ''}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null)}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.keys(gradesBySubject).length === 0 ? (
              <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center">
                <Icon name="BookOpen" size={32} className="mx-auto text-[#ccc] mb-3" />
                <p className="text-[#888] text-sm">Оценок пока нет</p>
              </div>
            ) : Object.entries(gradesBySubject).map(([subjectName, subjectGrades]) => {
              const subjectId = subjectGrades[0].subject_id;
              const average = averages[subjectId];
              return (
                <div key={subjectName} className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#f0f0f0] flex items-center justify-between bg-[#fafafa]">
                    <span className="text-sm font-medium text-[#1a1a1a]">{subjectName}</span>
                    {average && (
                      <span className="text-xs font-medium px-2.5 py-1 bg-[#1a1a1a] text-white rounded-lg">
                        ср. {average.avg}
                      </span>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {subjectGrades.map(g => (
                        <div key={g.id} className="group relative">
                          <span className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-lg ${GRADE_COLORS[g.grade]}`}>
                            {g.grade}
                          </span>
                          {(g.note || g.grade_date) && (
                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
                              <div className="bg-white border border-[#e8e8e8] rounded-lg px-3 py-2 shadow-lg min-w-[130px]">
                                {g.grade_date && <p className="text-xs text-[#888]">{g.grade_date}</p>}
                                {g.note && <p className="text-xs text-[#555] mt-0.5">{g.note}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}