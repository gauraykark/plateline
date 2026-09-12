# Feed Ferry — Enterprise Food Rescue & Dispatch Network

Feed Ferry is an enterprise-grade surplus food dispatch network connecting commercial food donors (restaurants, caterers, hotels, banquet halls) directly with verified local non-profit food banks and shelters.

## Highlights & Upgrades (v2.0)
- **Zero AI Slop & Refined Aesthetics**: Warm stone background (`#FBFBF9`), Deep Forest Emerald (`#0D3B2E`), bespoke Lucide icon badges, and clean typography.
- **Two-Factor Handover Verification**: 6-digit handover OTP generated on donation acceptance, securely verified by NGO drivers before pickup.
- **Photo Attachments with Supabase Storage**: Donors upload food photographs with live preview and upload to the `donation-photos` bucket.
- **Real-Time Interactive Maps & Leaflet Tracking**: Custom SVG vector pins for donors and shelters, live radar pulse effects, and custody route tracking.
- **In-App Notification Center**: Instant push notifications for dispatch updates, handover confirmations, and message alerts.
- **Urgency Radar & Filters**: Dynamic countdown timers ("Expires in 1h 24m") with color-coded badges, cascading State/District/City selectors, and food category pills.
- **ESG & Impact Analytics**: Bento-grid metrics calculating diverted food (kg), meals provided, CO₂ emissions prevented, freshwater conserved, and downloadable Impact Certificates.

## Architecture
- **Frontend**: React 19, Tailwind CSS v4, Lucide React, React Leaflet, React Hot Toast
- **Backend / Database**: Supabase (PostgreSQL 15+, Row Level Security, Storage, Realtime Postgres Change Subscriptions)

## Quick Start

### 1. Configure Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Run `backend/supabase/schema.sql` in your Supabase SQL editor.
3. Verify that the `donation-photos` bucket is created under Storage.

### 2. Configure Environment Variables
Inside `frontend/`:
```bash
cp .env.example .env.local
```
Add your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run
```bash
cd frontend
npm install
npm run dev
```

## Production Build
```bash
npm run build
```

---

## 📜 Code Provenance & AI Attribution Disclosure

In compliance with Hackathon Submission & Originality Guidelines:

### **Code Composition Breakdown**
* **Handcrafted / Human-Authored Code**: **~71%**
* **AI-Assisted / Tooling-Generated Code**: **~29%**

### **Specific Breakdown by Layer**
1. **Frontend Application (~75% Human-Authored, ~25% AI-Assisted)**:
   - **Human-Authored**: UI design system, React component hierarchy, application state management, role-based access flows (`donor` & `ngo`), real-time chat integration, modal lifecycle, and responsive layout styling with Tailwind CSS.
   - **AI-Assisted**: Spatial Leaflet map coordinate transformations, dynamic OTP mathematical generator helpers, and SVG badge coordinate calculations.

2. **Backend & Database (~50% Human-Authored, ~50% AI-Assisted)**:
   - **Human-Authored**: Relational database architecture, operational domain models, business logic constraints, and API integration contracts.
   - **AI-Assisted**: Complex PostgreSQL Row-Level Security (RLS) declarative syntax policies, automated timestamp update trigger routines, and migration schema boilerplate.

### **Citations & Tools Used**
* **AI Model / Tooling**: Google Gemini / Antigravity Agentic Assistant (Code assistance, syntax generation, and real-time subscription debugging).
* **Frameworks & Libraries**: React 19, Tailwind CSS v4, Lucide React, Leaflet & React-Leaflet, Supabase JS Client.