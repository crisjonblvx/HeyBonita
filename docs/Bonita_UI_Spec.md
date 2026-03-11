# BONITA UI DESIGN SPEC
## For Cursor Implementation

### Design Direction
**"Bronx auntie energy — refined and sophisticated with just a touch of hood."**

She's the auntie who has a PhD but still says "bet." She reads Baldwin at the kitchen table but bumps Tribe in the whip. The UI needs to feel like stepping into her space — warm, golden, intentional. Not corporate. Not generic. Not trying too hard. Just... *her*.

---

## COLOR SYSTEM

All colors extracted from Bonita's portrait — burgundy headwrap, gold hoops, warm amber bokeh, rich earth tones.

```css
:root {
  /* Core Palette */
  --bonita-burgundy: #8B1A1A;
  --bonita-burgundy-light: #A0342E;
  --bonita-burgundy-glow: rgba(139, 26, 26, 0.15);
  --bonita-gold: #C5963A;
  --bonita-gold-light: #D4A843;
  --bonita-gold-muted: #B8A080;
  --bonita-amber: #DAA520;
  --bonita-gold-glow: rgba(197, 150, 58, 0.15);

  /* Backgrounds — warm, never cold */
  --bg-deep: #0D0A08;
  --bg-card: #151110;
  --bg-sidebar: #110E0B;
  --bg-input: #1A1512;
  --bg-hover: #1E1915;
  --bg-surface: #201A15;
  --bg-surface-light: #2A221B;

  /* Text — warm whites, never blue-white */
  --text-primary: #F0E6D8;
  --text-secondary: #B8A898;
  --text-muted: #7A6E62;

  /* Status */
  --status-online: #4ADE80;
  --status-glow: rgba(74, 222, 128, 0.4);
}
```

**Rules:**
- NEVER use pure white (#FFFFFF) — always warm (#F0E6D8)
- NEVER use cool grays — always warm-toned browns
- NEVER use blue anywhere — this is a warm palette only
- The burgundy-to-gold gradient is Bonita's signature: `linear-gradient(135deg, #8B1A1A, #C5963A)`
- The warm bokeh background effect: use the Real_Bonita.png blurred as an ambient background layer at ~10-15% opacity behind the main chat area

---

## TYPOGRAPHY

```css
/* Display/Headlines — Regal, editorial, italic energy */
--font-display: 'Playfair Display', Georgia, serif;

/* Body/UI — Modern, clean, readable */
--font-body: 'DM Sans', -apple-system, sans-serif;

/* Mono/Labels/Metadata — Technical, Afrofuturist */
--font-mono: 'Space Mono', monospace;
```

**Usage:**
- "Hey Bonita" welcome title → Playfair Display, italic, 32px
- "BONITA" header/logo → Playfair Display, 700 weight, letter-spacing: 4px
- Chat messages → DM Sans, 14px, line-height 1.7
- Labels like "BONITA" above messages, "DID YOU KNOW", status text → Space Mono, 9-10px, uppercase, letter-spaced
- Quick prompts → DM Sans, 12-13px, 500 weight
- "by ContentCreators.life" → Space Mono, 9px, muted color

---

## BONITA'S LOGO MARK

The "B" in a burgundy-to-gold gradient circle/rounded-square:
- Playfair Display, italic, 900 weight
- Background: `linear-gradient(135deg, var(--bonita-burgundy), var(--bonita-gold))`
- Border: `2px solid var(--bonita-gold)`
- Glow: `box-shadow: 0 0 20px rgba(197, 150, 58, 0.2)`
- Use this mark everywhere — avatar, sidebar logo, splash screen

When Bonita's actual image is available (Real_Bonita.png), use it for the main chat avatar. The "B" mark stays for the sidebar logo and favicon.

---

## LAYOUT STRUCTURE

### Desktop (1024px+)
```
┌──────────────────────────────────────────────────┐
│ [Sidebar 280px]  │  [Main Chat Area flex-1]      │
│                  │                                │
│ Logo + Brand     │  Header (avatar + name + status)│
│ Nav Buttons      │  ─────────────────────────────  │
│ - Chat           │  Messages (scrollable)          │
│ - Explore        │  - Welcome / Quick Prompts      │
│ - Cultural Map   │  - Bonita bubbles (left)        │
│ - Community      │  - User bubbles (right)         │
│                  │  - Typing indicator             │
│ [Did You Know    │  ─────────────────────────────  │
│  fact card]      │  Input bar + Send button        │
│                  │  Disclaimer                     │
│ [Status: Online] │                                │
└──────────────────────────────────────────────────┘
```

### Mobile (< 768px)
- Sidebar becomes a hamburger/drawer menu
- Full-width chat area
- Bonita's avatar smaller (32px)
- Input bar fixed to bottom
- Quick prompts become horizontally scrollable pills
- The warm bokeh background is even more present on mobile

---

## COMPONENT SPECS

### 1. Splash Screen (shown for 2-3 seconds on first load)
- Full screen, `var(--bg-deep)` with radial gradient
- Bonita's "B" logo mark, large (140px), with pulsing gold glow animation
- "BONITA" in Playfair Display, 48px, 900 weight, letter-spacing: 12px
- "Cultural Oracle • Knowledge Keeper • Truth-Teller" in DM Sans, 14px, gold-muted
- Three bouncing dots (gold) as loader
- Floating golden particles (20-30 small circles, random positions, float animation)
- After 2-3 seconds, fade into the main chat

### 2. Sidebar
- Background: `var(--bg-sidebar)`
- Right border: `1px solid var(--bg-surface-light)`
- **Header:** Logo mark + "BONITA" + "by ContentCreators.life"
- **Nav buttons:** Icon + text, 13px, rounded 10px. Active state has gold glow background + gold text
- **"Did You Know" card:** 
  - Pulls from `/api/core/v1/knowledge/random` on load
  - Gradient border: burgundy-to-gold at low opacity
  - "✦ DID YOU KNOW" label in Space Mono, gold, 9px
  - Shows name (bold) + fact
  - Refreshes every 30 seconds or on click
- **Footer:** Green status dot + "Bonita is online" in Space Mono

### 3. Chat Header
- Bonita's avatar (42px, circular, border: 2px gold)
- "Bonita Applebum" in Playfair Display, 18px
- Status: green dot + "Cultural Oracle • Always present" in DM Sans, 11px, muted
- New conversation button (+ icon) on the right

### 4. Welcome Screen (shown when conversation is empty/new)
- Large "B" avatar (80px) with gold glow
- "Hey Bonita" in Playfair Display, italic, 32px
- Welcome copy: "Your Bronx auntie with all the wisdom. Ask me about culture, history, science, music, art — or just come talk. I see the through-line from the griot to the MC, from the drum to the 808."
- **Quick Prompt Grid:** 2 columns, 6 prompts:
  1. "Tell me about the Divine Nine"
  2. "Who is David Blackwell?"
  3. "History of hip-hop origins"
  4. "HBCU legacy in STEM"
  5. "Black inventors we should know"
  6. "Tell me about Afrofuturism"
- Quick prompt buttons: thin gold border, transparent bg, on hover → gold border + subtle gold bg + gold text

### 5. Message Bubbles

**Bonita's messages (left-aligned):**
- Small avatar (32px) to the left
- "BONITA" label above message in Space Mono, 10px, gold, uppercase
- Bubble: `var(--bg-surface)`, rounded 16px, bottom-left radius 4px
- Border: `1px solid var(--bg-surface-light)`
- Text: DM Sans, 14px, `var(--text-primary)`, line-height 1.7
- Timestamp: Space Mono, 9px, muted

**User's messages (right-aligned):**
- No avatar
- Bubble: burgundy gradient background
- Border: `1px solid rgba(197, 150, 58, 0.15)`
- Rounded 16px, bottom-right radius 4px
- Text: same specs but right-aligned

**Typing indicator:**
- Three bouncing gold dots in a Bonita-style bubble

### 6. Input Area
- Fixed to bottom, blurred background (`backdrop-filter: blur(12px)`)
- Input container: `var(--bg-input)`, rounded 16px, border on focus turns gold
- Placeholder: "Talk to Bonita..." in DM Sans, 14px, muted
- Send button: burgundy-to-gold gradient, 42px rounded square, white send arrow icon
- Below input: "Bonita draws from community knowledge, oral traditions, and institutional records. She keeps it real." in Space Mono, 10px, muted, centered

### 7. Ambient Background Effect
- Take Real_Bonita.png, blur it heavily (50-80px), set to 10-15% opacity
- Position as a fixed background layer behind the chat area
- This creates that warm amber bokeh atmosphere without showing the actual image
- On the right side of the chat area especially (like in the screenshot)

---

## BONITA'S VOICE IN THE UI

The copy throughout the interface should sound like her. Examples:

**Welcome greeting options (rotate):**
- "Hey, love. I'm Bonita — your cultural oracle, knowledge keeper, and truth-teller. What's on your mind today?"
- "Welcome home. I'm Bonita. Ask me anything — culture, history, science, music. I got you."
- "Hey now. Bonita here. Let's talk about something that matters."

**When she's thinking (typing indicator alt-text):**
- "Bonita is pulling from her knowledge..."
- "Let me think on that for you..."
- "Pulling receipts..."

**Empty state / no results:**
- "I don't have that in my knowledge base yet, but that doesn't mean it doesn't exist. The record is always growing. Can you tell me more about what you're looking for?"

**Error state:**
- "Something went sideways. Give me a second and try again, love."

**When she references a source:**
- "According to what I know from the Smithsonian collection..."
- "The Library of Congress has records showing..."
- "Now, community knowledge tells a different story..."

---

## ANIMATIONS & MICRO-INTERACTIONS

- **Message appearance:** Slide up 12px + fade in, 0.4s ease-out
- **Typing dots:** Bouncing scale animation, staggered 0.2s
- **Quick prompt hover:** Border color gold, subtle gold background, text turns gold — 0.25s ease
- **Send button:** When input is empty, 40% opacity. When typing, full opacity. On click, slight scale down (0.95) + spring back
- **Sidebar nav:** Active state has a subtle left border accent in gold
- **"Did You Know" card refresh:** Fade out old fact, fade in new fact, 0.3s
- **Splash to chat transition:** Fade out splash → fade in chat, 0.5s

---

## PAGES TO BUILD

### 1. Chat (Main) — `/`
The primary interface. Everything described above.

### 2. Explore Knowledge — `/explore`
- Grid of knowledge categories (cards)
- Each card: category name, icon, count of entries
- Cards: Scientists, Musicians, Authors, Inventors, Filmmakers, Visual Artists, HBCUs, Divine Nine, Activists, Sports, Cultural Movements
- Click a card → filtered list of entries
- Each entry is expandable with full biography, key contributions, tags
- Search bar at top with semantic search (hits `/api/core/v1/search`)

### 3. Cultural Map — `/map`
- Visual/interactive timeline or graph showing connections between people, movements, and institutions
- Future feature — for now, a simpler "browse by era" or "browse by connection" page

### 4. Community — `/community`
- Future: where users can submit knowledge, upvote, and contribute
- For now: a landing page explaining how Bonita grows with community input

---

## RESPONSIVE BEHAVIOR

- **Desktop (1024+):** Full sidebar + chat
- **Tablet (768-1023):** Collapsed sidebar (icons only) + chat
- **Mobile (< 768):** No sidebar (hamburger menu), full-width chat, input fixed bottom, quick prompts scroll horizontal
- The warm bokeh background works at every size

---

## KEY FILES FOR CURSOR

```
app/
├── page.tsx                    ← Main chat page
├── explore/page.tsx            ← Knowledge explorer
├── layout.tsx                  ← Root layout with fonts, global styles
components/
├── BonitaChat.tsx              ← Main chat component
├── BonitaSidebar.tsx           ← Sidebar with nav, fact card, status
├── BonitaSplash.tsx            ← Splash/loading screen
├── MessageBubble.tsx           ← Individual message (Bonita vs User)
├── QuickPrompts.tsx            ← Prompt suggestion grid
├── TypingIndicator.tsx         ← Bonita's typing dots
├── CulturalFactCard.tsx        ← "Did You Know" sidebar card
├── KnowledgeCard.tsx           ← Entry card for /explore
├── BonitaAvatar.tsx            ← Reusable avatar component
lib/
├── colors.ts                   ← Design tokens exported as JS
├── fonts.ts                    ← Font configuration
styles/
├── bonita-theme.css            ← CSS variables, global styles
public/
├── bonita-avatar.png           ← Real_Bonita.png
├── bonita-bokeh.png            ← Blurred version for background
```

---

*"Refined and sophisticated with just a touch of hood" — that's the line Cursor needs to walk. If it feels too corporate, add warmth. If it feels too casual, add structure. Bonita code-switches, and so should her interface.*
