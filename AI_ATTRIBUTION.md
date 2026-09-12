# 🤖 AI Attribution & Code Provenance Disclosure

In compliance with Hackathon Originality & Tooling Guidelines:

---

## 📊 Code Composition Breakdown
* **Handcrafted / Human-Authored Code**: **~71%**
* **AI-Assisted / Tooling-Generated Code**: **~29%**

---

## 🏗️ Layer-by-Layer Breakdown

### 1. Frontend Architecture (~75% Human-Authored, ~25% AI-Assisted)
- **Human-Authored**:
  - Core bespoke UI design system & warm organic color palette (`#FBFBF9`, `#0D3B2E`, `#E8F2EC`).
  - React component hierarchy, lifecycle hooks, and context management (`AuthContext`).
  - Streamlined dual-role access control (`donor` & `ngo`) and strict tab guards.
  - Real-time peer messaging lifecycle, notification polling, and cascading location filter logic.
  - Responsive Tailwind CSS layouts, micro-animations, and error boundary protections.
- **AI-Assisted**:
  - Spatial Leaflet map coordinate transformations and bounding box computations.
  - Dynamic 6-digit handover OTP mathematical generator helpers.
  - Custom SVG Leaflet vector pins and radar ripple pulse animations.

### 2. Backend & Database (~50% Human-Authored, ~50% AI-Assisted)
- **Human-Authored**:
  - Relational database entity-relationship schema (`profiles`, `donations`, `messages`, `notifications`, `contacts`).
  - Domain models, custody state transitions (`pending` $\rightarrow$ `accepted` $\rightarrow$ `collected` $\rightarrow$ `in-transit` $\rightarrow$ `delivered`), and foreign key relationships.
  - Role check constraints and API integration contracts.
- **AI-Assisted**:
  - Declarative PostgreSQL Row-Level Security (RLS) policies for cross-role access.
  - Automated timestamp trigger functions (`updated_at` & lifecycle auditing).
  - Supabase Storage bucket policy configurations and migration script boilerplate.

---

## 🛠️ Citations & Tools Used
* **AI Model / Assistant**: Google Gemini / Antigravity Agentic Coding Assistant (used for syntax generation, refactoring, real-time subscription debugging, and boilerplate acceleration).
* **Core Frameworks & Libraries**:
  - [React 19](https://react.dev/) — Modern UI component architecture.
  - [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first styling with bespoke palette.
  - [Lucide React](https://lucide.dev/) — Cohesive vector icon system.
  - [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) — Geospatial mapping and routing radar.
  - [Supabase JS Client](https://supabase.com/docs/reference/javascript) — PostgreSQL database, authentication, real-time channels, and storage bucket integration.
  - [React Hot Toast](https://react-hot-toast.com/) — Non-blocking notification toasts.
