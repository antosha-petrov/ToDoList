import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Calendar, 
  Plus, 
  Flag,
  MessageSquare,
  CalendarPlus,
  ListTodo,
  X,
  Sun,
  Moon,
  Clock
} from 'lucide-react';
import { cn } from './lib/utils';

type Priority = 'low' | 'medium' | 'high';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  priority: Priority;
  dueDate: string;
  createdAt: number;
  subtasks?: Subtask[];
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'text-[#ef4444] bg-[#ef4444]/10 border-transparent',
  medium: 'text-[#f59e0b] bg-[#f59e0b]/10 border-transparent',
  low: 'text-[#22c55e] bg-[#22c55e]/10 border-transparent',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('tasks-v1');
      if (savedTasks) {
        return JSON.parse(savedTasks);
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
    return [];
  });

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [error, setError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [addingSubtaskToId, setAddingSubtaskToId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isTimeFocused, setIsTimeFocused] = useState(false);
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme-v1') as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme-v1', theme);
  }, [theme]);

  const addSubtask = (taskId: string, title: string) => {
    if (!title.trim()) return;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: [...(t.subtasks || []), { id: crypto.randomUUID(), title: title.trim(), completed: false }]
        };
      }
      return t;
    }));
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        };
      }
      return t;
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.filter(st => st.id !== subtaskId)
        };
      }
      return t;
    }));
  };

  const downloadICS = (task: Task) => {
    if (!task.dueDate) return;
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 час
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const escapeText = (text: string) => {
       return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI Studio//Task Planner//RU',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${escapeText(task.title)}`,
      `DESCRIPTION:${escapeText(task.notes || '')}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${task.title.substring(0, 20)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    localStorage.setItem('tasks-v1', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Пожалуйста, введите название задачи.');
      return;
    }

    let finalDueDate = '';
    if (dateInput || timeInput) {
      const d = dateInput || new Date().toISOString().split('T')[0];
      const t = timeInput || '12:00';
      finalDueDate = new Date(`${d}T${t}:00`).toISOString();
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      priority,
      dueDate: finalDueDate,
      createdAt: Date.now(),
      subtasks: [],
    };

    setTasks((prev) => [newTask, ...prev]);
    setTitle('');
    setDateInput('');
    setTimeInput('');
    setPriority('medium');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  // Sort: Incomplete first -> by priority (high > med > low) -> by due date -> by creation
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1; 
    }
    const weights = { high: 3, medium: 2, low: 1 };
    if (weights[a.priority] !== weights[b.priority]) {
      return weights[b.priority] - weights[a.priority];
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    return b.createdAt - a.createdAt;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ru-RU', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#07090c] text-slate-800 dark:text-[#e2e8f0] font-sans p-4 sm:p-8 selection:bg-indigo-500/30 selection:text-indigo-700 dark:selection:text-indigo-200 relative overflow-hidden transition-colors duration-500" style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}>
        {/* Decorative blurry backgrounds */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-400/30 dark:bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none transition-colors duration-500" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-400/30 dark:bg-purple-600/10 blur-[100px] rounded-full pointer-events-none transition-colors duration-500" />

        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          
          {/* Header */}
          <header className="text-center pt-8 pb-2 relative">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-[#8193b2] drop-shadow-sm transition-colors duration-500">
              Планировщик
            </h1>
            <p className="mt-5 text-lg text-slate-500 dark:text-[#94a3b8] font-medium max-w-xl mx-auto leading-relaxed transition-colors duration-500">
              Организуйте свои дела, <span className="text-indigo-600 dark:text-indigo-400">расставляйте приоритеты</span> и следите за дедлайнами в воздушном интерфейсе.
            </p>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              type="button"
              className="absolute right-0 top-6 sm:top-10 p-3 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-300 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm z-50 cursor-pointer active:scale-95"
              title={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </header>

          {/* Add Task Form */}
          <section className="bg-white/70 dark:bg-[#13161c]/80 backdrop-blur-2xl rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 sm:p-8 transition-all shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/40 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <form onSubmit={addTask} className="space-y-6 relative z-10">
              <div>
                <label htmlFor="title" className="block text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-[#64748b] mb-2.5 ml-1 transition-colors duration-500">
                  Название задачи <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Что нужно сделать?"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 dark:bg-[#0a0c10]/80 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-[#334155] text-slate-800 dark:text-[#f8fafc] shadow-inner text-[1.05rem]"
                  autoFocus
                />
                {error && <p className="text-[#ef4444] text-sm mt-2 ml-1 font-medium">{error}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="priority" className="block text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-[#64748b] mb-2.5 ml-1 transition-colors duration-500">
                    Приоритет
                  </label>
                  <div className="relative">
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full px-5 py-3.5 pl-12 bg-slate-50 border border-slate-200 dark:bg-[#0a0c10]/80 dark:border-white/5 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-slate-800 dark:text-[#f8fafc] shadow-inner text-[1.05rem]"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                    <Flag className={cn(
                      "absolute left-4 top-[14px] h-[1.125rem] w-[1.125rem] pointer-events-none transition-colors",
                      priority === 'high' ? 'text-[#ef4444]' : priority === 'medium' ? 'text-[#f59e0b]' : 'text-[#22c55e]'
                    )} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-[#64748b] mb-2.5 ml-1 transition-colors duration-500">
                    Дедлайн (опционально)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        id="dateInput"
                        type={isDateFocused || dateInput ? "date" : "text"}
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        onFocus={() => setIsDateFocused(true)}
                        onBlur={() => setIsDateFocused(false)}
                        placeholder="Дата"
                        className="w-full px-3 py-3.5 pl-10 bg-slate-50 border border-slate-200 dark:bg-[#0a0c10]/80 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-slate-800 dark:text-[#f8fafc] shadow-inner [&::-webkit-calendar-picker-indicator]:opacity-50 dark:[&::-webkit-calendar-picker-indicator]:invert-[0.8] text-[1.05rem] sm:text-[0.95rem] placeholder:text-slate-400 dark:placeholder:text-[#334155]"
                        title="Дата"
                      />
                      <Calendar className="absolute left-3.5 top-[14px] h-5 w-5 text-slate-400 dark:text-[#475569] pointer-events-none" />
                    </div>
                    <div className="relative">
                      <input
                        id="timeInput"
                        type={isTimeFocused || timeInput ? "time" : "text"}
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        onFocus={() => setIsTimeFocused(true)}
                        onBlur={() => setIsTimeFocused(false)}
                        placeholder="Время"
                        className="w-full px-3 py-3.5 pl-10 bg-slate-50 border border-slate-200 dark:bg-[#0a0c10]/80 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-slate-800 dark:text-[#f8fafc] shadow-inner [&::-webkit-calendar-picker-indicator]:opacity-50 dark:[&::-webkit-calendar-picker-indicator]:invert-[0.8] text-[1.05rem] sm:text-[0.95rem] placeholder:text-slate-400 dark:placeholder:text-[#334155]"
                        title="Время"
                      />
                      <Clock className="absolute left-3.5 top-[14px] h-5 w-5 text-slate-400 dark:text-[#475569] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto ml-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3.5 px-8 rounded-full transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-indigo-500/25"
              >
                <Plus className="h-5 w-5" />
                Добавить задачу
              </button>
            </form>
          </section>

        {/* Filters */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2.5 text-sm font-semibold transition-all flex items-center gap-2.5 rounded-full border",
                filter === f 
                  ? "bg-white dark:bg-[#1e222a] text-indigo-700 dark:text-[#f8fafc] border-indigo-200 dark:border-indigo-500/30 shadow-lg shadow-indigo-100 dark:shadow-indigo-500/10" 
                  : "bg-slate-100 dark:bg-[#13161c]/50 text-slate-500 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-[#1e222a] border-transparent hover:border-slate-300 dark:hover:border-white/5 hover:text-slate-800 dark:hover:text-[#cbd5e1]"
              )}
            >
              {f === 'all' ? 'Все задачи' : f === 'active' ? 'Активные' : 'Выполненные'}
              <span className={cn(
                "inline-flex items-center justify-center text-xs rounded-full min-w-[1.5rem] px-1.5 py-0.5 font-bold transition-colors duration-500",
                filter === f ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" : "bg-white dark:bg-[#0a0c10] text-slate-400 dark:text-[#64748b]"
              )}>
                {f === 'all' 
                  ? tasks.length 
                  : f === 'active' 
                    ? tasks.filter(t => !t.completed).length 
                    : tasks.filter(t => t.completed).length}
              </span>
            </button>
          ))}
        </div>

        {/* Task List */}
        <section className="bg-white/60 dark:bg-[#13161c]/60 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden min-h-[300px] shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/40 flex flex-col transition-all duration-500">
          <div className="p-6 sm:px-8 sm:pt-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-transparent transition-colors duration-500">
            <h2 className="font-bold text-xl text-slate-800 dark:text-[#f8fafc] tracking-tight transition-colors duration-500">Текущие задачи</h2>
          </div>
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 dark:text-[#94a3b8] px-6 py-12 text-center transition-colors duration-500">
              <div className="h-20 w-20 bg-slate-100 dark:bg-[#1a1d23]/80 border border-slate-200 dark:border-white/5 rounded-3xl flex items-center justify-center mb-5 rotate-3 shadow-xl transition-colors duration-500">
                <CheckCircle2 className="h-10 w-10 text-slate-400 dark:text-[#475569]/80" />
              </div>
              <p className="text-2xl font-bold text-slate-700 dark:text-[#e2e8f0] mb-2 transition-colors duration-500">Нет задач</p>
              <p className="text-slate-500 dark:text-[#94a3b8] max-w-sm text-[0.95rem] leading-relaxed transition-colors duration-500">
                {filter === 'all' 
                  ? 'Список пуст. Самое время добавить новую задачу и начать быть продуктивным!' 
                  : filter === 'active' 
                    ? 'У вас нет активных задач. Вы отлично справляетесь!' 
                    : 'У вас пока нет выполненных задач. Сделайте что-нибудь полезное!'}
              </p>
            </div>
          ) : (
            <ul className="p-3 sm:p-5 space-y-3">
              {sortedTasks.map((task) => (
                <li 
                  key={task.id} 
                  className={cn(
                    "group flex flex-col sm:flex-row sm:items-start gap-4 p-5 sm:px-6 rounded-3xl transition-all duration-300 border",
                    task.completed 
                       ? "bg-slate-50 dark:bg-[#1a1d23]/40 border-slate-200 dark:border-white/5 opacity-70" 
                       : "bg-white dark:bg-[#1a1d23]/80 border-transparent hover:bg-slate-50 dark:hover:bg-[#1e222a] hover:border-slate-300 dark:hover:border-white/10 hover:shadow-xl hover:shadow-slate-200 dark:hover:shadow-black/40 hover:-translate-y-1 shadow-sm dark:shadow-md dark:shadow-black/10"
                  )}
                >
                  <div className="flex items-start gap-4 w-full">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "mt-0.5 flex-shrink-0 focus:outline-none transition-all duration-300 hover:scale-110 active:scale-95",
                        task.completed ? "text-indigo-500 dark:text-indigo-400" : "text-slate-300 dark:text-[#475569] hover:text-indigo-500 dark:hover:text-indigo-400 group-hover:text-slate-400 dark:group-hover:text-[#64748b]"
                      )}
                      title={task.completed ? "Отменить выполнение" : "Отметить как выполненное"}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-7 w-7 drop-shadow-md" />
                      ) : (
                        <Circle className="h-7 w-7" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 pb-1">
                      <p 
                        className={cn(
                          "text-[1.1rem] font-medium transition-all duration-300 break-words leading-snug",
                          task.completed ? "text-slate-400 dark:text-[#475569] line-through" : "text-slate-800 dark:text-[#f8fafc]"
                        )}
                      >
                        {task.title}
                      </p>
                      
                      {/* Comments Section */}
                      {editingCommentId === task.id ? (
                        <div className="mt-4 bg-slate-50 dark:bg-[#0a0c10]/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5 transition-colors duration-500" onClick={(e) => e.stopPropagation()}>
                          <textarea
                             value={editCommentText}
                             onChange={(e) => setEditCommentText(e.target.value)}
                             className="w-full px-4 py-3 bg-white dark:bg-[#07090c] border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner resize-y min-h-[80px] transition-colors duration-500"
                             placeholder="Напишите комментарий или заметку..."
                             autoFocus
                          />
                          <div className="flex justify-end gap-3 mt-3">
                            <button 
                              onClick={() => setEditingCommentId(null)} 
                              className="text-xs font-semibold text-slate-500 dark:text-[#94a3b8] hover:text-slate-800 dark:hover:text-[#e2e8f0] px-4 py-2 transition-colors rounded-full"
                            >
                              Отмена
                            </button>
                            <button 
                               onClick={() => {
                                  setTasks(prev => prev.map(t => t.id === task.id ? { ...t, notes: editCommentText.trim() } : t));
                                  setEditingCommentId(null);
                               }} 
                               className="text-xs font-bold bg-indigo-600 dark:bg-white text-white dark:text-indigo-900 hover:bg-indigo-500 dark:hover:bg-slate-200 px-5 py-2 rounded-full shadow-lg shadow-indigo-600/30 dark:shadow-white/10 transition-all active:scale-95"
                            >
                               Сохранить
                            </button>
                          </div>
                        </div>
                      ) : (
                        task.notes && (
                          <div 
                            className="mt-3 text-sm text-slate-500 dark:text-[#94a3b8] whitespace-pre-wrap break-words border-l-2 border-indigo-300 dark:border-indigo-500/30 pl-4 py-1.5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-400 hover:text-slate-700 dark:hover:text-[#cbd5e1] transition-all bg-gradient-to-r from-indigo-50 dark:from-indigo-500/5 to-transparent rounded-r-xl"
                            onClick={() => { setEditingCommentId(task.id); setEditCommentText(task.notes || ''); }}
                            title="Нажмите, чтобы изменить комментарий"
                          >
                            {task.notes}
                          </div>
                        )
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-colors duration-500",
                          PRIORITY_COLORS[task.priority],
                          task.completed && "opacity-50 saturate-50"
                        )}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                        
                        {task.dueDate && (
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#0a0c10] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-[#94a3b8] text-xs font-medium shadow-sm dark:shadow-inner transition-colors duration-500",
                            task.completed && "opacity-50"
                          )}>
                            <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-[#475569] transition-colors duration-500" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#1e222a] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-[#e2e8f0] text-xs font-medium shadow-sm transition-colors duration-500",
                            task.completed && "opacity-50"
                          )}>
                            <ListTodo className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                            {task.subtasks.filter(st => st.completed).length} / {task.subtasks.length}
                          </span>
                        )}
                      </div>

                      {/* Subtasks List */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-4 pl-3 sm:pl-5 border-l-2 border-slate-200 dark:border-white/10 space-y-3 transition-colors duration-500">
                          {task.subtasks.map(st => (
                            <div key={st.id} className="flex items-start gap-3 group/st p-1.5 -ml-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <button onClick={() => toggleSubtask(task.id, st.id)} className="mt-0.5 flex-shrink-0 focus:outline-none transition-transform hover:scale-110 active:scale-95">
                                {st.completed ? <CheckCircle2 className="h-[18px] w-[18px] text-indigo-500" /> : <Circle className="h-[18px] w-[18px] text-slate-300 dark:text-[#475569] group-hover/st:text-indigo-500 dark:group-hover/st:text-indigo-400 transition-colors" />}
                              </button>
                              <span className={cn("text-[0.95rem] flex-1 leading-normal transition-colors duration-500", st.completed ? "text-slate-400 dark:text-[#475569] line-through" : "text-slate-700 dark:text-[#cbd5e1]")}>
                                {st.title}
                              </span>
                              <button onClick={() => deleteSubtask(task.id, st.id)} className="opacity-0 group-hover/st:opacity-100 text-slate-400 dark:text-[#475569] hover:text-red-500 dark:hover:text-[#ef4444] transition-all p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 flex-shrink-0 focus:opacity-100" title="Удалить подзадачу">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Subtask Input */}
                      {addingSubtaskToId === task.id && (
                         <div className="mt-4 pl-3 sm:pl-5 border-l-2 border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-3 transition-colors duration-500">
                           <input 
                             autoFocus
                             value={newSubtaskTitle}
                             onChange={e => setNewSubtaskTitle(e.target.value)}
                             onKeyDown={e => {
                               if (e.key === 'Enter') { addSubtask(task.id, newSubtaskTitle); }
                               if (e.key === 'Escape') { setAddingSubtaskToId(null); }
                             }}
                             placeholder="Название подзадачи..."
                             className="flex-1 min-w-[200px] bg-white dark:bg-[#0a0c10]/80 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-colors duration-500"
                           />
                           <button onClick={() => addSubtask(task.id, newSubtaskTitle)} className="text-xs font-bold bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                             Добавить
                           </button>
                           <button onClick={() => setAddingSubtaskToId(null)} className="text-xs font-semibold text-slate-500 dark:text-[#94a3b8] hover:text-slate-800 dark:hover:text-[#e2e8f0] px-3 py-2.5 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-white/5">
                             Отмена
                           </button>
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-all ml-2 sm:ml-0 flex-shrink-0 self-end sm:self-auto sm:mt-1 border-t border-slate-200 dark:border-white/5 sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                    {task.dueDate && (
                      <button
                        onClick={() => downloadICS(task)}
                        className="text-slate-400 dark:text-[#64748b] hover:text-indigo-600 dark:hover:text-indigo-400 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none transition-all active:scale-95"
                        title="Добавить в календарь (.ics)"
                      >
                        <CalendarPlus className="h-[22px] w-[22px]" />
                      </button>
                    )}

                    <button
                      onClick={() => { 
                        if (addingSubtaskToId === task.id) setAddingSubtaskToId(null); 
                        else { setAddingSubtaskToId(task.id); setNewSubtaskTitle(''); }
                      }}
                      className={cn(
                        "p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none transition-all active:scale-95",
                        addingSubtaskToId === task.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-[#64748b] hover:text-indigo-600 dark:hover:text-indigo-400"
                      )}
                      title="Добавить подзадачу"
                    >
                      <ListTodo className="h-[22px] w-[22px]" />
                    </button>

                    <button
                      onClick={() => { 
                        if (editingCommentId === task.id) setEditingCommentId(null); 
                        else { setEditingCommentId(task.id); setEditCommentText(task.notes || ''); }
                      }}
                      className={cn(
                        "p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none transition-all active:scale-95",
                        editingCommentId === task.id || task.notes ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-[#64748b] hover:text-indigo-600 dark:hover:text-indigo-400"
                      )}
                      title={task.notes ? "Редактировать комментарий" : "Добавить комментарий"}
                    >
                      <MessageSquare className="h-[22px] w-[22px]" />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-400 dark:text-[#64748b] hover:text-red-500 dark:hover:text-[#ef4444] p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none transition-all active:scale-95 ml-1"
                      title="Удалить задачу"
                    >
                      <Trash2 className="h-[22px] w-[22px]" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        
        {/* Footer */}
        <p className="text-center text-sm text-slate-500 dark:text-[#475569] mt-10 flex items-center justify-center gap-2 pt-8 pb-4 transition-colors duration-500">
          <CheckCircle2 className="h-4 w-4 text-indigo-500/50" />
          Все изменения автоматически сохраняются в вашем браузере
        </p>

      </div>
    </div>
    </div>
  );
}

