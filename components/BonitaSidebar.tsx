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
  { href: "/", label: "Chat", icon: MessageCircle },
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
          background: "var(--bg-sidebar)",
          borderColor: "var(--bg-surface-light)",
        }}
      >
        <div className="flex flex-col gap-6 p-4">
          <div className="flex items-center gap-3 pt-4 lg:pt-0">
            <BonitaAvatar size="md" />
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
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active ? "border-l-2" : ""
                  }`}
                  style={{
                    borderLeftColor: active ? "var(--bonita-gold)" : "transparent",
                    background: active ? "var(--bonita-gold-glow)" : "transparent",
                    color: active ? "var(--bonita-gold)" : "var(--text-secondary)",
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex-1">
            <CulturalFactCard />
          </div>

          <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--status-online)", boxShadow: "0 0 8px var(--status-glow)" }}
            />
            <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)" }}>
              Bonita is online
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
