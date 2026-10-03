'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  CircleCheck,
  Clock3,
  Hash,
  Inbox,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

const STORAGE_KEY = 'daymark-tasks-v1'
const PROJECTS = [
  { id: 'work', label: 'Work', color: 'mint' },
  { id: 'personal', label: 'Personal', color: 'coral' },
  { id: 'learning', label: 'Learning', color: 'gold' },
]
const VIEWS = [
  { id: 'today', label: 'Today', icon: CalendarDays },
  { id: 'upcoming', label: 'Upcoming', icon: Clock3 },
  { id: 'all', label: 'All tasks', icon: Inbox },
  { id: 'completed', label: 'Completed', icon: CircleCheck },
]

function localDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function starterTasks() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const later = new Date(today)
  later.setDate(today.getDate() + 3)
  return [
    { id: 'starter-1', title: 'Review the launch brief', description: 'Add final notes before the afternoon sync.', dueDate: localDate(today), priority: 'high', project: 'work', completed: false },
    { id: 'starter-2', title: 'Send the design handoff', description: 'Include the updated component states.', dueDate: localDate(today), priority: 'medium', project: 'work', completed: false },
    { id: 'starter-3', title: 'Take a proper lunch break', description: '', dueDate: localDate(today), priority: 'low', project: 'personal', completed: false },
    { id: 'starter-4', title: 'Pick up a few groceries', description: 'Coffee, lemons, and something for dinner.', dueDate: localDate(tomorrow), priority: 'medium', project: 'personal', completed: false },
    { id: 'starter-5', title: 'Finish the chapter on state', description: '', dueDate: localDate(later), priority: 'low', project: 'learning', completed: false },
  ]
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(date)
}

function dueLabel(dueDate) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dueDate === localDate()) return 'Today'
  if (dueDate === localDate(tomorrow)) return 'Tomorrow'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${dueDate}T12:00:00`))
}

export default function Home() {
  const [tasks, setTasks] = useState([])
  const [ready, setReady] = useState(false)
  const [activeView, setActiveView] = useState('today')
  const [activeProject, setActiveProject] = useState('all')
  const [query, setQuery] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [notice, setNotice] = useState('')
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(localDate())
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) : null
      setTasks(Array.isArray(parsed) ? parsed : starterTasks())
    } catch {
      setTasks(starterTasks())
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [ready, tasks])

  useEffect(() => {
    if (!showComposer) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowComposer(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showComposer])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 2400)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const counts = useMemo(() => ({
    today: tasks.filter((task) => !task.completed && task.dueDate === today).length,
    upcoming: tasks.filter((task) => !task.completed && task.dueDate > today).length,
    all: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
  }), [tasks, today])

  const todayTasks = tasks.filter((task) => !task.completed && task.dueDate === today)
  const finishedToday = tasks.filter((task) => task.completed && task.dueDate === today).length
  const progress = todayTasks.length + finishedToday === 0 ? 0 : Math.round((finishedToday / (todayTasks.length + finishedToday)) * 100)
  const visibleTasks = useMemo(() => tasks
    .filter((task) => {
      if (activeView === 'completed') return task.completed
      if (task.completed) return false
      if (activeView === 'today') return task.dueDate === today
      if (activeView === 'upcoming') return task.dueDate > today
      return true
    })
    .filter((task) => activeProject === 'all' || task.project === activeProject)
    .filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase()))
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate) || ['high', 'medium', 'low'].indexOf(first.priority) - ['high', 'medium', 'low'].indexOf(second.priority)),
  [tasks, activeView, activeProject, query, today])

  const activeViewLabel = VIEWS.find((view) => view.id === activeView)?.label ?? 'Today'

  function addTask(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const title = String(values.get('title') ?? '').trim()
    if (!title) return
    const dueDate = String(values.get('dueDate') ?? today)
    const task = {
      id: window.crypto?.randomUUID?.() ?? `task-${Date.now()}`,
      title,
      description: String(values.get('description') ?? '').trim(),
      dueDate,
      priority: String(values.get('priority') ?? 'medium'),
      project: String(values.get('project') ?? 'work'),
      completed: false,
    }
    setTasks((current) => [task, ...current])
    setActiveView(dueDate === today ? 'today' : dueDate > today ? 'upcoming' : 'all')
    setActiveProject('all')
    setQuery('')
    setShowComposer(false)
    setNotice('Task added to your list')
  }

  function toggleTask(id) {
    const task = tasks.find((item) => item.id === id)
    setTasks((current) => current.map((item) => item.id === id ? { ...item, completed: !item.completed } : item))
    if (task && !task.completed) setNotice('Nice work. One thing off your plate.')
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id))
    setNotice('Task removed')
  }

  const heading = activeView === 'today' ? <>A little more<br /><span>on track.</span></> : <>{activeViewLabel}<span className="heading-period">.</span></>
  const subtitle = activeView === 'today'
    ? 'Small steps still move you forward. Pick what matters.'
    : activeView === 'completed'
      ? 'Look at everything you have already moved forward.'
      : 'Keep the important things in view and take them one at a time.'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Daymark home"><span className="brand-mark"><Check size={17} strokeWidth={3} /></span><span>daymark<span className="brand-period">.</span></span></a>
        <button className="add-task-button" onClick={() => setShowComposer(true)}><Plus size={17} strokeWidth={2.5} /><span>New task</span><kbd>N</kbd></button>
        <div className="side-label">YOUR SPACE</div>
        <nav className="main-nav" aria-label="Task views">
          {VIEWS.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activeView === id && activeProject === 'all' ? 'is-active' : ''}`} onClick={() => { setActiveView(id); setActiveProject('all') }}><Icon size={17} strokeWidth={1.8} /><span>{label}</span><span className="nav-count">{counts[id]}</span></button>)}
        </nav>
        <div className="projects-heading"><div className="side-label">PROJECTS</div><button className="icon-button project-add" aria-label="Add a task" title="Add a task" onClick={() => setShowComposer(true)}><Plus size={16} /></button></div>
        <nav className="project-nav" aria-label="Filter by project">
          {PROJECTS.map((project) => <button key={project.id} className={`project-item ${activeProject === project.id ? 'is-selected' : ''}`} onClick={() => setActiveProject(activeProject === project.id ? 'all' : project.id)}><span className={`project-dot ${project.color}`} /><span>{project.label}</span><span className="project-count">{tasks.filter((task) => task.project === project.id && !task.completed).length}</span></button>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-note"><Sparkles size={15} /><span>Make space for what matters.</span></div><div className="profile-row"><div className="avatar">A</div><div className="profile-copy"><strong>Alex Morgan</strong><span>Personal workspace</span></div><ChevronDown size={15} className="profile-chevron" /></div></div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar"><div className="breadcrumb"><span>My workspace</span><span className="breadcrumb-slash">/</span><strong>{activeProject === 'all' ? activeViewLabel : PROJECTS.find((project) => project.id === activeProject)?.label}</strong></div><label className="search-box"><Search size={16} /><input aria-label="Search tasks" placeholder="Search your tasks" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>/</kbd></label></header>
        <section className="content-wrap">
          <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" />{today ? formatDate(new Date(`${today}T12:00:00`)) : 'Your day, at a glance'}</div><h1>{heading}</h1><p className="welcome-copy">{subtitle}</p></div><div className="day-illustration" aria-hidden="true"><div className="sun-disc" /><div className="sun-ray ray-one" /><div className="sun-ray ray-two" /><div className="sun-ray ray-three" /><div className="horizon horizon-back" /><div className="horizon horizon-front" /><span className="illustration-spark spark-one">✳</span><span className="illustration-spark spark-two">✳</span></div></div>

          {activeView === 'today' && activeProject === 'all' && <div className="progress-strip"><div className="progress-icon"><ListTodo size={17} /></div><div className="progress-copy"><strong>Your daily rhythm</strong><span>{finishedToday} of {todayTasks.length + finishedToday} tasks complete</span></div><div className="progress-track" role="progressbar" aria-label="Today's task progress" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${progress}%` }} /></div><strong className="progress-percent">{progress}%</strong></div>}

          <div className="list-heading-row"><div className="list-title-wrap"><h2>{activeProject === 'all' ? activeViewLabel : PROJECTS.find((project) => project.id === activeProject)?.label}</h2><span className="task-total">{visibleTasks.length}</span></div><button className="text-action" onClick={() => setShowComposer(true)}><Plus size={16} /> Add task</button></div>
          <div className="task-list" aria-live="polite">
            {visibleTasks.map((task) => {
              const project = PROJECTS.find((item) => item.id === task.project) ?? PROJECTS[0]
              return <article className={`task-row ${task.completed ? 'task-done' : ''}`} key={task.id}><button className="complete-button" aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`} onClick={() => toggleTask(task.id)}>{task.completed ? <CircleCheck size={21} strokeWidth={1.7} /> : <Circle size={21} strokeWidth={1.5} />}</button><div className="task-main"><div className="task-title-line"><h3>{task.title}</h3>{task.priority === 'high' && <span className="priority-flag" title="High priority"><ArrowUp size={12} /></span>}</div>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`task-project ${project.color}`}><span className="project-dot" />{project.label}</span><span className={`due-chip ${task.dueDate < today && !task.completed ? 'is-overdue' : ''}`}><CalendarDays size={12} />{dueLabel(task.dueDate)}</span><span className={`priority-chip ${task.priority}`}>{task.priority === 'high' ? <ArrowUp size={11} /> : task.priority === 'low' ? <ArrowDown size={11} /> : <Hash size={10} />}{task.priority} priority</span></div></div><button className="icon-button delete-task" aria-label={`Delete ${task.title}`} title="Delete task" onClick={() => deleteTask(task.id)}><Trash2 size={16} /></button></article>
            })}
            {visibleTasks.length === 0 && <div className="empty-state"><div className="empty-icon"><CircleCheck size={23} /></div><h3>{query ? 'Nothing matches that search.' : activeView === 'completed' ? 'Your next win is waiting.' : activeView === 'today' ? 'You have room to breathe.' : 'Nothing on the list yet.'}</h3><p>{query ? 'Try a different word or clear your search.' : activeView === 'today' ? 'Add a task when something needs your attention.' : 'Add a task and give it a place in your day.'}</p>{query ? <button className="text-action" onClick={() => setQuery('')}>Clear search</button> : <button className="text-action" onClick={() => setShowComposer(true)}><Plus size={16} /> Add a task</button>}</div>}
          </div>
          <footer className="list-footer"><span><span className="footer-spark">✳</span> One thing at a time.</span><span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} in your workspace</span></footer>
        </section>
      </main>

      {showComposer && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowComposer(false) }}><section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="composer-title"><div className="modal-header"><div><div className="modal-eyebrow">MAKE A LITTLE SPACE</div><h2 id="composer-title">Add a task</h2></div><button className="icon-button modal-close" aria-label="Close" onClick={() => setShowComposer(false)}><X size={19} /></button></div><form onSubmit={addTask}><label className="form-field"><span>What needs doing?</span><input name="title" autoFocus maxLength="100" placeholder="Give it a clear name" required /></label><label className="form-field"><span>A little detail <small>OPTIONAL</small></span><textarea name="description" rows="2" maxLength="240" placeholder="Add a note to your future self" /></label><div className="form-grid"><label className="form-field"><span>Due date</span><input name="dueDate" type="date" defaultValue={today} required /></label><label className="form-field"><span>Project</span><select name="project" defaultValue="work">{PROJECTS.map((project) => <option key={project.id} value={project.id}>{project.label}</option>)}</select></label></div><fieldset className="priority-field"><legend>Priority</legend><div className="priority-options">{['low', 'medium', 'high'].map((priority) => <label key={priority}><input type="radio" name="priority" value={priority} defaultChecked={priority === 'medium'} /><span className={`priority-option ${priority}`}>{priority === 'high' ? <ArrowUp size={13} /> : priority === 'low' ? <ArrowDown size={13} /> : <Hash size={12} />}{priority}</span></label>)}</div></fieldset><div className="modal-footer"><button type="button" className="cancel-button" onClick={() => setShowComposer(false)}>Cancel</button><button type="submit" className="submit-button"><Plus size={16} /> Create task</button></div></form></section></div>}
      {notice && <div className="toast" role="status"><Check size={15} />{notice}</div>}
    </div>
  )
}