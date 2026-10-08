<p align="center">
  <img src="assets/banner.svg" alt="The Wall">
</p>

# The Wall

> A collaborative pixel canvas built by everyone.

**The Wall** is an open-source, real-time collaborative pixel canvas inspired by the idea of a shared digital wall: anyone can place pixels, draw together, erase, zoom, pan, and explore a persistent 10,000 × 10,000 world.

Every pixel is stored in a shared PostgreSQL database through Supabase, allowing the canvas to persist between sessions and synchronize between devices.

**Live:** https://coronadios.github.io/The-Wall/

---
## ✦ Current Version

**The Wall `v1.2.1`**

The Wall uses a three-part semantic versioning format:

```text
MAJOR.MINOR.PATCH
```

* **MAJOR** — major architectural or breaking changes
* **MINOR** — significant new features and capabilities
* **PATCH** — bug fixes, refinements, optimizations, and other non-breaking improvements

### `v1.2.1`

This version includes:

* Persistent pixel storage through Supabase
* Anonymous authentication
* Realtime collaboration
* 10,000 × 10,000 world
* Continuous brush strokes
* Brush interpolation
* `1×1` → `50×50` brush sizes
* Integrated eraser
* Right-click erasing
* Touch and pinch interaction
* Cursor brush preview
* Zoom-centered camera
* Panning and keyboard controls
* Dedicated `world-core.js`
* Paginated pixel loading
* World boundary validation
* Realtime pixel synchronization
* Initial automated world-engine tests
* Canvas and interaction stability fixes
* Persistence and loading fixes

> **v1.2.1 — Every pixel tells a story.**

## ✦ Features

* **10,000 × 10,000 world**
* Real-time collaborative pixel placement
* Persistent storage through Supabase
* Anonymous authentication — no accounts required
* Realtime database synchronization
* Continuous brush strokes
* Brush interpolation to avoid gaps while dragging
* Brush sizes: `1×1`, `2×2`, `3×3`, `5×5`, `10×10`, `25×25`, `50×50`
* Built-in eraser
* Right-click erasing on desktop
* Touch support
* Pinch-to-zoom on mobile
* Mouse wheel zoom
* Middle-click or `Space + drag` for panning
* Keyboard shortcuts
* Cursor-based brush preview
* Pixel coordinate display
* Pixel information panel
* Low-zoom Wall identity
* Responsive mobile interface
* No account system
* No framework required
* GitHub Pages compatible

---

## ◈ How it works

The Wall is intentionally built as a lightweight client-side application.

```text
Browser
   │
   ├── Canvas renderer
   ├── Camera / zoom / pan
   ├── Brush & interaction engine
   │
   ▼
Supabase
   │
   ├── Anonymous Auth
   ├── PostgreSQL
   └── Realtime
```

The browser keeps the currently loaded pixels in memory for rendering.

Supabase acts as the persistent source of truth.

When a user paints:

```text
Pointer input
      ↓
Wall engine
      ↓
placePixels()
      ↓
Supabase PostgreSQL
      ↓
Realtime event
      ↓
All connected clients
```

This means a pixel does not disappear when the page is refreshed or closed.

---

## 🧱 Architecture

The project intentionally uses plain browser technologies instead of a large framework.

```text
The-Wall/
├── index.html
├── style.css
├── config.js
├── splash.js
├── world-core.js
├── wall.js
├── ui.js
├── app.js
├── supabase.js
├── assets/
│   └── favicon.svg
└── tests/
    └── world-core.test.js
```

### `index.html`

The application shell and canvas interface.

It loads:

1. Supabase
2. `world-core.js`
3. `config.js`
4. `splash.js`
5. `supabase.js`
6. `wall.js`
7. `ui.js`
8. `app.js`

The load order matters because the modules use classic browser scripts rather than ES modules.

### `world-core.js`

Contains reusable world logic:

* World dimensions
* Zoom limits
* Coordinate clamping
* Brush geometry
* Line interpolation

It can also be imported by Node-based tests.

### `wall.js`

The main canvas engine.

Responsible for:

* Rendering
* Camera transforms
* Zoom
* Panning
* Pointer interaction
* Touch gestures
* Brush strokes
* Erasing
* Cursor preview
* World boundaries
* Local pixel state

### `supabase.js`

The persistence and networking layer.

Responsible for:

* Anonymous authentication
* Loading pixels
* Writing pixels
* Erasing pixels
* Realtime subscriptions

### `ui.js`

Handles the interface around the canvas:

* Color palette
* Brush size control
* Coordinates
* Zoom indicator
* Pixel counter
* Selected pixel information

### `app.js`

Connects the application layers together.

It initializes authentication, creates the `Wall` instance, loads the persistent world, attaches Realtime updates, and connects painting/erasing to Supabase.

---

# 🚀 Running locally

The Wall is a static web application.

You do not need Node, npm, React, Vite, or a build system to run the frontend.

Clone the repository:

```bash
git clone https://github.com/coronadios/The-Wall.git
cd The-Wall
```

Then serve the directory through a local HTTP server.

For example:

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

Opening `index.html` directly with `file://` is not recommended because browser security restrictions can interfere with the application and external services.

---

# ☁️ Supabase setup

The Wall uses Supabase for authentication, PostgreSQL persistence, and Realtime.

Create a Supabase project and enable:

**Authentication → Providers → Anonymous Sign-Ins**

Then create the `pixels` table.

```sql
create table if not exists public.pixels (
    x integer not null,
    y integer not null,
    color smallint not null,
    user_id uuid not null,
    created_at timestamptz not null default now(),

    constraint pixels_position
        primary key (x, y),

    constraint pixels_x_range
        check (x >= 0 and x < 10000),

    constraint pixels_y_range
        check (y >= 0 and y < 10000),

    constraint pixels_color_range
        check (color >= 0 and color <= 11)
);
```

Enable Row Level Security:

```sql
alter table public.pixels
enable row level security;
```

Allow clients to read pixels:

```sql
create policy "Anyone can read pixels"
on public.pixels
for select
to anon, authenticated
using (true);
```

Allow authenticated users to create pixels:

```sql
create policy "Authenticated users can place pixels"
on public.pixels
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
);
```

Allow authenticated users to update pixels:

```sql
create policy "Users can update pixels"
on public.pixels
for update
to authenticated
using (true)
with check (
    (select auth.uid()) = user_id
);
```

Allow authenticated users to erase pixels:

```sql
create policy "Users can delete pixels"
on public.pixels
for delete
to authenticated
using (true);
```

Enable Realtime:

```sql
alter table public.pixels
replica identity full;
```

Then add `public.pixels` to the `supabase_realtime` publication if it is not already enabled:

```sql
alter publication supabase_realtime
add table public.pixels;
```

---

# 🔑 Client configuration

Create or edit `config.js`:

```javascript
window.THE_WALL_CONFIG = {
    SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
    SUPABASE_ANON_KEY: "YOUR_PUBLISHABLE_KEY"
};
```

The browser should use a **publishable/anonymous client key**, never a Supabase service-role key.

The database remains protected by authentication and Row Level Security.

---

# 🎨 World

The current world is:

```text
Width:   10,000
Height:  10,000

Total positions:
100,000,000 pixels
```

The world uses zero-based coordinates:

```text
X: 0 → 9,999
Y: 0 → 9,999
```

A pixel is uniquely identified by:

```text
(x, y)
```

The database therefore uses `(x, y)` as the primary key.

---

# 🖌️ Brush

The brush uses square geometry.

Available sizes:

```text
1×1
2×2
3×3
5×5
10×10
25×25
50×50
```

Dragging the pointer creates a continuous stroke.

The input engine interpolates between pointer positions so fast movement does not leave unintended gaps.

The same brush geometry is used by the eraser.

Desktop right-click also works as an erase gesture.

---

# 🔎 Camera

The Wall uses a camera model based on:

```text
zoom
offsetX
offsetY
```

Current zoom range:

```text
0.03× → 40×
```

Zooming is centered around the cursor position, keeping the point beneath the cursor stable while zooming.

Supported controls include:

| Action          | Control                |
| --------------- | ---------------------- |
| Zoom in         | Mouse wheel up / `+`   |
| Zoom out        | Mouse wheel down / `-` |
| Reset           | `0`                    |
| Pan             | Middle mouse           |
| Temporary pan   | `Space` + drag         |
| Mobile pan/zoom | Touch gestures         |
| Erase           | Right click / Eraser   |

---

# ⚡ Realtime collaboration

The Wall subscribes to PostgreSQL changes on:

```text
public.pixels
```

The client handles:

```text
INSERT
UPDATE
DELETE
```

When another user modifies the Wall, connected clients receive the change through Supabase Realtime and update their local canvas.

No manual refresh is required for normal realtime synchronization.

---

# 💾 Persistence

Pixels are stored in Supabase PostgreSQL.

The client loads the world in pages instead of relying on a single massive query.

This allows the application to continue loading the Wall as the number of stored pixels grows.

The database is the persistent source of truth; browser memory is only used for the currently rendered state.

---

# 🧪 Tests

The project currently includes Node-based tests for the world engine.

Run:

```bash
node --test tests/world-core.test.js
```

The tests cover:

* World dimensions
* Brush geometry
* World-bound clamping
* Deterministic brush behavior

---

# 🌐 Deployment

The project is compatible with GitHub Pages because the frontend is entirely static.

To deploy through GitHub Pages:

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Select the `main` branch.
4. Deploy from the repository root.

The application does not require a traditional frontend build pipeline.

---

# 🔒 Security notes

The client-side Supabase key is not a secret.

Security should be enforced through:

* Supabase Authentication
* PostgreSQL permissions
* Row Level Security
* Database constraints

Never put a Supabase service-role key in:

```text
config.js
```

or any other browser-accessible file.

---

# 🛠️ Design philosophy

The Wall intentionally stays simple.

There is no:

* account dashboard
* social profile system
* unnecessary framework
* build pipeline
* artificial complexity

The core idea is straightforward:

> **One shared wall. Everyone gets a pixel.**

The interface is deliberately minimal so the canvas remains the main character.

---

# 🗺️ Roadmap

Possible future directions include:

* Better low-zoom rendering
* Chunk-based world loading
* Viewport-aware loading
* Minimap / world overview
* Coordinate navigation
* Shareable camera positions
* Region selection
* Region export
* Offline drawing queue
* More advanced drawing tools
* Performance optimizations for very large worlds
* PWA support
* More sophisticated realtime batching

The goal is to improve the underlying canvas engine without losing the simplicity of the original concept.

---

# 📄 License

The Wall is open source and distributed under the repository's license.

See [`LICENSE`](./LICENSE) for the complete license text.

---

## The Wall

**Built by everyone.**

A pixel is small.
A wall is not.
