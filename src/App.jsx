
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const API = `${API_BASE_URL}/api/subjects`;
const TASKS_KEY = "studymate_tasks_v1";

const initialTasks = [
  { id: 1, title: "Revise Java OOP concepts", subject: "Java", duration: "1 hour", priority: "High", completed: true },
  { id: 2, title: "Practice SQL queries", subject: "DBMS", duration: "45 minutes", priority: "Medium", completed: true },
  { id: 3, title: "Review React components", subject: "Web Development", duration: "1 hour", priority: "Medium", completed: false },
  { id: 4, title: "Solve DAA problems", subject: "DAA", duration: "1 hour", priority: "High", completed: false },
  { id: 5, title: "Read Spring Boot notes", subject: "Java", duration: "30 minutes", priority: "Low", completed: false },
];

const navItems = [
  { id: "Dashboard", icon: "⌂" },
  { id: "My Subjects", icon: "▤" },
  { id: "Study Tasks", icon: "☑" },
  { id: "Study Plan", icon: "▦" },
  { id: "Progress", icon: "↗" },
];

function readTasks() {
  try {
    const saved = localStorage.getItem(TASKS_KEY);
    return saved ? JSON.parse(saved) : initialTasks;
  } catch {
    return initialTasks;
  }
}

function getDaysLeft(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(`${date}T00:00:00`);
  if (Number.isNaN(exam.getTime())) return null;
  return Math.ceil((exam - today) / 86400000);
}

function formatDate(date) {
  if (!date) return "Date not set";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function SectionTitle({ icon, title, action, onAction }) {
  return (
      <div className="section-title">
        <div className="section-heading">
          <span className="section-icon">{icon}</span>
          <h3>{title}</h3>
        </div>
        {action && (
            <button className="text-button" onClick={onAction}>
              {action} <span>→</span>
            </button>
        )}
      </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state"><span>✦</span><p>{text}</p></div>;
}

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState(readTasks);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [apiError, setApiError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    examDate: "",
    difficulty: "Medium",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    subject: "",
    duration: "1 hour",
    priority: "Medium",
  });

  useEffect(() => {
    let active = true;

    async function loadSubjects() {
      try {
        const response = await fetch(API);
        if (!response.ok) throw new Error("Could not load subjects.");
        const data = await response.json();
        if (active) {
          setSubjects(Array.isArray(data) ? data : []);
          setApiError("");
        }
      } catch {
        if (active) setApiError("Backend unavailable. Start your Spring Boot application.");
      } finally {
        if (active) setLoadingSubjects(false);
      }
    }

    loadSubjects();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch {
      setNotice("Could not save tasks in this browser.");
    }
  }, [tasks]);

  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const completionRate = tasks.length
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

  const upcomingSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => {
      if (!a.examDate) return 1;
      if (!b.examDate) return -1;
      return a.examDate.localeCompare(b.examDate);
    });
  }, [subjects]);

  const filteredTasks = tasks.filter((task) => {
    const text = `${task.title} ${task.subject}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  function toggleTask(id) {
    setTasks((current) =>
        current.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
        )
    );
  }

  async function addSubject(event) {
    event.preventDefault();
    setNotice("");

    const name = subjectForm.name.trim();
    if (!name) return;

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          examDate: subjectForm.examDate || null,
          difficulty: subjectForm.difficulty,
        }),
      });

      if (!response.ok) throw new Error("Subject could not be saved.");
      const savedSubject = await response.json();

      setSubjects((current) => [...current, savedSubject]);
      setSubjectForm({ name: "", examDate: "", difficulty: "Medium" });
      setShowSubjectForm(false);
      setNotice("Subject saved successfully!");
    } catch {
      setNotice("Unable to save subject. Check that Spring Boot and MySQL are running.");
    }
  }

  function addTask(event) {
    event.preventDefault();
    if (!taskForm.title.trim()) return;

    const newTask = {
      ...taskForm,
      title: taskForm.title.trim(),
      subject: taskForm.subject.trim() || "General",
      id: Date.now(),
      completed: false,
    };

    setTasks((current) => [newTask, ...current]);
    setTaskForm({ title: "", subject: "", duration: "1 hour", priority: "Medium" });
    setShowTaskForm(false);
    setNotice("New study task added!");
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    setNotice("Task removed.");
  }

  function openPage(name) {
    setPage(name);
    setSearch("");
    setNotice("");
    setShowSubjectForm(false);
    setShowTaskForm(false);
  }

  function openSubjectForm() {
    setPage("My Subjects");
    setShowSubjectForm(true);
    setShowTaskForm(false);
  }

  function openTaskForm() {
    setPage("Study Tasks");
    setShowTaskForm(true);
    setShowSubjectForm(false);
  }

  function renderTask(task) {
    return (
        <div className={`task-row ${task.completed ? "task-done" : ""}`} key={task.id}>
          <button
              className={`task-check ${task.completed ? "checked" : ""}`}
              aria-label={task.completed ? "Mark task pending" : "Mark task completed"}
              onClick={() => toggleTask(task.id)}
          >
            {task.completed ? "✓" : ""}
          </button>
          <div className="task-main">
            <div className="task-name">{task.title}</div>
            <div className="task-meta">
              <span className="subject-tag">{task.subject}</span>
              <span>◷ {task.duration}</span>
            </div>
          </div>
          <span className={`status-pill ${task.completed ? "status-complete" : "status-pending"}`}>
          {task.completed ? "Completed" : "Pending"}
        </span>
          <button className="delete-button" onClick={() => deleteTask(task.id)} aria-label="Delete task">
            ×
          </button>
        </div>
    );
  }

  function renderSubject(subject, index) {
    const days = getDaysLeft(subject.examDate);
    const initials = (subject.name || "S").slice(0, 1).toUpperCase();

    return (
        <div className="subject-card" key={subject.id ?? `${subject.name}-${index}`}>
          <div className={`subject-avatar avatar-${index % 4}`}>{initials}</div>
          <div className="subject-card-content">
            <h3>{subject.name}</h3>
            <p>▦ {formatDate(subject.examDate)}</p>
            <div className="subject-card-bottom">
            <span className={`difficulty difficulty-${(subject.difficulty || "medium").toLowerCase()}`}>
              {subject.difficulty || "Medium"}
            </span>
              {days !== null && (
                  <span className={days < 0 ? "days-past" : "days-left"}>
                {days < 0 ? "Exam passed" : days === 0 ? "Exam today" : `${days} days left`}
              </span>
              )}
            </div>
          </div>
        </div>
    );
  }

  function renderSubjectForm() {
    return (
        <Card className="form-card">
          <SectionTitle icon="＋" title="Add a new subject" />
          <form className="app-form" onSubmit={addSubject}>
            <label>
              Subject name
              <input
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Java Programming"
              />
            </label>
            <label>
              Exam date
              <input
                  type="date"
                  value={subjectForm.examDate}
                  onChange={(e) => setSubjectForm({ ...subjectForm, examDate: e.target.value })}
              />
            </label>
            <label>
              Difficulty
              <select
                  value={subjectForm.difficulty}
                  onChange={(e) => setSubjectForm({ ...subjectForm, difficulty: e.target.value })}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit">Save subject</button>
              <button className="secondary-button" type="button" onClick={() => setShowSubjectForm(false)}>Cancel</button>
            </div>
          </form>
        </Card>
    );
  }

  function renderTaskForm() {
    return (
        <Card className="form-card">
          <SectionTitle icon="＋" title="Create a study task" />
          <form className="app-form" onSubmit={addTask}>
            <label>
              Task name
              <input
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="What do you need to study?"
              />
            </label>
            <label>
              Subject
              <input
                  value={taskForm.subject}
                  onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
                  placeholder="e.g. DBMS"
              />
            </label>
            <label>
              Study duration
              <select value={taskForm.duration} onChange={(e) => setTaskForm({ ...taskForm, duration: e.target.value })}>
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>1 hour</option>
                <option>2 hours</option>
              </select>
            </label>
            <label>
              Priority
              <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit">Create task</button>
              <button className="secondary-button" type="button" onClick={() => setShowTaskForm(false)}>Cancel</button>
            </div>
          </form>
        </Card>
    );
  }

  function renderDashboard() {
    return (
        <>
          <section className="welcome-banner">
            <div className="welcome-copy">
              <span className="eyebrow">YOUR PERSONAL STUDY SPACE</span>
              <h2>Good morning, Student! <span>✦</span></h2>
              <p>Small steps today, big achievements tomorrow.</p>
              <div className="welcome-note">✧ &nbsp; One task at a time. You've got this!</div>
            </div>
            <div className="welcome-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <span className="art-spark spark-one">✦</span>
              <span className="art-spark spark-two">✧</span>
              <div className="book-stack"><i /><i /><i /></div>
              <div className="plant-pot"><span>♧</span><i /></div>
              <div className="pencil-cup"><b>✎</b><b>✎</b><b>✎</b></div>
            </div>
          </section>

          <div className="stats-grid">
            <div className="stat-card stat-purple">
              <div className="stat-top"><span className="stat-icon">▤</span><span className="stat-caption">ALL YOUR WORK</span></div>
              <div className="stat-number">{tasks.length}</div>
              <div className="stat-bottom"><span>Total tasks</span><span className="stat-arrow">↗</span></div>
            </div>
            <div className="stat-card stat-green">
              <div className="stat-top"><span className="stat-icon">✓</span><span className="stat-caption">GREAT WORK</span></div>
              <div className="stat-number">{completedTasks}</div>
              <div className="stat-bottom"><span>Tasks completed</span><span className="stat-arrow">↗</span></div>
            </div>
            <div className="stat-card stat-orange">
              <div className="stat-top"><span className="stat-icon">◷</span><span className="stat-caption">KEEP GOING</span></div>
              <div className="stat-number">{pendingTasks}</div>
              <div className="stat-bottom"><span>Tasks remaining</span><span className="stat-arrow">↗</span></div>
            </div>
            <div className="stat-card stat-blue">
              <div className="stat-top"><span className="stat-icon">↗</span><span className="stat-caption">YOUR PROGRESS</span></div>
              <div className="stat-number">{completionRate}<small>%</small></div>
              <div className="stat-bottom"><span>Completion rate</span><span className="stat-arrow">↗</span></div>
            </div>
          </div>

          <div className="dashboard-grid">
            <Card className="recent-card">
              <SectionTitle icon="☑" title="Recent study tasks" action="View all" onAction={() => openPage("Study Tasks")} />
              <div className="task-list">
                {tasks.length
                    ? [...tasks].slice(0, 5).map(renderTask)
                    : <EmptyState text="Your study tasks will appear here." />}
              </div>
            </Card>

            <div className="dashboard-middle">
              <Card className="progress-card">
                <SectionTitle icon="↗" title="Your progress" />
                <div className="progress-content">
                  <div className="donut" style={{ "--progress": `${completionRate}%` }}>
                    <div className="donut-inner">
                      <strong>{completionRate}%</strong>
                      <span>completed</span>
                    </div>
                  </div>
                  <div className="progress-legend">
                    <div><i className="legend-dot dot-green" /><span>Completed<strong>{completedTasks} tasks</strong></span></div>
                    <div><i className="legend-dot dot-orange" /><span>Pending<strong>{pendingTasks} tasks</strong></span></div>
                    <div><i className="legend-dot dot-purple" /><span>Total<strong>{tasks.length} tasks</strong></span></div>
                  </div>
                </div>
                <div className="encouragement">✦ &nbsp; Every little step counts. Keep it up!</div>
              </Card>

              <Card className="exams-card">
                <SectionTitle icon="▦" title="Upcoming exams" action="View all" onAction={() => openPage("Study Plan")} />
                {upcomingSubjects.length ? (
                    <div className="exam-list">
                      {upcomingSubjects.slice(0, 4).map((subject, index) => {
                        const days = getDaysLeft(subject.examDate);
                        return (
                            <div className="exam-row" key={subject.id ?? index}>
                              <span className={`exam-number exam-number-${index % 4}`}>{index + 1}</span>
                              <strong>{subject.name}</strong>
                              <span className="exam-date">{formatDate(subject.examDate)}</span>
                              <span className={`difficulty difficulty-${(subject.difficulty || "medium").toLowerCase()}`}>{subject.difficulty || "Medium"}</span>
                              <small>{days === null ? "" : days < 0 ? "Passed" : days === 0 ? "Today" : `${days}d left`}</small>
                            </div>
                        );
                      })}
                    </div>
                ) : <EmptyState text="Add subjects to see your upcoming exams." />}
              </Card>
            </div>

            <div className="dashboard-right">
              <Card className="quick-card">
                <SectionTitle icon="✧" title="Quick actions" />
                <button className="quick-action quick-purple" onClick={openSubjectForm}><span>＋</span><strong>Add a subject</strong><b>›</b></button>
                <button className="quick-action quick-green" onClick={openTaskForm}><span>✓</span><strong>Create a task</strong><b>›</b></button>
                <button className="quick-action quick-blue" onClick={() => openPage("Study Plan")}><span>▦</span><strong>View study plan</strong><b>›</b></button>
                <button className="quick-action quick-pink" onClick={() => openPage("Progress")}><span>↗</span><strong>Check progress</strong><b>›</b></button>
              </Card>
              <div className="motivation-card">
                <div className="motivation-label">A LITTLE REMINDER ✦</div>
                <h3>Progress is still progress.</h3>
                <p>You are building your future, one study session at a time.</p>
                <div className="mountain-art"><span>☼</span><i /><b /></div>
                <button onClick={() => openPage("Study Tasks")}>Keep going <span>→</span></button>
              </div>
              <div className="backend-status">
                <span className={apiError ? "connection-dot offline" : "connection-dot"} />
                <div><strong>{apiError ? "Backend disconnected" : "Backend connection"}</strong><small>{apiError ? "Check Spring Boot" : "Spring Boot · MySQL"}</small></div>
              </div>
            </div>
          </div>
        </>
    );
  }

  function renderSubjectsPage() {
    return (
        <>
          <div className="page-intro">
            <div><span className="eyebrow">ORGANIZE YOUR LEARNING</span><h2>My Subjects <span>✦</span></h2><p>Keep your subjects and exam dates in one place.</p></div>
            <button className="primary-button" onClick={() => setShowSubjectForm((value) => !value)}>＋ Add subject</button>
          </div>
          {showSubjectForm && renderSubjectForm()}
          {apiError && <div className="error-banner">{apiError}</div>}
          {loadingSubjects ? <EmptyState text="Loading your subjects..." /> : subjects.length ? (
              <div className="subjects-grid">{subjects.map(renderSubject)}</div>
          ) : <Card><EmptyState text="No subjects yet. Add your first subject to get started." /><button className="primary-button centered-button" onClick={() => setShowSubjectForm(true)}>＋ Add your first subject</button></Card>}
        </>
    );
  }

  function renderTasksPage() {
    return (
        <>
          <div className="page-intro">
            <div><span className="eyebrow">PLAN · FOCUS · FINISH</span><h2>Study Tasks <span>✦</span></h2><p>Turn your study goals into small, achievable steps.</p></div>
            <button className="primary-button" onClick={() => setShowTaskForm((value) => !value)}>＋ New task</button>
          </div>
          {showTaskForm && renderTaskForm()}
          <div className="task-summary-strip">
            <div><span>Total tasks</span><strong>{tasks.length}</strong></div>
            <div><span>Completed</span><strong>{completedTasks}</strong></div>
            <div><span>Still to do</span><strong>{pendingTasks}</strong></div>
          </div>
          <Card className="full-task-card">
            <SectionTitle icon="☑" title="All study tasks" />
            <div className="task-list">
              {filteredTasks.length ? filteredTasks.map(renderTask) : <EmptyState text={search ? "No matching tasks found." : "Add your first study task to get started."} />}
            </div>
          </Card>
        </>
    );
  }

  function renderPlanPage() {
    return (
        <>
          <div className="page-intro"><div><span className="eyebrow">STAY ONE STEP AHEAD</span><h2>Your study plan <span>✦</span></h2><p>Your subjects arranged by upcoming exam dates.</p></div><button className="primary-button" onClick={openSubjectForm}>＋ Add subject</button></div>
          <Card className="plan-card">
            <SectionTitle icon="▦" title="Exam schedule" />
            {upcomingSubjects.length ? upcomingSubjects.map((subject, index) => {
              const days = getDaysLeft(subject.examDate);
              return (
                  <div className="plan-row" key={subject.id ?? index}>
                    <div className={`plan-date plan-date-${index % 4}`}><span>{subject.examDate ? new Date(`${subject.examDate}T00:00:00`).toLocaleDateString("en-IN", { month: "short" }) : "TBD"}</span><strong>{subject.examDate ? new Date(`${subject.examDate}T00:00:00`).getDate() : "—"}</strong></div>
                    <div className="plan-details"><h3>{subject.name}</h3><p>{formatDate(subject.examDate)} · {subject.difficulty || "Medium"} difficulty</p></div>
                    <span className="days-left">{days === null ? "Date not set" : days < 0 ? "Exam passed" : days === 0 ? "Exam today!" : `${days} days left`}</span>
                  </div>
              );
            }) : <EmptyState text="Your exam schedule will appear here after you add subjects." />}
          </Card>
          <Card className="plan-tip"><span>✦</span><div><h3>A simple study tip</h3><p>Break each subject into small tasks. Complete the most urgent topics first, and remember to take short breaks.</p></div></Card>
        </>
    );
  }

  function renderProgressPage() {
    return (
        <>
          <div className="page-intro"><div><span className="eyebrow">LOOK HOW FAR YOU'VE COME</span><h2>Your progress <span>✦</span></h2><p>Every completed task is a step forward.</p></div></div>
          <div className="progress-overview">
            <Card className="big-progress-card">
              <span className="eyebrow">OVERALL COMPLETION</span>
              <div className="big-donut" style={{ "--progress": `${completionRate}%` }}><div><strong>{completionRate}%</strong><span>completed</span></div></div>
              <h3>{completionRate === 100 ? "Amazing! Everything is done." : completionRate >= 60 ? "You're doing great!" : "Every step moves you forward."}</h3>
              <p>Keep building your study habit one task at a time.</p>
            </Card>
            <div className="progress-stats">
              <Card className="progress-stat stat-green"><span>✓</span><div><p>Tasks completed</p><strong>{completedTasks}</strong></div></Card>
              <Card className="progress-stat stat-orange"><span>◷</span><div><p>Tasks pending</p><strong>{pendingTasks}</strong></div></Card>
              <Card className="progress-stat stat-purple"><span>▤</span><div><p>Total tasks</p><strong>{tasks.length}</strong></div></Card>
              <Card className="progress-stat stat-blue"><span>▦</span><div><p>Subjects tracked</p><strong>{subjects.length}</strong></div></Card>
            </div>
          </div>
          <Card className="full-task-card"><SectionTitle icon="✓" title="Completion checklist" /><div className="task-list">{tasks.length ? tasks.map(renderTask) : <EmptyState text="Add a task to start tracking progress." />}</div></Card>
        </>
    );
  }

  const greetingDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">✦</div>
            <div><h1>StudyMate</h1><span>SMART STUDY PLANNER</span></div>
          </div>
          <div className="sidebar-label">WORKSPACE</div>
          <nav className="side-nav">
            {navItems.map((item) => (
                <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => openPage(item.id)}>
                  <span className="nav-icon">{item.icon}</span><span>{item.id}</span>
                  {item.id === "Progress" && <span className="nav-badge">{completionRate}%</span>}
                </button>
            ))}
          </nav>
          <div className="sidebar-quote">
            <div className="quote-stars">✦ &nbsp; ✧</div>
            <div className="quote-plant">♧</div>
            <p>Small steps<br />make big<br />progress!</p>
            <span>Keep showing up.</span>
          </div>
          <div className="sidebar-footer">
            <span className={`connection-dot ${apiError ? "offline" : ""}`} />
            <div><strong>{apiError ? "Backend offline" : "Backend connected"}</strong><small>Spring Boot + MySQL</small></div>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div className="search-box"><span>⌕</span><input aria-label="Search tasks" placeholder="Search subjects and tasks..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="topbar-right"><span className="top-date">{greetingDate}</span><div className="avatar">S</div></div>
          </header>

          <div className="page-content">
            {notice && <div className="notice-banner"><span>✦</span>{notice}<button onClick={() => setNotice("")}>×</button></div>}
            {search && page === "Dashboard" && (
                <Card className="search-results"><SectionTitle icon="⌕" title={`Search results for "${search}"`} /><div className="task-list">{filteredTasks.length ? filteredTasks.map(renderTask) : <EmptyState text="No matching tasks found." />}</div></Card>
            )}
            {page === "Dashboard" && renderDashboard()}
            {page === "My Subjects" && renderSubjectsPage()}
            {page === "Study Tasks" && renderTasksPage()}
            {page === "Study Plan" && renderPlanPage()}
            {page === "Progress" && renderProgressPage()}
            <footer className="page-footer"><span>✦</span> StudyMate · Your goals, one step at a time.</footer>
          </div>
        </main>
      </div>
  );
}
