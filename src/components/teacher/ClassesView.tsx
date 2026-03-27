import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';

interface ClassItem {
  id: number;
  name: string;
  teacher_name: string;
  student_count: number;
}

export default function ClassesView() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.getClasses();
    setClasses(Array.isArray(res) ? res : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: ClassItem) => {
    setEditing(c);
    setName(c.name);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Введите название класса'); return; }
    setSaving(true);
    if (editing) {
      await api.updateClass({ id: editing.id, name });
    } else {
      await api.createClass({ name });
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить класс? Все данные класса будут архивированы.')) return;
    await api.deleteClass(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">Классы</h1>
          <p className="text-sm text-[#888] mt-0.5">Управление классами школы</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
        >
          <Icon name="Plus" size={16} />
          Добавить класс
        </button>
      </div>

      {loading ? (
        <div className="text-[#888] text-sm">Загрузка...</div>
      ) : classes.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center">
          <Icon name="School" size={32} className="mx-auto text-[#ccc] mb-3" />
          <p className="text-[#888] text-sm">Нет классов. Создайте первый.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {classes.map(c => (
            <div key={c.id} className="bg-white border border-[#e8e8e8] rounded-xl px-6 py-4 flex items-center justify-between hover:border-[#ccc] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#f5f5f5] rounded-lg flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#1a1a1a]">{c.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">{c.name}</p>
                  <p className="text-xs text-[#888]">{c.student_count} учеников</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(c)} className="p-2 text-[#888] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] rounded-lg transition-colors">
                  <Icon name="Pencil" size={15} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-2 text-[#888] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Редактировать класс' : 'Новый класс'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Название класса</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors"
              placeholder="Например: 10А"
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
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
