import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';

interface Student {
  id: number;
  login: string;
  full_name: string;
  role: string;
}

interface ClassItem {
  id: number;
  name: string;
}

export default function StudentsView() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ login: '', password: '', full_name: '', role: 'student' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getClasses().then(res => setClasses(Array.isArray(res) ? res : []));
  }, []);

  const loadStudents = async (classId: number) => {
    setLoading(true);
    setSelectedClass(classId);
    const res = await api.getUsers({ class_id: String(classId) });
    setStudents(Array.isArray(res) ? res : []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ login: '22', password: '', full_name: '', role: 'student' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({ login: s.login, password: '', full_name: s.full_name, role: s.role });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Введите ФИО'); return; }
    if (!editing && !form.password.trim()) { setError('Введите пароль'); return; }
    if (!editing && !form.login.trim()) { setError('Введите логин'); return; }
    setSaving(true);
    setError('');
    let res;
    if (editing) {
      res = await api.updateUser({ id: editing.id, full_name: form.full_name, password: form.password });
    } else {
      res = await api.createUser({ login: form.login, password: form.password, full_name: form.full_name, role: form.role, class_id: selectedClass });
    }
    if (res?.error) { setError(res.error); setSaving(false); return; }
    setSaving(false);
    setShowModal(false);
    if (selectedClass) loadStudents(selectedClass);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить ученика из класса?')) return;
    await api.deleteUser(id, selectedClass || undefined);
    if (selectedClass) loadStudents(selectedClass);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">Ученики</h1>
          <p className="text-sm text-[#888] mt-0.5">Управление учениками классов</p>
        </div>
        {selectedClass && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
          >
            <Icon name="Plus" size={16} />
            Добавить ученика
          </button>
        )}
      </div>

      {/* Class selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {classes.map(c => (
          <button
            key={c.id}
            onClick={() => loadStudents(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedClass === c.id ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e8e8e8] text-[#555] hover:border-[#ccc]'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {!selectedClass ? (
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center">
          <Icon name="Users" size={32} className="mx-auto text-[#ccc] mb-3" />
          <p className="text-[#888] text-sm">Выберите класс для просмотра учеников</p>
        </div>
      ) : loading ? (
        <div className="text-[#888] text-sm">Загрузка...</div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center">
          <p className="text-[#888] text-sm">В этом классе нет учеников</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e8e8]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#888] uppercase tracking-wide">ФИО</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#888] uppercase tracking-wide">Логин</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#888] uppercase tracking-wide">Роль</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className={`${i > 0 ? 'border-t border-[#f0f0f0]' : ''} hover:bg-[#fafafa] transition-colors`}>
                  <td className="px-5 py-3.5 text-sm text-[#1a1a1a] font-medium">{s.full_name}</td>
                  <td className="px-5 py-3.5 text-sm text-[#666]">@{s.login}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-md ${s.role === 'teacher' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                      {s.role === 'teacher' ? 'Учитель' : 'Ученик'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-[#888] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] rounded-lg transition-colors">
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-[#888] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Редактировать пользователя' : 'Добавить пользователя'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">ФИО</label>
            <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))}
              className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors"
              placeholder="Иванов Иван Иванович" />
          </div>
          {!editing && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Роль</label>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
                  className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white">
                  <option value="student">Ученик</option>
                  <option value="teacher">Учитель</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Логин (начинается с 22)</label>
                <input value={form.login} onChange={e => setForm(f => ({...f, login: e.target.value}))}
                  className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors"
                  placeholder="22..." />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">
              {editing ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
            </label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
              className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors"
              placeholder="Пароль" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#555] hover:bg-[#f5f5f5] rounded-lg transition-colors">Отмена</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
