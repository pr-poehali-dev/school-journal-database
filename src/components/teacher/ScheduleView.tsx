import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';

interface ScheduleItem {
  id: number;
  class_id: number;
  subject_id: number;
  subject_name: string;
  day_of_week: number;
  day_name: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
  lesson_topic: string;
  homework: string;
}

interface ClassItem { id: number; name: string; }
interface SubjectItem { id: number; name: string; }

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export default function ScheduleView() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState({ subject_id: '', day_of_week: '1', lesson_number: '1', start_time: '', end_time: '', lesson_topic: '', homework: '' });
  const [newSubjectName, setNewSubjectName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getClasses().then(res => setClasses(Array.isArray(res) ? res : []));
  }, []);

  const loadData = async (classId: number) => {
    setLoading(true);
    setSelectedClass(classId);
    const [sch, subj] = await Promise.all([
      api.getSchedule({ class_id: String(classId) }),
      api.getSubjects(classId),
    ]);
    setSchedule(Array.isArray(sch) ? sch : []);
    setSubjects(Array.isArray(subj) ? subj : []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ subject_id: subjects[0]?.id ? String(subjects[0].id) : '', day_of_week: '1', lesson_number: '1', start_time: '', end_time: '', lesson_topic: '', homework: '' });
    setShowModal(true);
  };

  const openEdit = (s: ScheduleItem) => {
    setEditing(s);
    setForm({ subject_id: String(s.subject_id), day_of_week: String(s.day_of_week), lesson_number: String(s.lesson_number), start_time: s.start_time || '', end_time: s.end_time || '', lesson_topic: s.lesson_topic || '', homework: s.homework || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { class_id: selectedClass, subject_id: Number(form.subject_id), day_of_week: Number(form.day_of_week), lesson_number: Number(form.lesson_number), start_time: form.start_time, end_time: form.end_time, lesson_topic: form.lesson_topic, homework: form.homework };
    if (editing) {
      await api.updateSchedule({ ...data, id: editing.id });
    } else {
      await api.createSchedule(data);
    }
    setSaving(false);
    setShowModal(false);
    if (selectedClass) loadData(selectedClass);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить урок из расписания?')) return;
    await api.deleteSchedule(id);
    if (selectedClass) loadData(selectedClass);
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    setSaving(true);
    await api.createSubject({ name: newSubjectName, class_id: selectedClass });
    setNewSubjectName('');
    setSaving(false);
    setShowSubjectModal(false);
    if (selectedClass) loadData(selectedClass);
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm('Удалить предмет?')) return;
    await api.deleteSubject(id);
    if (selectedClass) loadData(selectedClass);
  };

  const grouped = DAYS.map((day, i) => ({
    day,
    dayNum: i + 1,
    lessons: schedule.filter(s => s.day_of_week === i + 1).sort((a, b) => a.lesson_number - b.lesson_number),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">Расписание</h1>
          <p className="text-sm text-[#888] mt-0.5">Расписание уроков по классам</p>
        </div>
        {selectedClass && (
          <div className="flex gap-2">
            <button onClick={() => setShowSubjectModal(true)} className="flex items-center gap-2 border border-[#e8e8e8] text-[#555] px-4 py-2 rounded-lg text-sm hover:border-[#ccc] transition-colors">
              <Icon name="BookMarked" size={16} />
              Предметы
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors">
              <Icon name="Plus" size={16} />
              Добавить урок
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {classes.map(c => (
          <button key={c.id} onClick={() => loadData(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedClass === c.id ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e8e8e8] text-[#555] hover:border-[#ccc]'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {!selectedClass ? (
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center">
          <Icon name="Calendar" size={32} className="mx-auto text-[#ccc] mb-3" />
          <p className="text-[#888] text-sm">Выберите класс для просмотра расписания</p>
        </div>
      ) : loading ? (
        <div className="text-[#888] text-sm">Загрузка...</div>
      ) : (
        <div className="grid gap-3">
          {grouped.map(g => (
            g.lessons.length > 0 ? (
              <div key={g.dayNum} className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                  <span className="text-sm font-medium text-[#1a1a1a]">{g.day}</span>
                </div>
                {g.lessons.map((lesson, i) => (
                  <div key={lesson.id} className={`flex items-center px-5 py-3.5 ${i > 0 ? 'border-t border-[#f0f0f0]' : ''} hover:bg-[#fafafa] transition-colors`}>
                    <div className="w-8 h-8 bg-[#f5f5f5] rounded-lg flex items-center justify-center mr-4">
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
                      {lesson.homework && (
                        <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                          <Icon name="BookOpen" size={11} />
                          ДЗ: {lesson.homework}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(lesson)} className="p-1.5 text-[#888] hover:text-[#1a1a1a] hover:bg-[#f0f0f0] rounded-lg transition-colors">
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button onClick={() => handleDelete(lesson.id)} className="p-1.5 text-[#888] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null
          ))}
          {schedule.length === 0 && (
            <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center">
              <p className="text-[#888] text-sm">Расписание пустое. Сначала добавьте предметы, затем уроки.</p>
            </div>
          )}
        </div>
      )}

      {/* Add lesson modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Редактировать урок' : 'Добавить урок'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Предмет</label>
            <select value={form.subject_id} onChange={e => setForm(f => ({...f, subject_id: e.target.value}))}
              className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white">
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">День</label>
              <select value={form.day_of_week} onChange={e => setForm(f => ({...f, day_of_week: e.target.value}))}
                className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white">
                {DAYS.map((d, i) => <option key={i+1} value={i+1}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">№ урока</label>
              <input type="number" min="1" max="10" value={form.lesson_number} onChange={e => setForm(f => ({...f, lesson_number: e.target.value}))}
                className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Начало</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({...f, start_time: e.target.value}))}
                className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Конец</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({...f, end_time: e.target.value}))}
                className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Тема урока</label>
            <input value={form.lesson_topic} onChange={e => setForm(f => ({...f, lesson_topic: e.target.value}))}
              className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a]"
              placeholder="Например: Квадратные уравнения" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Домашнее задание</label>
            <textarea value={form.homework} onChange={e => setForm(f => ({...f, homework: e.target.value}))}
              className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] resize-none"
              rows={3}
              placeholder="Что задано на дом..." />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#555] hover:bg-[#f5f5f5] rounded-lg transition-colors">Отмена</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Subjects modal */}
      <Modal open={showSubjectModal} onClose={() => setShowSubjectModal(false)} title="Предметы класса">
        <div className="space-y-3">
          {subjects.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
              <span className="text-sm text-[#1a1a1a]">{s.name}</span>
              <button onClick={() => handleDeleteSubject(s.id)} className="p-1.5 text-[#888] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)}
              className="flex-1 border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
              placeholder="Название предмета" />
            <button onClick={handleAddSubject} disabled={saving} className="px-4 py-2 text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50">
              Добавить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}