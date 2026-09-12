# Plateline — Commercial Surplus Dispatch Network

> **🌐 Live Deployment:** [plateline-network.vercel.app](https://plateline-network.vercel.app)  
> **📦 Repository:** [github.com/gauraykark/plateline](https://github.com/gauraykark/plateline)

Plateline is an enterprise-grade surplus food dispatch network connecting commercial food donors (hotels, caterers, banquet halls, restaurants) directly with verified local non-profit food banks and shelters through real-time coordination and cryptographic custody verification.

---

## ⚡ Key Platform Capabilities
- **Zero AI Slop & Refined Aesthetics**: Warm stone background (`#FBFBF9`), Deep Forest Emerald (`#0D3B2E`), bespoke Lucide icon badges, and clean typography.
- **Two-Factor Custody Verification**: 6-digit handover OTP generated on donation acceptance, securely verified by NGO drivers before custody transfer.
- **Real-Time Photo Verification**: Food photograph attachments stored in Supabase Storage buckets with client-side preview.
- **Interactive Proximity Radar & Leaflet Tracking**: Custom SVG vector pins for donors and shelters, live radar pulse effects, and custody route tracking.
- **In-App Notification Center**: Instant push notifications for dispatch updates, handover confirmations, and real-time chat alerts.
- **Urgency Radar & Cascading Filters**: Dynamic countdown timers ("Expires in 1h 24m") with color-coded badges, cascading State/District/City selectors, and food category pills.
- **Automated ESG & Impact Certificates**: Bento-grid metrics calculating diverted food (kg), meals provided, CO₂ emissions prevented, freshwater conserved, and printable ESG Impact Certificates.

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