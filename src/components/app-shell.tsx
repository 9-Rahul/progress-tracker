"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  PanelLeft,
  LayoutDashboard,
  Target,
  BarChart3,
  FolderKanban,
  LogOut,
  ArrowUp,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";
import { useAuth } from "@/components/providers";
import { useProjectStore } from "@/hooks/use-project-store";
import { stripEmojis } from "@/lib/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/focus", label: "Focus" },
  { href: "/reports", label: "Reports" }
];

function isActive(pathname: string, href: string) {
  if (href.includes("?")) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { projects, loading, resetData, deleteProject } = useProjectStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const checkScreen = () => {
      const isSmall = window.innerWidth <= 1024;
      setIsMobileOrTablet(isSmall);
      return isSmall;
    };

    checkScreen();
    // Default workspace should be toggled off
    setSidebarOpen(false);

    try {
      localStorage.removeItem("exectrack_sidebar_collapsed");
    } catch {
      // ignore
    }

    const handleResize = () => {
      const small = window.innerWidth <= 1024;
      setIsMobileOrTablet(small);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleNavClick = () => {
    if (isMobileOrTablet) {
      setSidebarOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/auth");
  };

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : user?.name
      ? user.name.slice(0, 2).toUpperCase()
      : "ET";

  return (
    <div
      className={`app-shell ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}
      style={{ fontFamily: "var(--apple-font)" }}
    >
      {/* Mobile/Tablet Backdrop when Fixed Sidebar is opened as an overlay */}
      <AnimatePresence>
        {isMobileOrTablet && sidebarOpen && (
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Persistent Fixed Apple Top Header */}
      <header className="top-header" role="banner">
        {/* Left: Sidebar Toggle + Brand + Desktop Navigation */}
        <div className="top-header-left">
          <button
            type="button"
            className={`apple-header-toggle-btn ${sidebarOpen ? "active" : ""}`}
            onClick={toggleSidebar}
            title={sidebarOpen ? "Hide Workspace" : "Show Workspace"}
            aria-label="Toggle Workspace"
            aria-expanded={sidebarOpen}
          >
            <PanelLeft size={16} strokeWidth={2} />
          </button>

          <Link className="top-header-brand" href="/dashboard">
            <span className="apple-brand-dot" />
            <span className="top-header-brand-name">ExecTrack</span>
          </Link>

          {/* Desktop & Tablet Navigation */}
          <nav className="apple-header-nav" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  className={`apple-header-nav-link ${active ? "active" : ""}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: + New Track (rendered on subpages; on /dashboard the page hero button handles it), User Badge, Sign Out */}
        <div className="top-header-right">
          {pathname !== "/dashboard" && (
            <Link
              href="/dashboard?new=1"
              className="apple-top-new-btn"
              title="Create New Track"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="apple-hide-on-small">New Track</span>
            </Link>
          )}

          <div className="apple-header-user-badge" title={user?.email || "Builder"}>
            <span className="apple-header-avatar">{userInitials}</span>
            <span className="apple-header-user-email apple-hide-on-tablet">
              {user?.email ? user.email.split("@")[0] : "Builder"}
            </span>
          </div>

          <button
            type="button"
            className="apple-header-signout-btn"
            onClick={handleSignOut}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={13} strokeWidth={2} />
            <span className="apple-hide-on-tablet">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Single Fixed Apple macOS-Style Sidebar (Dedicated Tracks Explorer) */}
      <aside className="apple-sidebar" aria-label="Tracks explorer">
        {/* Sidebar Header with Track Count */}
        <div className="apple-sidebar-header">
          <span className="apple-sidebar-brand-title">ACTIVE TRACKS</span>
          <span className="apple-count-pill">{projects.length}</span>
        </div>

        {/* Tracks List */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
            {loading ? (
              <div style={{ padding: "8px 10px", color: "var(--apple-text-tertiary)", fontSize: 12 }}>
                Loading tracks…
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: "16px 10px", color: "var(--apple-text-tertiary)", fontSize: 12, lineHeight: 1.5 }}>
                No active tracks yet. Use &quot;New Track&quot; to begin.
              </div>
            ) : (
              projects.map((project) => {
                const active = pathname === `/projects/${project.id}`;
                return (
                  <div key={project.id} style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <Link
                      className={`apple-track-link ${active ? "active" : ""}`}
                      href={`/projects/${project.id}`}
                      onClick={handleNavClick}
                    >
                      <span className={`apple-status-dot ${project.status}`} />
                      <span className="apple-track-name">{stripEmojis(project.title)}</span>
                      <span className="apple-track-pct">{project.progress}%</span>
                    </Link>
                    <button
                      type="button"
                      className="apple-track-delete-btn"
                      title="Delete track"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteId(project.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Minimalist Sidebar Footer */}
        <div className="apple-sidebar-footer">
          <button
            type="button"
            className="apple-footer-text-btn"
            style={{ width: "100%", textAlign: "center", padding: "4px 0", color: "var(--apple-text-tertiary)" }}
            onClick={() => {
              handleNavClick();
              setResetConfirmOpen(true);
            }}
          >
            Reset Progress
          </button>
        </div>
      </aside>

      {/* Main Workspace Area with Children and Persistent Footer */}
      <motion.main
        key={pathname}
        className="main"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="main-content-area">
          {children}
        </div>

        {/* Apple Workspace Persistent Redesigned Footer */}
        <footer className="apple-workspace-footer">
          <div className="apple-workspace-footer-inner">
            {/* Brand & Status Column */}
            <div className="apple-footer-col brand-col">
              <div className="apple-footer-brand-row">
                <span className="apple-brand-dot" />
                <span className="apple-footer-brand-name">ExecTrack</span>
                <span className="apple-footer-ver-badge">v2.4</span>
              </div>
              <p className="apple-footer-tagline">
                Track execution, not intention. Engineered for high-output builders.
              </p>
              <div className="apple-footer-status-pill">
                <span className="apple-status-pulse-dot" />
                <span className="apple-status-pulse-text">
                  Systems Operational · Local Sync Active
                </span>
              </div>
            </div>

            {/* Navigation Column */}
            <div className="apple-footer-col links-col">
              <p className="apple-footer-col-title">WORKSPACE</p>
              <div className="apple-footer-links-list">
                <Link href="/dashboard" className="apple-footer-link">
                  Overview
                </Link>
                <Link href="/focus" className="apple-footer-link">
                  Focus Mode
                </Link>
                <Link href="/reports" className="apple-footer-link">
                  Analytics & Reports
                </Link>
                <button
                  type="button"
                  className="apple-footer-danger-link"
                  onClick={() => setResetConfirmOpen(true)}
                >
                  Reset Progress
                </button>
              </div>
            </div>

            {/* System Architecture Column (Replacing keyboard shortcuts) */}
            <div className="apple-footer-col arch-col apple-hide-on-small">
              <p className="apple-footer-col-title">ARCHITECTURE</p>
              <div className="apple-footer-arch-list">
                <div className="apple-footer-arch-item">
                  <Zap size={13} className="apple-arch-icon" />
                  <div className="apple-arch-text">
                    <span className="apple-arch-label">High Velocity</span>
                    <span className="apple-arch-desc">Streak anti-drift tracking</span>
                  </div>
                </div>
                <div className="apple-footer-arch-item">
                  <ShieldCheck size={13} className="apple-arch-icon" />
                  <div className="apple-arch-text">
                    <span className="apple-arch-label">Zero Telemetry</span>
                    <span className="apple-arch-desc">Encrypted local persistence</span>
                  </div>
                </div>
                <div className="apple-footer-arch-item">
                  <Activity size={13} className="apple-arch-icon" />
                  <div className="apple-arch-text">
                    <span className="apple-arch-label">Active Flow</span>
                    <span className="apple-arch-desc">Focused execution cycles</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workspace Pulse & Quick Actions Column */}
            <div className="apple-footer-col pulse-col">
              <p className="apple-footer-col-title">WORKSPACE PULSE</p>
              <div className="apple-pulse-card">
                <div className="apple-pulse-item">
                  <span className="apple-pulse-val">{projects.length}</span>
                  <span className="apple-pulse-label">Tracks</span>
                </div>
                <div className="apple-pulse-divider" />
                <div className="apple-pulse-item">
                  <span className="apple-pulse-val">
                    {projects.filter((p) => (p.progress > 0 && p.progress < 100) || p.status === "active").length}
                  </span>
                  <span className="apple-pulse-label">Active</span>
                </div>
                <div className="apple-pulse-divider" />
                <div className="apple-pulse-item">
                  <span className="apple-pulse-val">
                    {projects.filter((p) => p.progress >= 100).length}
                  </span>
                  <span className="apple-pulse-label">Done</span>
                </div>
              </div>
              <button
                type="button"
                className="apple-footer-scroll-top"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Scroll back to top"
              >
                <ArrowUp size={12} strokeWidth={2.4} />
                <span>Back to top</span>
              </button>
            </div>
          </div>

          {/* Bottom Copyright and Meta Tags */}
          <div className="apple-workspace-footer-bottom">
            <p className="apple-footer-copyright">
              © {new Date().getFullYear()} ExecTrack · Built for continuous output. Continuous verified execution.
            </p>
            <div className="apple-footer-meta-tags">
              <span className="apple-meta-pill">v2.4 Production</span>
              <span className="apple-meta-pill">Zero Telemetry</span>
              <span className="apple-meta-pill">Offline First</span>
            </div>
          </div>
        </footer>
      </motion.main>

      {/* Mobile iOS-Style Bottom Tab Bar (Mobile ONLY <= 640px) */}
      <nav className="apple-bottom-tabbar" aria-label="Mobile navigation">
        <Link
          className={`apple-tab-item ${isActive(pathname, "/dashboard") ? "active" : ""}`}
          href="/dashboard"
          onClick={handleNavClick}
        >
          <LayoutDashboard size={18} strokeWidth={isActive(pathname, "/dashboard") ? 2.4 : 1.8} />
          <span>Overview</span>
        </Link>
        <Link
          className={`apple-tab-item ${isActive(pathname, "/focus") ? "active" : ""}`}
          href="/focus"
          onClick={handleNavClick}
        >
          <Target size={18} strokeWidth={isActive(pathname, "/focus") ? 2.4 : 1.8} />
          <span>Focus</span>
        </Link>
        <Link
          className={`apple-tab-item ${isActive(pathname, "/reports") ? "active" : ""}`}
          href="/reports"
          onClick={handleNavClick}
        >
          <BarChart3 size={18} strokeWidth={isActive(pathname, "/reports") ? 2.4 : 1.8} />
          <span>Reports</span>
        </Link>
        <button
          className={`apple-tab-item ${sidebarOpen ? "active" : ""}`}
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle tracks sidebar"
        >
          <FolderKanban size={18} strokeWidth={sidebarOpen ? 2.4 : 1.8} />
          <span>Tracks</span>
        </button>
      </nav>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={async () => {
          await resetData();
          router.push("/dashboard");
          router.refresh();
        }}
        title="Reset All Progress"
        description="Are you sure you want to reset all progress? This will clear your daily logs for all tracks but will NOT delete the tracks themselves."
        confirmLabel="Reset Data"
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteProject(deleteId);
          }
        }}
        title="Delete Track"
        description={`Are you sure you want to delete "${projects.find(p => p.id === deleteId)?.title}"? This cannot be undone.`}
        confirmLabel="Delete Track"
      />
    </div>
  );
}
