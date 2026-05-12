"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Flame, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Sparkles,
  ChevronDown,
  BarChart3,
  CalendarDays,
  Clock,
  Shield,
  Focus
} from "lucide-react";
import { formatDate, streakCount, projectStatusLabel, weeklySeries } from "@/lib/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { BarChart, LineChart } from "@/components/ui/charts";

export default function PublicSharePage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPublicData() {
      try {
        const res = await fetch(`/api/public/projects/${id}`);
        if (!res.ok) throw new Error("This track is private or not found.");
        const data = await res.json();
        setProject(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicData();
  }, [id]);

  if (loading) return (
    <div className="share-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="skeleton" style={{ width: 300, height: 40, borderRadius: 20 }} />
    </div>
  );

  if (error || !project) return (
    <div className="share-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: 48, marginBottom: 16 }}>🔒</h1>
        <h2 style={{ fontSize: 24, color: '#fff' }}>Private Track</h2>
        <p style={{ color: '#888', marginTop: 8 }}>{error || "This track hasn't been made public yet."}</p>
        <Link href="/" className="primary-button" style={{ marginTop: 24 }}>
          Start Your Own Track
        </Link>
      </div>
    </div>
  );

  const streak = streakCount(project.logs);
  const completedLogs = project.logs.filter((l: any) => l.status === "completed").length;
  const consistency = project.logs.length > 0 ? Math.round((completedLogs / project.logs.length) * 100) : 0;
  
  const focusScore = Math.min(100, Math.max(0, project.progress + 5));
  const disciplineScore = consistency;
  const followThrough = Math.min(100, Math.max(0, project.progress - 2));

  const timelineData = project.logs.slice(-30).map((l: any) => ({
    date: l.date,
    value: l.status === 'completed' ? 100 : (l.status === 'working' ? 50 : 0)
  }));

  const last7Days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="share-container">
      <header className="share-header">
        <Link href="/" className="share-logo">EXECTRACK</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="share-status">
            <span className="status-dot" />
            <span className="status-text">TRACK ACTIVE</span>
          </div>
          <button className="icon-button" style={{ background: '#111', border: '1px solid #222' }}>
            <Sparkles size={14} color="#fff" />
          </button>
        </div>
      </header>

      <main className="share-grid">
        {/* SIDEBAR */}
        <aside className="share-sidebar">
          {/* Card 1: Streak & Calendar */}
          <section className="card">
            <div className="streak-badge">
              <Flame size={14} fill="currentColor" />
              {streak} DAY STREAK
            </div>

            <div className="mini-calendar">
              {last7Days.map((day, i) => (
                <div key={i} className="cal-day">
                  <span className="cal-label">{day}</span>
                  <div className={`cal-dot ${i === 6 ? 'active' : ''}`} />
                </div>
              ))}
            </div>

            <div className="quote">
              <p className="quote-text">
                "Performance is the result of consistent execution."
              </p>
              <p className="quote-author">— ExecTrack</p>
            </div>
          </section>

          {/* Card 2: Track Health & Bars */}
          <section className="card">
            <p className="card-eyebrow">TRACK HEALTH <ChevronDown size={12} /></p>
            <div className="hexagon-container">
              <svg width="140" height="140" viewBox="0 0 100 100">
                <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" className="hex-base" />
                <polygon points="50,15 85,32 85,68 50,85 15,68 15,32" className="hex-fill" />
              </svg>
              <span className="hex-value">{project.progress}</span>
            </div>

            <div className="metric-bar-group">
              <div className="metric-bar-item">
                <div className="metric-bar-label">
                  <span>Focus</span>
                  <span>{focusScore}%</span>
                </div>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill" style={{ width: `${focusScore}%` }} />
                </div>
              </div>
              <div className="metric-bar-item">
                <div className="metric-bar-label">
                  <span>Discipline</span>
                  <span>{disciplineScore}%</span>
                </div>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill" style={{ width: `${disciplineScore}%` }} />
                </div>
              </div>
              <div className="metric-bar-item">
                <div className="metric-bar-label">
                  <span>Follow Through</span>
                  <span>{followThrough}%</span>
                </div>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill" style={{ width: `${followThrough}%` }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32, background: 'rgba(35, 134, 54, 0.05)', padding: 16, borderRadius: 12 }}>
              <p style={{ color: '#238636', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Keep it up!
              </p>
              <p style={{ color: '#666', fontSize: 11, marginTop: 4 }}>You&apos;re building a strong execution habit.</p>
            </div>
          </section>
        </aside>

        {/* MAIN AREA */}
        <div className="share-main">
          {/* Execution Score */}
          <section className="card score-card">
            <div>
              <p className="card-eyebrow">EXECUTION SCORE</p>
              <div className="score-main-val">
                {project.progress} <span className="score-total-val">/100</span>
              </div>
              <div className="excellent-badge">EXCELLENT</div>
              <p style={{ color: '#666', fontSize: 13, marginTop: 20, maxWidth: 300, lineHeight: 1.6 }}>
                You&apos;re executing at your highest level. Keep maintaining this momentum.
              </p>
            </div>
            <div className="score-ring-wrap">
              <div className="ring-halo" />
              <div style={{ transform: 'scale(1.8)' }}>
                <ProgressRing value={project.progress} size={100} stroke={6} />
              </div>
            </div>
          </section>

          {/* Summary Grid */}
          <div className="summary-grid">
            <div className="card summary-item">
              <div className="summary-icon"><Target size={20} /></div>
              <p className="summary-sub">COMPLETED</p>
              <div className="summary-val">{project.progress}%</div>
              <p className="summary-sub">All tasks completed</p>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 30, opacity: 0.2 }}>
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,35 Q25,25 50,30 T100,10" fill="none" stroke="#238636" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <div className="card summary-item">
              <div className="summary-icon"><CalendarDays size={20} /></div>
              <p className="summary-sub">STREAK</p>
              <div className="summary-val">{streak}d</div>
              <p className="summary-sub">Days in a row</p>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 30, opacity: 0.1 }}>
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#238636" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>
            <div className="card summary-item">
              <div className="summary-icon"><Activity size={20} /></div>
              <p className="summary-sub">CONSISTENCY</p>
              <div className="summary-val">{consistency}%</div>
              <p className="summary-sub">Completion rate</p>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 30, opacity: 0.2 }}>
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <circle cx="10" cy="30" r="1.5" fill="#238636" /><circle cx="30" cy="30" r="1.5" fill="#238636" /><circle cx="50" cy="30" r="1.5" fill="#238636" /><circle cx="70" cy="30" r="1.5" fill="#238636" /><circle cx="90" cy="30" r="1.5" fill="#238636" />
                </svg>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <section className="card">
            <div className="timeline-header">
              <p className="card-eyebrow" style={{ marginBottom: 0 }}>EXECUTION TIMELINE</p>
              <div className="time-range">
                <CalendarDays size={14} />
                Last 30 days
                <ChevronDown size={14} />
              </div>
            </div>
            <div style={{ height: 320, padding: '20px 0' }}>
              <LineChart data={timelineData} />
            </div>
          </section>

          {/* Bottom Grid */}
          <div className="bottom-grid">
            <section className="card">
              <p className="card-eyebrow">EXECUTION INSIGHTS</p>
              <div className="insight-row">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div className="insight-icon-box"><TrendingUp size={18} /></div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Peak Performance</h4>
                    <p style={{ margin: 0, fontSize: 11, color: '#666' }}>You performed best on May 24.</p>
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#238636' }}>76 pts</span>
              </div>
              <div className="insight-row">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div className="insight-icon-box" style={{ color: '#d29922' }}><Clock size={18} /></div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Time to improve</h4>
                    <p style={{ margin: 0, fontSize: 11, color: '#666' }}>Your low was on May 28.</p>
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#d29922' }}>12 pts</span>
              </div>
              <div className="insight-row">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div className="insight-icon-box" style={{ color: '#2f81f7' }}><Activity size={18} /></div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Trend</h4>
                    <p style={{ margin: 0, fontSize: 11, color: '#666' }}>Your performance is improving.</p>
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#2f81f7' }}>↗ 18%</span>
              </div>
            </section>

            <section className="card">
              <p className="card-eyebrow">COMPLETION BREAKDOWN</p>
              <div className="breakdown-dots">
                {Array.from({ length: 80 }).map((_, i) => (
                  <div key={i} className={`dot ${(i < project.logs.length && project.logs[i].status === 'completed') ? 'fill' : ''}`} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 40, marginTop: 40 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#238636' }}>{completedLogs}</div>
                  <div style={{ fontSize: 10, color: '#666', fontWeight: 800 }}>COMPLETED</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#333' }}>{project.logs.length - completedLogs}</div>
                  <div style={{ fontSize: 10, color: '#666', fontWeight: 800 }}>MISSED</div>
                </div>
              </div>
            </section>
          </div>

          {/* Banner */}
          <section className="card footer-banner">
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Level up your execution.</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>Track more. Execute better. Achieve more.</p>
            </div>
            <Link href="/" className="explore-button">
              Explore More Tracks
              <ArrowRight size={18} />
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
