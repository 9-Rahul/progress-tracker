"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { BarChart3, Compass, Focus, LayoutDashboard, LogOut, Menu, Moon, Plus, RotateCcw, Sun, X } from "lucide-react";
import { useAuth, useTheme } from "@/components/providers";
import { useProjectStore } from "@/hooks/use-project-store";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/focus", label: "Focus", icon: Focus },
  { href: "/reports", label: "Reports", icon: BarChart3 }
];

function getPageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/focus") return "Focus";
  if (pathname === "/reports") return "Reports";
  if (pathname.startsWith("/projects/")) return "Track Detail";
  return "ExecTrack";
}

function isActive(pathname: string, href: string) {
  if (href.includes("?")) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, signOutUser } = useAuth();
  const { projects, loading, resetData } = useProjectStore();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/auth");
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset all progress? This will clear your daily logs for all tracks but will NOT delete your tracks.")) {
      await resetData();
      router.push("/dashboard");
      router.refresh();
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="app-shell">
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark" aria-hidden style={{ borderRadius: 4, background: "var(--accent)" }}>
            <Compass size={20} strokeWidth={2.5} />
          </span>
          <span>
            <p className="brand-title" style={{ fontSize: 16, letterSpacing: "-0.02em", fontWeight: 800 }}>ExecTrack</p>
            <p className="brand-caption" style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>Track execution, not intention.</p>
          </span>
        </Link>

        <p className="nav-section-label">General</p>
        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link className={`nav-link ${pathname === item.href ? "active" : ""}`} href={item.href}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="nav-section-label">My Tracks</p>
        <ul className="nav-list" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "8px 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Loading tracks...
            </div>
          ) : projects.length === 0 ? (
            <div style={{ padding: "8px 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No tracks yet.
            </div>
          ) : (
            projects.map((project) => (
              <li key={project.id}>
                <Link
                  className={`nav-link ${pathname === `/projects/${project.id}` ? "active" : ""}`}
                  href={`/projects/${project.id}`}
                >
                  <div className={`status-dot ${project.status}`} style={{ width: 8, height: 8 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {project.title}
                  </span>
                </Link>
              </li>
            ))
          )}
          <li>
            <Link className="nav-link" href="/dashboard?new=1" style={{ color: "var(--accent)", marginTop: 8 }}>
              <Plus size={18} />
              Add New Track
            </Link>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="footer-toolbar">
            <button className="secondary-button" type="button" onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="secondary-button danger" type="button" onClick={handleReset} title="Reset all data">
              <RotateCcw size={17} />
              Reset
            </button>
          </div>

          <div className="user-pill" style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--app-bg-elevated)" }}>
            <span className="avatar" style={{ borderRadius: 4, background: "var(--accent-soft)", color: "var(--accent)" }}>
              {user?.name?.charAt(0) ?? "P"}
            </span>
            <span className="user-details">
              <strong style={{ fontSize: 13, fontWeight: 700 }}>{user?.name ?? "Analyst"}</strong>
              <span className="muted" style={{ fontSize: 11 }}>
                {user?.email ?? "Enterprise Session"}
              </span>
            </span>
            <button className="ghost-button" type="button" style={{ minHeight: 32, padding: "0 8px" }} onClick={handleSignOut}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile / tablet top header ── */}
      <header className="top-header">
        <Link className="top-header-brand" href="/dashboard">
          <span className="brand-mark" aria-hidden style={{ borderRadius: 4, background: "var(--accent)", width: 28, height: 28 }}>
            <Compass size={16} strokeWidth={2.5} />
          </span>
          <span className="top-header-name">ExecTrack</span>
        </Link>

        <span className="top-header-title">{getPageTitle(pathname)}</span>

        <div className="top-header-actions">
          <button
            className="icon-button"
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* ── Page content ── */}
      <motion.main
        key={pathname}
        className="main"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {children}
      </motion.main>

      {/* ── Mobile / tablet bottom nav ── */}
      <nav className="bottom-nav" aria-label="Primary navigation">
        <ul className="bottom-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link className={`bottom-nav-link ${isActive(pathname, item.href) ? "active" : ""}`} href={item.href}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {/* Menu button opens full drawer */}
          <li>
            <button
              className="bottom-nav-link bottom-nav-menu-btn"
              type="button"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={18} />
              Menu
            </button>
          </li>
        </ul>
      </nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={closeDrawer}
              aria-hidden
            />

            {/* Drawer panel */}
            <motion.aside
              className="nav-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              aria-label="Navigation menu"
            >
              {/* Drawer header */}
              <div className="drawer-header">
                <Link className="brand" href="/dashboard" onClick={closeDrawer}>
                  <span className="brand-mark" aria-hidden style={{ borderRadius: 4, background: "var(--accent)" }}>
                    <Compass size={20} strokeWidth={2.5} />
                  </span>
                  <span>
                    <p className="brand-title" style={{ fontSize: 16, letterSpacing: "-0.02em", fontWeight: 800 }}>ExecTrack</p>
                    <p className="brand-caption" style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>Track execution, not intention.</p>
                  </span>
                </Link>
                <button className="icon-button" type="button" aria-label="Close menu" onClick={closeDrawer}>
                  <X size={18} />
                </button>
              </div>

              {/* General nav */}
              <p className="nav-section-label">General</p>
              <ul className="nav-list">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        className={`nav-link ${isActive(pathname, item.href) ? "active" : ""}`}
                        href={item.href}
                        onClick={closeDrawer}
                      >
                        <Icon size={18} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Tracks */}
              <p className="nav-section-label">My Tracks</p>
              <ul className="nav-list drawer-tracks-list">
                {loading ? (
                  <div style={{ padding: "8px 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Loading tracks...
                  </div>
                ) : projects.length === 0 ? (
                  <div style={{ padding: "8px 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No tracks yet.
                  </div>
                ) : (
                  projects.map((project) => (
                    <li key={project.id}>
                      <Link
                        className={`nav-link ${pathname === `/projects/${project.id}` ? "active" : ""}`}
                        href={`/projects/${project.id}`}
                        onClick={closeDrawer}
                      >
                        <div className={`status-dot ${project.status}`} style={{ width: 8, height: 8 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {project.title}
                        </span>
                      </Link>
                    </li>
                  ))
                )}
                <li>
                  <Link className="nav-link" href="/dashboard?new=1" style={{ color: "var(--accent)", marginTop: 8 }} onClick={closeDrawer}>
                    <Plus size={18} />
                    Add New Track
                  </Link>
                </li>
              </ul>

              {/* Drawer footer */}
              <div className="drawer-footer">
                <div className="footer-toolbar">
                  <button className="secondary-button" type="button" onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"}>
                    {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                  </button>
                  <button className="secondary-button danger" type="button" onClick={() => { closeDrawer(); handleReset(); }} title="Reset all data">
                    <RotateCcw size={17} />
                    Reset
                  </button>
                </div>

                <div className="user-pill" style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--app-bg-elevated)" }}>
                  <span className="avatar" style={{ borderRadius: 4, background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {user?.name?.charAt(0) ?? "P"}
                  </span>
                  <span className="user-details">
                    <strong style={{ fontSize: 13, fontWeight: 700 }}>{user?.name ?? "Analyst"}</strong>
                    <span className="muted" style={{ fontSize: 11 }}>
                      {user?.email ?? "Enterprise Session"}
                    </span>
                  </span>
                  <button className="ghost-button" type="button" style={{ minHeight: 32, padding: "0 8px" }} onClick={handleSignOut}>
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
