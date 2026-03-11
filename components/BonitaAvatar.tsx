"use client"

type BonitaAvatarProps = {
  size?: "sm" | "md" | "lg"
  /** Set to true when Real_Bonita.png is in public/ for the main chat avatar */
  useImage?: boolean
  className?: string
}

const sizeMap = { sm: 32, md: 42, lg: 80 }

export function BonitaAvatar({ size = "md", useImage = false, className = "" }: BonitaAvatarProps) {
  const px = sizeMap[size]

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bonita-gradient-b bonita-glow-pulse ${className}`}
      style={{
        width: px,
        height: px,
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        fontStyle: "italic",
        color: "var(--text-primary)",
        fontSize: size === "lg" ? "2rem" : size === "md" ? "1.125rem" : "0.875rem",
      }}
    >
      {useImage ? (
        <img
          src="/Real_Bonita.png"
          alt="Bonita"
          width={px}
          height={px}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>B</span>
      )}
    </div>
  )
}
