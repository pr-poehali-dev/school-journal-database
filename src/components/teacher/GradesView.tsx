import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';

interface ClassItem { id: number; name: string; }
interface SubjectItem { id: number; name: string; }
interface Student { id: number; full_name: string; login: string; }
interface Grade {
  id: number;
  student_id: number;
  student_name: string;
  subject_id: number;
  subject_name: string;
  grade: number;
  note: string;
  grade_date: string;
}

const GRADE_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-blue-100 text-blue-700',
  5: 'bg-green-100 text-green-700',
};

export default function GradesView() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [gradesByStudent, setGradesByStudent] = useState<Record<number, Grade[]>>({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editGrade, setEditGrade] = useState<Grade | null>(null);
  const [gradeForm, setGradeForm] = useState({ student_id: '', grade: '5', note: '', grade_date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getClasses().then(res => setClasses(Array.isArray(res) ? res : []));
  }, []);

  const selectClass = async (classId: number) => {
    setSelectedClass(classId);
    setSelectedSubject(null);
    setGradesByStudent({});
    const [subj, stud] = await Promise.all([
      api.getSubjects(classId),
      api.getUsers({ class_id: String(classId) }),
    ]);
    setSubjects(Array.isArray(subj) ? subj : []);
    setStudents(Array.isArray(stud) ? stud : []);
  };

  const selectSubject = async (subject: SubjectItem) => {
    setSelectedSubject(subject);
    setLoading(true);
    const res = await api.getGrades({ subject_id: String(subject.id) });
    const grades: Grade[] = res?.grades || [];
    const byStudent: Record<number, Grade[]> = {};
    grades.forEach(g => {
      if (!byStudent[g.student_id]) byStudent[g.student_id] = [];
      byStudent[g.student_id].push(g);
    });
    setGradesByStudent(byStudent);
    setLoading(false);
  };

  const openAddGrade = (studentId: number) => {
    setEditGrade(null);
    setGradeForm({ student_id: String(studentId), grade: '5', note: '', grade_date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const openEditGrade = (g: Grade) => {
    setEditGrade(g);
    setGradeForm({ student_id: String(g.student_id), grade: String(g.grade), note: g.note || '', grade_date: g.grade_date });
    setShowModal(true);
  };

  const handleSaveGrade = async () => {
    setSaving(true);
    if (editGrade) {
      await api.updateGrade({ id: editGrade.id, grade: Number(gradeForm.grade), note: gradeForm.note, grade_date: gradeForm.grade_date });
    } else {
      await api.createGrade({ student_id: Number(gradeForm.student_id), subject_id: selectedSubject?.id, grade: Number(gradeForm.grade), note: gradeForm.note, grade_date: gradeForm.grade_date });
    }
    setSaving(false);
    setShowModal(false);
    if (selectedSubject) selectSubject(selectedSubject);
  };

  const handleDeleteGrade = async (id: number) => {
    if (!confirm('Удалить оценку?')) return;
    await api.deleteGrade(id);
    if (selectedSubject) selectSubject(selectedSubject);
  };

  const avg = (grades: Grade[]) => {
    if (!grades.length) return null;
    return (grades.reduce((s, g) => s + g.grade, 0) / grades.length).toFixed(2);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">Журнал оценок</h1>
          <p className="text-sm text-[#888] mt-0.5">Выставление и просмотр оценок</p>
        </div>
      </div>

      {/* Class selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {classes.map(c => (
          <button key={c.id} onClick={() => selectClass(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedClass === c.id ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e8e8e8] text-[#555] hover:border-[#ccc]'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Subject selector */}
      {selectedClass && subjects.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {subjects.map(s => (
            <button key={s.id} onClick={() => selectSubject(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedSubject?.id === s.id ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e8e8e8] text-[#555] hover:border-[#ccc]'}`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {!selectedClass ? (
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center">
          <Icon name="BookOpen" size={32} className="mx-auto text-[#ccc] mb-3" />
          <p className="text-[#888] text-sm">Выберите класс и предмет</p>
        </div>
      ) : !selectedSubject ? (
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center">
          <p className="text-[#888] text-sm">Выберите предмет для просмотра оценок</p>
        </div>
      ) : loading ? (
        <div className="text-[#888] text-sm">Загрузка...</div>
      ) : (
        <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e8e8e8] bg-[#fafafa]">
            <h2 className="text-sm font-medium text-[#1a1a1a]">{selectedSubject.name}</h2>
          </div>
          {students.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#888]">В классе нет учеников</div>
          ) : (
            students.map((student, i) => {
              const grades = gradesByStudent[student.id] || [];
              const average = avg(grades);
              return (
                <div key={student.id} className={`${i > 0 ? 'border-t border-[#f0f0f0]' : ''}`}>
                  <div className="flex items-center px-5 py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#1a1a1a]">{student.full_name}</span>
                        {average && (
                          <span className="text-xs px-2 py-0.5 bg-[#f0f0f0] text-[#555] rounded-md">
                            ср. {average}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {grades.map(g => (
                          <div key={g.id} className="group relative">
                            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer ${GRADE_COLORS[g.grade]}`}>
                              {g.grade}
                            </span>
                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex items-center gap-1 z-10">
                              <div className="bg-white border border-[#e8e8e8] rounded-lg px-3 py-2 shadow-lg min-w-[120px]">
                                <p className="text-xs text-[#888] mb-1">{g.grade_date}</p>
                                {g.note && <p className="text-xs text-[#555]">{g.note}</p>}
                                <div className="flex gap-1 mt-1.5">
                                  <button onClick={() => openEditGrade(g)} className="text-xs text-blue-600 hover:underline">Изм.</button>
                                  <button onClick={() => handleDeleteGrade(g.id)} className="text-xs text-red-500 hover:underline">Удал.</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => openAddGrade(student.id)}
                          className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg border border-dashed border-[#ccc] text-[#888] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors">
                          <Icon name="Plus" size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editGrade ? 'Редактировать оценку' : 'Выставить оценку'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Оценка</label>
              <select value={gradeForm.grade} onChange={e => setGradeForm(f => ({...f, grade: e.target.value}))}
                className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white">
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Дата</label>
              <input type="date" value={gradeForm.grade_date} onChange={e => setGradeForm(f => ({...f, grade_date: e.target.value}))}
                className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Примечание</label>
            <input value={gradeForm.note} onChange={e => setGradeForm(f => ({...f, note: e.target.value}))}
              className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a]"
              placeholder="Контрольная работа, диктант и т.д." />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#555] hover:bg-[#f5f5f5] rounded-lg transition-colors">Отмена</button>
            <button onClick={handleSaveGrade} disabled={saving} className="px-4 py-2 text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
