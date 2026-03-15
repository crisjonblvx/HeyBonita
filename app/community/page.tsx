export const dynamic = "force-dynamic"

export default function CommunityPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "4rem 2rem",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🌍</div>
      <h1
        style={{
          color: "white",
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        Community is coming
      </h1>
      <p
        style={{
          color: "#a1a1aa",
          fontSize: "0.875rem",
          maxWidth: "28rem",
          lineHeight: "1.6",
        }}
      >
        This is where your stories, regional histories, and family knowledge will live. Bonita learns
        from the community — and the community grows with Bonita.
      </p>
      <span
        style={{
          color: "#d97706",
          fontSize: "0.75rem",
          marginTop: "1.5rem",
        }}
      >
        Coming soon
      </span>
    </div>
  )
}
