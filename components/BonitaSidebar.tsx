"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, MessageCircle, BookOpen, Map, Users } from "lucide-react"
import { BonitaAvatar } from "./BonitaAvatar"
import { CulturalFactCard } from "./CulturalFactCard"

type BonitaSidebarProps = {
  isOpen: boolean
  onToggle: () => void
}

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/explore", label: "Explore Knowledge", icon: BookOpen },
  { href: "/map", label: "Cultural Map", icon: Map },
  { href: "/community", label: "Community", icon: Users },
]

export function BonitaSidebar({ isOpen, onToggle }: BonitaSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg lg:hidden"
        style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-20 flex w-[280px] flex-col border-r transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background:
            "radial-gradient(circle at 0 0, rgba(232,184,75,0.08), transparent 55%), radial-gradient(circle at 100% 100%, rgba(197,150,58,0.06), transparent 55%), var(--bg-sidebar)",
          borderColor: "rgba(197, 150, 58, 0.15)",
        }}
      >
        <div className="flex flex-col gap-6 p-4">
          <div className="flex items-center gap-3 pt-4 lg:pt-0">
            <BonitaAvatar size="lg" />
            <div>
              <p
                className="font-bold tracking-wider"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  letterSpacing: "0.15em",
                  color: "var(--text-primary)",
                }}
              >
                BONITA
              </p>
              <p
                className="text-[9px]"
                style={{ fontFamily: "var(--font-body)", color: "var(--bonita-gold-muted)" }}
              >
                by ContentCreators.life
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm transition-all duration-200 border-l-2 ${
                    active ? "" : "border-transparent"
                  }`}
                  style={{
                    borderLeftColor: active ? "var(--bonita-gold-crown)" : "transparent",
                    background: active ? "rgba(197,150,58,0.10)" : "transparent",
                    color: active ? "var(--bonita-gold-crown)" : "var(--text-secondary)",
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-[var(--bonita-gold-crown)]" />
                  <span className="transition-colors group-hover:text-[var(--bonita-gold-crown)]">
                    {label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="flex-1">
            <CulturalFactCard />
          </div>

          <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <span
              className="bonita-status-dot h-2 w-2 rounded-full"
              style={{ background: "var(--status-online)" }}
            />
            <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "var(--bonita-gold-muted)" }}>● Online</span>
            </span>
          </div>
        </div>
      </aside>

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-10 bg-black/50 lg:hidden"
          onClick={onToggle}
          aria-label="Close menu"
        />
      )}
    </>
  )
}
