"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Download,
  GraduationCap,
  LayoutDashboard,
  Library,
  Lightbulb,
  Menu,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  Wrench,
  X,
  Zap,
  Copy,
  FileText,
} from "lucide-react";
import allChallenges from "@/lib/challenges.json";
import { studyTools, runTool, type StudyTool } from "@/lib/tools";
import { emptyProgress, sanitizeProgress, type Progress } from "@/lib/progress";
import type { TestResult } from "@/lib/runner";
type Challenge = (typeof allChallenges)[number];
type View = "overview" | "challenges" | "tools" | "progress" | "notes";
const categories = [...new Set(allChallenges.map((c) => c.category))];
function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export default function Workspace() {
  const [view, setView] = useState<View>("overview");
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [bookmarked, setBookmarked] = useState(false);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [storage, setStorage] = useState("Saved on this browser");
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [tool, setTool] = useState<StudyTool | null>(null);
  const [toast, setToast] = useState("");
  const db = useRef(false);
  useEffect(() => {
    let alive = true;
    let local = emptyProgress;
    let hasLocal = false;
    try {
      const raw = localStorage.getItem("devstudy-v1");
      if (raw) {
        local = sanitizeProgress(JSON.parse(raw));
        hasLocal = true;
      }
    } catch {}
    setProgress(local);
    fetch("/api/progress", { signal: AbortSignal.timeout(5000) })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.mode === "database") {
          db.current = true;
          setStorage("Saved with your private browser session");
          if (data.progress) {
            const remote = sanitizeProgress(data.progress);
            // A stored browser snapshot is authoritative, including deletions.
            // If the user edits before the load finishes, preserve that newer state.
            setProgress((current) =>
              hasLocal || current !== local ? current : remote,
            );
          }
        }
      })
      .catch(() => {
        if (alive) setStorage("Offline · saved on this browser");
      })
      .finally(() => {
        if (alive) {
          setReady(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("devstudy-v1", JSON.stringify(progress));
    } catch {
      setStorage("Storage full · export your progress");
    }
    if (!db.current) return;
    const id = setTimeout(() => {
      fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      })
        .then((r) => {
          if (!r.ok) throw Error();
          setStorage("Saved with your private browser session");
        })
        .catch(() => setStorage("Sync unavailable · browser copy preserved"));
    }, 600);
    return () => clearTimeout(id);
  }, [progress, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  const completed = new Set(progress.completed);
  const xp = allChallenges
    .filter((c) => completed.has(c.id))
    .reduce((a, c) => a + c.xp, 0);
  const next =
    allChallenges.find((c) => !completed.has(c.id)) ?? allChallenges[0];
  function navigate(v: View) {
    window.scrollTo({ top: 0 });
    setView(v);
    setSelected(null);
    setTool(null);
    setQuery("");
    setCategory("All");
    setMobile(false);
  }
  function markComplete(c: Challenge) {
    setProgress((p) => {
      if (p.completed.includes(c.id)) return p;
      const date = new Date().toLocaleDateString("en-CA");
      return {
        ...p,
        completed: [...p.completed, c.id],
        activity: { ...p.activity, [date]: (p.activity[date] ?? 0) + 1 },
      };
    });
    setToast("Challenge complete. Keep building!");
  }
  function toggleBookmark(id: string) {
    setProgress((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(id)
        ? p.bookmarks.filter((x) => x !== id)
        : [...p.bookmarks, id],
    }));
  }
  const filtered = allChallenges.filter(
    (c) =>
      (category === "All" || c.category === category) &&
      (difficulty === "All" || c.difficulty === difficulty) &&
      (!bookmarked || progress.bookmarks.includes(c.id)) &&
      `${c.title} ${c.prompt} ${c.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const filteredTools = studyTools.filter(
    (t) =>
      (category === "All" || t.category === category) &&
      `${t.name} ${t.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const navItems: [View, string, typeof LayoutDashboard][] = [
    ["overview", "Overview", LayoutDashboard],
    ["challenges", "Coding challenges", Code2],
    ["tools", "Study toolkit", Wrench],
    ["progress", "My progress", Target],
    ["notes", "My notebook", BookOpen],
  ];
  return (
    <div className="shell">
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <button className="brand" onClick={() => navigate("overview")}>
          <span className="brand-symbol">
            <Code2 size={23} />
          </span>
          devstudy<span className="brand-dot">.</span>
        </button>
        <div className="workspace-label">YOUR LEARNING SPACE</div>
        <nav>
          {navItems.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`nav-link ${view === id ? "active" : ""}`}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "challenges" && <small>100</small>}
              {id === "tools" && <small>50</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="growth-card">
            <span className="growth-icon">
              <Sparkles size={20} />
            </span>
            <h3>
              A little practice.
              <br />A lot of possibility.
            </h3>
            <p>Your next breakthrough starts with one challenge.</p>
            <button
              onClick={() => {
                navigate("challenges");
                setSelected(next);
              }}
            >
              Let’s build <ArrowRight size={15} />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">S</div>
            <div>
              <strong>Student workspace</strong>
              <span>Level {Math.floor(xp / 200) + 1} · Explorer</span>
            </div>
            <GraduationCap size={20} />
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{navItems.find((n) => n[0] === view)?.[1]}</strong>
            {selected && (
              <>
                <ChevronRight size={14} />
                <span className="crumb-title">{selected.title}</span>
              </>
            )}
          </div>
          <div className="top-actions">
            <span className="local-badge">
              <span />
              Personal workspace
            </span>
            <div className="avatar small">S</div>
          </div>
        </header>
        <div className="page">
          {selected ? (
            <ChallengeEditor
              key={selected.id}
              challenge={selected}
              draft={progress.drafts[selected.id]}
              complete={completed.has(selected.id)}
              saved={progress.bookmarks.includes(selected.id)}
              onBookmark={() => toggleBookmark(selected.id)}
              onBack={() => setSelected(null)}
              onDraft={(code) =>
                setProgress((p) => ({
                  ...p,
                  drafts: { ...p.drafts, [selected.id]: code },
                }))
              }
              onComplete={() => markComplete(selected)}
            />
          ) : tool ? (
            <ToolPanel
              key={tool.id}
              tool={tool}
              onBack={() => setTool(null)}
              notify={setToast}
            />
          ) : view === "overview" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="tiny-line" />
                    MAKE ROOM FOR PROGRESS
                  </div>
                  <h1>
                    Your next chapter starts here<span>.</span>
                  </h1>
                  <p>
                    Practice real skills. Find your flow. Build something you’re
                    proud of.
                  </p>
                </div>
                <button
                  className="button light"
                  onClick={() => navigate("progress")}
                >
                  <Target size={16} />
                  My learning journey
                </button>
              </div>
              <section className="hero">
                <div className="hero-content">
                  <span className="pill">
                    <span />
                    LEARN BY DOING
                  </span>
                  <h2>
                    Less watching.
                    <br />
                    More <span>“I built that.”</span>
                  </h2>
                  <p>
                    Real development tickets. A space to experiment.
                    <br />
                    Everything you need to turn curiosity into capability.
                  </p>
                  <button
                    className="button dark"
                    onClick={() => {
                      navigate("challenges");
                      setSelected(next);
                    }}
                  >
                    {completed.size
                      ? "Continue learning"
                      : "Start your first challenge"}
                    <ArrowRight size={17} />
                  </button>
                  <div className="hero-caption">
                    <CheckCircle2 size={14} />
                    At your pace. One small win at a time.
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit one" />
                  <div className="orbit two" />
                  <div className="floating-tag tag-js">JS</div>
                  <div className="floating-tag tag-star">
                    <Sparkles />
                  </div>
                  <div className="code-card">
                    <div className="code-header">
                      <i />
                      <i />
                      <i />
                      <span>your-next-win.js</span>
                    </div>
                    <div className="code-lines">
                      <span className="muted">01</span> <b>const</b> journey ={" "}
                      {"{"}
                      <br />
                      <span className="muted">02</span> &nbsp; curiosity:{" "}
                      <em>true</em>,<br />
                      <span className="muted">03</span> &nbsp; progress:{" "}
                      <em>"every day"</em>,<br />
                      <span className="muted">04</span> &nbsp; possibilities:{" "}
                      <em>Infinity</em>
                      <br />
                      <span className="muted">05</span> {"}"};<br />
                      <br />
                      <span className="muted">07</span>{" "}
                      <span className="code-green">journey.start</span>();
                    </div>
                  </div>
                  <div className="passed-float">
                    <span>
                      <Check size={17} />
                    </span>
                    <div>
                      <strong>Small steps. Real skills.</strong>
                      <small>You’ve got this.</small>
                    </div>
                  </div>
                </div>
              </section>
              <section className="stats-grid">
                <Stat
                  icon={<Code2 />}
                  color="mint"
                  value="100"
                  label="Coding challenges"
                  detail="Real tickets, real practice"
                />
                <Stat
                  icon={<Wrench />}
                  color="lavender"
                  value="50"
                  label="Useful study tools"
                  detail="Less friction, more focus"
                />
                <Stat
                  icon={<CheckCircle2 />}
                  color="peach"
                  value={String(completed.size)}
                  label="Challenges completed"
                  detail={`${100 - completed.size} opportunities ahead`}
                />
                <Stat
                  icon={<Zap />}
                  color="yellow"
                  value={String(xp)}
                  label="Experience earned"
                  detail={`Level ${Math.floor(xp / 200) + 1} · Keep going`}
                />
              </section>
              <div className="section-title">
                <div>
                  <h2>Find your next challenge</h2>
                  <p>Small tickets that build big confidence.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate("challenges")}
                >
                  Explore all challenges <ArrowRight size={16} />
                </button>
              </div>
              <div className="challenge-grid">
                {[
                  next,
                  ...allChallenges.filter(
                    (c) =>
                      c.id !== next.id &&
                      ["challenge-021", "challenge-091"].includes(c.id),
                  ),
                ].map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    completed={completed.has(c.id)}
                    saved={progress.bookmarks.includes(c.id)}
                    onOpen={() => {
                      setView("challenges");
                      setSelected(c);
                    }}
                    onBookmark={() => toggleBookmark(c.id)}
                  />
                ))}
              </div>
              <div className="bottom-grid">
                <section className="tool-preview">
                  <div className="section-title">
                    <div>
                      <h2>Your study sidekicks</h2>
                      <p>A useful tool for every little roadblock.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("tools")}
                    >
                      All tools <ArrowRight size={15} />
                    </button>
                  </div>
                  {[studyTools[0], studyTools[40], studyTools[44]].map(
                    (t, i) => (
                      <button
                        className="tool-row"
                        key={t.id}
                        onClick={() => {
                          setView("tools");
                          setTool(t);
                        }}
                      >
                        <span
                          className={`tile-icon ${["lavender", "peach", "mint"][i]}`}
                        >
                          {i === 0 ? (
                            <Code2 />
                          ) : i === 1 ? (
                            <GraduationCap />
                          ) : (
                            <Library />
                          )}
                        </span>
                        <span>
                          <strong>{t.name}</strong>
                          <small>{t.description}</small>
                        </span>
                        <ChevronRight size={18} />
                      </button>
                    ),
                  )}
                </section>
                <section className="daily-note">
                  <span className="note-label">
                    <Lightbulb size={17} />A THOUGHT TO CODE BY
                  </span>
                  <blockquote>
                    “You don’t have to see the whole staircase. Just take the
                    first step.”
                  </blockquote>
                  <div className="note-rule" />
                  <p>
                    Try a challenge. Read the failing test.
                    <br />
                    Change one thing. Try again.
                  </p>
                  <span className="note-doodle" aria-hidden="true">
                    ↗
                  </span>
                </section>
              </div>
            </>
          ) : view === "challenges" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">THE PRACTICE ROOM</div>
                  <h1>
                    Build skills. Ship solutions<span>.</span>
                  </h1>
                  <p>
                    100 JavaScript challenges. Every ticket comes with a clear
                    brief and acceptance tests.
                  </p>
                </div>
                <span className="count-chip">
                  {completed.size} / 100 completed
                </span>
              </div>
              <div className="filter-bar">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search challenges…"
                    aria-label="Search challenges"
                  />
                </label>
                <select
                  aria-label="Difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option>All</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                </select>
                <button
                  className={`button light ${bookmarked ? "selected" : ""}`}
                  onClick={() => setBookmarked(!bookmarked)}
                >
                  <Bookmark size={16} />
                  Saved
                </button>
              </div>
              <div className="category-tabs">
                {["All", ...categories].map((c) => (
                  <button
                    className={category === c ? "active" : ""}
                    key={c}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="results-label">
                {filtered.length} challenges · JavaScript
              </div>
              <div className="challenge-grid">
                {filtered.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    completed={completed.has(c.id)}
                    saved={progress.bookmarks.includes(c.id)}
                    onOpen={() => setSelected(c)}
                    onBookmark={() => toggleBookmark(c.id)}
                  />
                ))}
              </div>
              {!filtered.length && (
                <Empty
                  title="No matching challenges"
                  text="Try another search or clear your filters."
                />
              )}
            </>
          ) : view === "tools" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">A LITTLE HELP GOES A LONG WAY</div>
                  <h1>
                    Your study toolkit<span>.</span>
                  </h1>
                  <p>
                    50 practical tools for code, writing, calculations and a
                    calmer study plan.
                  </p>
                </div>
                <span className="count-chip">50 tools · Free to explore</span>
              </div>
              <label className="search-field full">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find the tool you need…"
                  aria-label="Search tools"
                />
              </label>
              <div className="category-tabs">
                {["All", ...new Set(studyTools.map((t) => t.category))].map(
                  (c) => (
                    <button
                      key={c}
                      className={category === c ? "active" : ""}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ),
                )}
              </div>
              <div className="results-label">
                {filteredTools.length} tools ready to help
              </div>
              <div className="tools-grid">
                {filteredTools.map((t, i) => (
                  <button
                    className="tool-card"
                    key={t.id}
                    onClick={() => setTool(t)}
                  >
                    <span
                      className={`tile-icon ${["mint", "lavender", "peach", "yellow"][i % 4]}`}
                    >
                      <Wrench size={21} />
                    </span>
                    <span className="tool-category">{t.category}</span>
                    <h3>{t.name}</h3>
                    <p>{t.description}</p>
                    <span className="tool-open">
                      Open tool <ArrowRight size={15} />
                    </span>
                  </button>
                ))}
              </div>
              {!filteredTools.length && (
                <Empty
                  title="No matching tools"
                  text="Try a different keyword."
                />
              )}
            </>
          ) : view === "progress" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">EVERY SMALL WIN COUNTS</div>
                  <h1>
                    Look how far you’ve come<span>.</span>
                  </h1>
                  <p>Your learning journey, one solved challenge at a time.</p>
                </div>
                <button
                  className="button light"
                  onClick={() =>
                    download(
                      "devstudy-progress.json",
                      JSON.stringify(progress, null, 2),
                    )
                  }
                >
                  <Download size={16} />
                  Export progress
                </button>
              </div>
              <section className="stats-grid">
                <Stat
                  icon={<CheckCircle2 />}
                  color="mint"
                  value={String(completed.size)}
                  label="Completed"
                  detail="Out of 100 challenges"
                />
                <Stat
                  icon={<Zap />}
                  color="yellow"
                  value={String(xp)}
                  label="Total XP"
                  detail="Earned through practice"
                />
                <Stat
                  icon={<Trophy />}
                  color="peach"
                  value={String(Math.floor(xp / 200) + 1)}
                  label="Current level"
                  detail={`${200 - (xp % 200)} XP to next level`}
                />
                <Stat
                  icon={<Bookmark />}
                  color="lavender"
                  value={String(progress.bookmarks.length)}
                  label="Saved tickets"
                  detail="Ready when you are"
                />
              </section>
              <div className="progress-layout">
                <section className="panel">
                  <h2>Your skill map</h2>
                  <p className="subtle">
                    Explore a category or strengthen what you know.
                  </p>
                  {categories.map((c) => {
                    const list = allChallenges.filter((x) => x.category === c),
                      done = list.filter((x) => completed.has(x.id)).length;
                    return (
                      <button
                        key={c}
                        className="skill-row"
                        onClick={() => {
                          navigate("challenges");
                          setCategory(c);
                        }}
                      >
                        <span>
                          {c}
                          <small>
                            {done}/{list.length}
                          </small>
                        </span>
                        <div className="progress-track">
                          <i
                            style={{ width: `${(done / list.length) * 100}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </section>
                <section className="panel">
                  <h2>Recent wins</h2>
                  <p className="subtle">Proof that you’re moving forward.</p>
                  {progress.completed.length ? (
                    [...progress.completed]
                      .reverse()
                      .slice(0, 8)
                      .map((id) => {
                        const c = allChallenges.find((x) => x.id === id);
                        return (
                          c && (
                            <button
                              key={id}
                              className="recent-win"
                              onClick={() => {
                                setView("challenges");
                                setSelected(c);
                              }}
                            >
                              <CheckCircle2 size={20} />
                              <span>
                                {c.title}
                                <small>{c.category}</small>
                              </span>
                              <b>+{c.xp} XP</b>
                            </button>
                          )
                        );
                      })
                  ) : (
                    <Empty
                      title="Your first win is waiting"
                      text="Complete a challenge to start your story."
                    />
                  )}
                  <button
                    className="button dark"
                    onClick={() => {
                      navigate("challenges");
                      setSelected(next);
                    }}
                  >
                    Keep learning
                    <ArrowRight size={16} />
                  </button>
                </section>
              </div>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">MAKE IT MAKE SENSE</div>
                  <h1>
                    Your thinking space<span>.</span>
                  </h1>
                  <p>
                    Capture an idea, explain a concept in your own words, or
                    plan your next session.
                  </p>
                </div>
                <button
                  className="button light"
                  onClick={() => download("devstudy-notes.md", progress.notes)}
                >
                  <Download size={16} />
                  Export Markdown
                </button>
              </div>
              <section className="notebook panel">
                <div className="editor-top">
                  <span>
                    <FileText size={16} />
                    my-learning-notes.md
                  </span>
                  <small>{storage}</small>
                </div>
                <textarea
                  aria-label="Study notes"
                  placeholder={
                    "# What I learned today\n\nWrite it in your own words.\n\n## Questions to revisit\n\n## Next small step"
                  }
                  value={progress.notes}
                  maxLength={50000}
                  onChange={(e) =>
                    setProgress((p) => ({ ...p, notes: e.target.value }))
                  }
                />
                <div className="notebook-footer">
                  {progress.notes.length.toLocaleString()} / 50,000 characters
                  <span>Saved automatically</span>
                </div>
              </section>
            </>
          )}
          <footer>
            <span>
              <span className="footer-mark">✳</span> Built for curious minds.
            </span>
            <span>{ready ? storage : "Loading your workspace…"}</span>
          </footer>
        </div>
      </main>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Stat({
  icon,
  color,
  value,
  label,
  detail,
}: {
  icon: React.ReactNode;
  color: string;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="stat">
      <span className={`tile-icon ${color}`}>{icon}</span>
      <strong>{value}</strong>
      <h3>{label}</h3>
      <p>{detail}</p>
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <BookOpen size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function ChallengeCard({
  challenge: c,
  completed,
  saved,
  onOpen,
  onBookmark,
}: {
  challenge: Challenge;
  completed: boolean;
  saved: boolean;
  onOpen: () => void;
  onBookmark: () => void;
}) {
  return (
    <article className="challenge-card">
      <div className="card-top">
        <span
          className={`difficulty ${c.difficulty === "Beginner" ? "beginner" : "intermediate"}`}
        >
          {completed ? <Check size={12} /> : <span />}
          {completed ? "Completed" : c.difficulty}
        </span>
        <button
          className={`icon-button ${saved ? "is-saved" : ""}`}
          aria-label={saved ? "Unsave challenge" : "Save challenge"}
          onClick={onBookmark}
        >
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="ticket-meta">
        {c.id.replace("challenge-", "#")}
        <span>·</span>
        {c.kind}
      </div>
      <button className="card-title" onClick={onOpen}>
        <h3>{c.title}</h3>
      </button>
      <p>{c.prompt}</p>
      <div className="card-bottom">
        <span>{c.category}</span>
        <span>
          <Zap size={13} />
          {c.xp} XP
        </span>
        <button aria-label={`Open ${c.title}`} onClick={onOpen}>
          <ArrowRight size={18} />
        </button>
      </div>
    </article>
  );
}
function ChallengeEditor({
  challenge: c,
  draft,
  complete,
  saved,
  onBookmark,
  onBack,
  onDraft,
  onComplete,
}: {
  challenge: Challenge;
  draft?: string;
  complete: boolean;
  saved: boolean;
  onBookmark: () => void;
  onBack: () => void;
  onDraft: (s: string) => void;
  onComplete: () => void;
}) {
  const [code, setCode] = useState(draft ?? c.starter);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [error, setError] = useState("");
  const [hint, setHint] = useState(false);
  const [solution, setSolution] = useState(false);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      worker.current?.terminate();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function edit(s: string) {
    setCode(s);
    onDraft(s);
    setResults(null);
    setError("");
  }
  function run() {
    setRunning(true);
    setResults(null);
    setError("");
    const w = new Worker("/runner.js", { type: "module" });
    worker.current = w;
    const finish = () => {
      w.terminate();
      worker.current = null;
      if (timer.current) clearTimeout(timer.current);
      setRunning(false);
    };
    timer.current = setTimeout(() => {
      finish();
      setError(
        "Execution timed out. Check for an infinite loop and try again.",
      );
    }, 10000);
    w.onerror = () => {
      finish();
      setError("The runner could not start. Reload the page and try again.");
    };
    w.onmessage = (e) => {
      finish();
      if (e.data.error) setError(e.data.error);
      else {
        setResults(e.data.results);
        if (e.data.results.every((r: TestResult) => r.passed)) onComplete();
      }
    };
    w.postMessage({ code, tests: c.tests });
  }
  return (
    <>
      <button className="back-link" onClick={onBack}>
        ← Back to challenges
      </button>
      <div className="page-heading compact">
        <div>
          <div className="eyebrow">
            {c.id.toUpperCase()} · {c.kind.toUpperCase()}
          </div>
          <h1>
            {c.title}
            <span>.</span>
          </h1>
        </div>
        <button
          className={`button light ${saved ? "selected" : ""}`}
          onClick={onBookmark}
        >
          <Bookmark size={16} />
          {saved ? "Saved" : "Save ticket"}
        </button>
      </div>
      <div className="editor-layout">
        <section className="brief panel">
          <div className="brief-label">
            <span className="difficulty beginner">{c.difficulty}</span>
            <span>
              <Zap size={14} />
              {c.xp} XP
            </span>
            {complete && (
              <span className="complete-tag">
                <Check size={14} />
                Complete
              </span>
            )}
          </div>
          <h2>The ticket</h2>
          <p>{c.prompt}</p>
          <div className="contract">
            <Code2 size={17} />
            <div>
              <strong>Your contract</strong>
              <p>
                Write <code>solve(input)</code> and return the result. Use
                synchronous JavaScript and JSON-compatible values.
              </p>
            </div>
          </div>
          <h3>Acceptance examples</h3>
          {c.tests.slice(0, 2).map((t, i) => (
            <div className="example" key={i}>
              <small>EXAMPLE {i + 1}</small>
              <div>
                <b>Input</b>
                <code>{JSON.stringify(t.input)}</code>
              </div>
              <div>
                <b>Output</b>
                <code>{JSON.stringify(t.expected)}</code>
              </div>
            </div>
          ))}
          <button className="hint-toggle" onClick={() => setHint(!hint)}>
            <Lightbulb size={17} />
            {hint ? "Hide hint" : "Need a small hint?"}
            <ChevronRight size={15} />
          </button>
          {hint && <p className="hint-box">{c.hint}</p>}
          <button
            className="text-button solution-toggle"
            onClick={() => setSolution(!solution)}
          >
            {solution
              ? "Hide reference solution"
              : "Study the reference solution"}
          </button>
          {solution && <pre className="reference-code">{c.solution}</pre>}
          <p className="runner-note">
            Practice sandbox · no network, files or browser access. Each test
            runs in a fresh JavaScript environment.
          </p>
        </section>
        <section className="coding-panel">
          <div className="editor-top">
            <span>
              <span className="js-badge">JS</span>solution.js
            </span>
            <button
              className="icon-button"
              aria-label="Reset code"
              onClick={() => edit(c.starter)}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="code-area">
            <div className="line-numbers" aria-hidden="true">
              {code.split("\n").map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <textarea
              aria-label="Code editor"
              spellCheck={false}
              value={code}
              maxLength={30000}
              onChange={(e) => edit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const el = e.currentTarget,
                    start = el.selectionStart,
                    end = el.selectionEnd;
                  edit(code.slice(0, start) + "  " + code.slice(end));
                  requestAnimationFrame(() => {
                    el.selectionStart = el.selectionEnd = start + 2;
                  });
                }
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  if (!running) run();
                }
              }}
            />
          </div>
          <div className="run-toolbar">
            <span>JavaScript · Ctrl + Enter to run</span>
            <button
              className="button mint-button"
              disabled={running}
              onClick={run}
            >
              <Play size={15} />
              {running ? "Running tests…" : "Run tests"}
            </button>
          </div>
          <div className="test-panel" aria-live="polite">
            <div className="test-heading">
              <span>
                <Terminal size={16} />
                Test results
              </span>
              {results && (
                <span
                  className={
                    results.every((r) => r.passed)
                      ? "success-text"
                      : "failure-text"
                  }
                >
                  {results.filter((r) => r.passed).length}/{results.length}{" "}
                  passed
                </span>
              )}
            </div>
            {error && (
              <p role="alert" className="error-box">
                {error}
              </p>
            )}
            {!results && !error && (
              <div className="test-empty">
                <Terminal size={25} />
                <p>
                  {running
                    ? "Putting your solution to the test…"
                    : "Your next small win starts with Run tests."}
                </p>
                <small>{c.tests.length} acceptance tests ready</small>
              </div>
            )}
            {results?.map((r, i) => (
              <div
                className={`test-result ${r.passed ? "pass" : "fail"}`}
                key={i}
              >
                <div>
                  {r.passed ? <CheckCircle2 size={17} /> : <X size={17} />}
                  <strong>Test {i + 1}</strong>
                  <span>{r.passed ? "Passed" : "Needs a little work"}</span>
                </div>
                {!r.passed && (
                  <pre>
                    {r.error ??
                      `Expected: ${JSON.stringify(r.expected)}\nReceived: ${JSON.stringify(r.actual)}`}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
function ToolPanel({
  tool,
  onBack,
  notify,
}: {
  tool: StudyTool;
  onBack: () => void;
  notify: (s: string) => void;
}) {
  const [input, setInput] = useState(tool.example);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  function execute() {
    try {
      setOutput(runTool(tool, input));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOutput("");
    }
  }
  return (
    <>
      <button className="back-link" onClick={onBack}>
        ← Back to study toolkit
      </button>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{tool.category.toUpperCase()}</div>
          <h1>
            {tool.name}
            <span>.</span>
          </h1>
          <p>{tool.description}</p>
        </div>
        <span className="count-chip">Runs privately in your browser</span>
      </div>
      <div className="tool-workspace">
        <section className="panel">
          <div className="section-title">
            <h2>Your input</h2>
            <button
              className="text-button"
              onClick={() => {
                setInput(tool.example);
                setOutput("");
                setError("");
              }}
            >
              <RotateCcw size={14} />
              Load example
            </button>
          </div>
          <textarea
            className="tool-input"
            aria-label="Tool input"
            value={input}
            maxLength={100000}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="button dark" onClick={execute}>
            Run tool <ArrowRight size={16} />
          </button>
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
        </section>
        <section className="panel output-panel">
          <div className="section-title">
            <h2>Your result</h2>
            <div className="output-actions">
              <button
                className="icon-button"
                disabled={!output}
                aria-label="Copy result"
                onClick={() =>
                  navigator.clipboard
                    .writeText(output)
                    .then(() => notify("Result copied"))
                    .catch(() =>
                      notify("Copy unavailable. Use the download button."),
                    )
                }
              >
                <Copy size={17} />
              </button>
              <button
                className="icon-button"
                disabled={!output}
                aria-label="Download result"
                onClick={() => download(`${tool.id}-result.txt`, output)}
              >
                <Download size={17} />
              </button>
            </div>
          </div>
          {output ? (
            <pre className="tool-output" aria-live="polite">
              {output}
            </pre>
          ) : (
            <Empty
              title="A little clarity, coming up"
              text="Try the example or add your own input, then run the tool."
            />
          )}
        </section>
      </div>
    </>
  );
}
