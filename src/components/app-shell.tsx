"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Target,
  BarChart3,
  FolderKanban,
  LogOut
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

    const isSmall = checkScreen();
    if (!isSmall) {
      try {
        const saved = localStorage.getItem("exectrack_sidebar_collapsed");
        if (saved !== null) {
          // If explicitly saved as "false", user deliberately opened it
          setSidebarOpen(saved === "false");
        } else {
          // Hide by default
          setSidebarOpen(false);
        }
      } catch {
        setSidebarOpen(false);
      }
    } else {
      setSidebarOpen(false);
    }

    const handleResize = () => {
      const small = window.innerWidth <= 1024;
      setIsMobileOrTablet(small);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (!isMobileOrTablet) {
        try {
          localStorage.setItem("exectrack_sidebar_collapsed", String(!next));
        } catch {
          // ignore
        }
      }
      return next;
    });
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
  }, [isMobileOrTablet]);

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
            className="apple-header-toggle-btn"
            onClick={toggleSidebar}
            title={sidebarOpen ? "Collapse Sidebar (⌘B)" : "Expand Sidebar (⌘B)"}
            aria-label="Toggle Sidebar"
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

        {/* Right: + New Track, User Badge, Sign Out */}
        <div className="top-header-right">
          <Link
            href="/dashboard?new=1"
            className="apple-top-new-btn"
            title="Create New Track"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="apple-hide-on-small">New Track</span>
          </Link>

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

      {/* Single Fixed Apple macOS-Style Sidebar */}
      <aside className="apple-sidebar" aria-label="Workspace sidebar">
        {/* Sidebar Header with Close Toggle */}
        <div className="apple-sidebar-header">
          <div className="apple-sidebar-brand-title">WORKSPACE</div>
          <button
            type="button"
            className="apple-sidebar-toggle-btn"
            onClick={toggleSidebar}
            title="Close Sidebar (⌘B)"
            aria-label="Close Sidebar"
          >
            <PanelLeftClose size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Quick New Track Action */}
        <Link className="apple-new-btn" href="/dashboard?new=1" onClick={handleNavClick}>
          <span>New Track</span>
        </Link>

        {/* Workspace Nav Links in Sidebar */}
        <div className="apple-sidebar-nav-group">
          <p className="apple-nav-group-title">NAVIGATION</p>
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                className={`apple-nav-link ${active ? "active" : ""}`}
                href={item.href}
                onClick={handleNavClick}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Tracks List */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", marginBottom: 6 }}>
            <p className="apple-nav-group-title" style={{ margin: 0, padding: 0 }}>ACTIVE TRACKS</p>
            <span className="apple-count-pill">{projects.length}</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
            {loading ? (
              <div style={{ padding: "8px 10px", color: "var(--apple-text-tertiary)", fontSize: 12 }}>
                Loading tracks…
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: "8px 10px", color: "var(--apple-text-tertiary)", fontSize: 12 }}>
                No active tracks yet.
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
          <div className="apple-footer-user-row">
            <span className="apple-user-email">
              {user?.email || user?.name || "Builder"}
            </span>
          </div>
          <div className="apple-footer-text-actions">
            <button
              type="button"
              className="apple-footer-text-btn"
              onClick={() => {
                handleNavClick();
                setResetConfirmOpen(true);
              }}
            >
              Reset
            </button>
            <span className="apple-footer-divider">·</span>
            <button
              type="button"
              className="apple-footer-text-btn"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
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

        {/* Apple Workspace Persistent Footer */}
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
              <div className="apple-footer-pulse-row">
                <span className="apple-status-pulse-dot" />
                <span className="apple-status-pulse-text">
                  All systems operational · Local & Cloud sync active
                </span>
              </div>
            </div>

            {/* Keyboard Shortcuts Column */}
            <div className="apple-footer-col shortcuts-col apple-hide-on-small">
              <p className="apple-footer-col-title">KEYBOARD SHORTCUTS</p>
              <div className="apple-footer-shortcuts-list">
                <div className="apple-shortcut-item">
                  <kbd className="apple-footer-kbd">⌘B</kbd>
                  <span>Toggle Sidebar</span>
                </div>
                <div className="apple-shortcut-item">
                  <kbd className="apple-footer-kbd">⌘K</kbd>
                  <span>Quick Action</span>
                </div>
                <div className="apple-shortcut-item">
                  <kbd className="apple-footer-kbd">Esc</kbd>
                  <span>Dismiss Dialogs</span>
                </div>
              </div>
            </div>

            {/* Navigation Column */}
            <div className="apple-footer-col links-col">
              <p className="apple-footer-col-title">WORKSPACE</p>
              <div className="apple-footer-links-list">
                <Link href="/dashboard" className="apple-footer-link">Overview</Link>
                <Link href="/focus" className="apple-footer-link">Focus Mode</Link>
                <Link href="/reports" className="apple-footer-link">Analytics</Link>
                <button
                  type="button"
                  className="apple-footer-danger-link"
                  onClick={() => setResetConfirmOpen(true)}
                >
                  Reset Progress
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright and Meta Tags */}
          <div className="apple-workspace-footer-bottom">
            <p className="apple-footer-copyright">
              © {new Date().getFullYear()} ExecTrack. Continuous improvement through verified output.
            </p>
            <div className="apple-footer-meta-tags">
              <span className="apple-meta-pill">Zero telemetry</span>
              <span className="apple-meta-pill">Offline first</span>
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
