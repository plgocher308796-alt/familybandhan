# FamilyBandhan platform roadmap

From a WhatsApp-driven landing page to a customer app, admin dashboard, staff assignment system and shared backend — in an order that keeps the business running at every step.

---

## Guiding principles

1. **WhatsApp stays the front door.** Families in India (and NRIs) already live there. Every system below writes to and reads from WhatsApp; nothing forces a parent or a child to install an app on day one.
2. **One backend, many faces.** The website, customer app, staff app and admin dashboard are thin clients over the same API and database. No logic lives only in one client.
3. **Operations first.** The admin dashboard and staff assignment flow are built before the customer app, because they remove the most manual work for a 1–5 person team.
4. **Trust is a feature.** Visit records, photos, approvals and receipts are the product. Design the data model around the "visit", not around the "user".

---

## Phase 0 — Now (done): Website MVP
Static site → WhatsApp form. Zero infra cost. Leads handled manually in WhatsApp.

**Exit criteria:** 20+ enquiries, 5+ paid visits, you know which questions repeat.

---

## Phase 1 — Shared backend (weeks 1–4)

### Stack recommendation
| Layer | Choice | Why |
|---|---|---|
| Database + Auth + Storage | **Supabase** (Postgres) | Row-level security, phone-OTP auth, file storage for visit photos, free tier, Mumbai region available |
| API | Supabase auto-REST + **Edge Functions** (TypeScript) for business logic | No server to manage; add a Node/Fastify service later only if needed |
| Messaging | **WhatsApp Cloud API** (Meta) via a BSP such as Interakt, AiSensy or Gupshup | Templates for visit confirmations and updates; webhooks for inbound |
| Payments | **Razorpay** (UPI, cards, international cards, payment links) | Payment links can be sent over WhatsApp; webhooks confirm plan activation |
| Maps | Google Maps Platform (Places autocomplete, distance) | Address capture, 20 km Care+ radius check |
| Hosting | Vercel (web, admin) · Expo EAS (mobile) | Zero-ops |

### Core data model
```
families        id, primary_contact_name, phone, email, city_of_residence, timezone, preferred_update_hours
elders          id, family_id, name, age, address, geo, mobility_notes, medical_notes, preferred_language, consent_photos
plans           id, family_id, elder_id, vertical (care|saath), type (yearly|monthly|single), visits_per_month, price, starts_at, ends_at, status
services        id, name (hospital|airport|railway|temple|bank|function), vertical, base_price, duration_estimate
bookings        id, family_id, elder_id, service_id, plan_id?, requested_date, time_slot, notes, status
                (requested → confirmed → assigned → in_progress → completed → cancelled), source (web|app|whatsapp|admin)
staff           id, name, phone, photo, id_verified_at, address_verified_at, references_verified_at, skills[], languages[], active
assignments     id, booking_id, staff_id, assigned_by, assigned_at, accepted_at, is_primary_coordinator
visit_reports   id, booking_id, staff_id, started_at, ended_at, summary, checklist jsonb, photos[], sent_to_family_at
expenses        id, booking_id, amount, description, receipt_url, approved_by_family_at, reimbursed_at
payments        id, family_id, plan_id?, booking_id?, amount, razorpay_payment_id, status, paid_at
messages        id, family_id, direction, channel (whatsapp|sms|push), template, payload, sent_at, delivered_at
audit_log       id, actor_id, actor_type, action, entity, entity_id, diff jsonb, at
```

### Key API operations (Edge Functions)
- `POST /bookings` — create booking from website form, app or admin; enforces plan allowance and Care+ radius; sends WhatsApp confirmation template.
- `POST /bookings/:id/assign` — assign staff; checks staff availability and elder's preferred coordinator; notifies staff.
- `POST /visits/:id/report` — staff submits summary + photos; generates the family WhatsApp update with photos; marks expenses pending approval.
- `POST /expenses/:id/approve` — family approves spend (via app or a WhatsApp reply webhook).
- `POST /webhooks/razorpay` — activates plan on payment.
- `POST /webhooks/whatsapp` — inbound messages: new leads auto-create a `families` row + draft booking; "YES" replies approve expenses.

### Website change in Phase 1
Set `FORM_ENDPOINT` in `js/main.js` to the `POST /bookings` function URL. The form then creates a booking record **and** opens WhatsApp — no visible change for the user, but every lead is now in the database.

---

## Phase 2 — Admin dashboard (weeks 3–8)

**Users:** you and 1–2 coordinators. **Stack:** Next.js + shadcn/ui + Supabase, hosted on Vercel. Same teal/gold/ivory tokens.

### Screens
1. **Today board** — kanban of today's bookings by status; red if unassigned within 2 h of request; one-tap "call family" / "WhatsApp family".
2. **Bookings** — table with filters (service, status, area, date); detail drawer with timeline, assignment, visit report, expenses.
3. **Families & elders** — profile, plans, visit allowance used this month, preferred coordinator, notes, consent flags.
4. **Staff** — verification checklist (ID, address, references with dates and document uploads), skills, languages, availability calendar, ratings, visit history.
5. **Plans & payments** — active plans, renewals due in 7 days, send Razorpay payment link, unpaid expenses.
6. **Reports** — visits per week, revenue, repeat rate, time-to-assign, staff utilisation, enquiries by service.
7. **Settings** — services & prices (drives the website via a JSON export), WhatsApp templates, service area radius.

### Automations
- Unassigned booking > 2 h → WhatsApp alert to admin.
- Plan expires in 7 days → renewal payment link to family.
- Visit report submitted → auto-compose family update (photos + checklist) for one-tap send.
- Monthly → statement to each family (visits used, expenses, receipts).

---

## Phase 3 — Staff assignment & staff app (weeks 6–12)

Start with a **PWA / mobile web app** (installable, works on low-end Android, no Play Store delay). Convert to native later only if camera/GPS reliability requires it.

### Assignment logic (v1 is simple and transparent)
1. Filter staff: active, verified, has skill for the service, not already booked in the slot.
2. Rank: elder's preferred coordinator first → same person who did the last visit → closest by home area → fewest visits this week.
3. Admin confirms with one tap; staff gets WhatsApp + push with elder details, address, notes and time; must **Accept** within 30 min or it escalates to the next candidate.

### Staff app screens
- **My visits** (today / upcoming) with address, call buttons, elder notes, checklist for the service type.
- **Start visit** → GPS check-in; **Checklist** (e.g. hospital: reached, doctor met, reports collected, medicines bought); **Photos** (compressed client-side); **Expenses** with receipt photo; **End visit** → summary in Hindi/English; family update preview.
- **Profile & documents** — upload ID, address proof; see verification status.
- **Earnings** — visits completed, payout pending.

### Safety controls
- Photos and location captured only during an active visit.
- Staff never sees payment card details; sees only "approved budget" for expenses.
- Family can rate the visit from the WhatsApp update link; two low ratings flag the staff profile for review.

---

## Phase 4 — Customer mobile app (weeks 10–20)

Build only after Phases 1–3 prove volume. **Stack:** React Native with Expo (one codebase for iOS + Android), Supabase client, Razorpay React Native SDK, Expo push.

### Why an app at all (vs WhatsApp only)
- NRI families want **history**: every visit, photo, expense and receipt in one place.
- **Approvals** with context: see the chemist bill before saying yes.
- **Booking in 3 taps** with saved elders, addresses and preferred coordinator.
- Payments and plan management without back-and-forth.

### Screens
1. **Home** — next visit card, "Book a visit" button, allowance left this month, latest update.
2. **Book** — pick elder → service (same six) → date & slot → notes → confirm (plan allowance or single-visit price shown).
3. **Visits** — timeline with status, assigned coordinator (photo, name, verified badge, call button), live "visit in progress" state, report with photos.
4. **Approvals** — pending expense requests with receipt images; approve / query.
5. **Elders** — profiles, medical & mobility notes, documents vault (Aadhaar, insurance, prescriptions) with controlled sharing to coordinator for a specific visit.
6. **Plans & payments** — current plan, renew, invoices, Razorpay checkout.
7. **Settings** — update hours (timezone-aware), language (English/Hindi), notification channels.

### Launch strategy
- Invite-only to existing paying families first; WhatsApp remains fully supported.
- Hindi UI for the elder-facing "I'm okay" check-in feature later (large buttons, voice note).

---

## Phase 5 — Later
- Multi-city: `cities` table, per-city pricing, staff pools, service-area polygons.
- Partner hospitals/labs with direct report pickup.
- Elder companion device integration (fall detection, SOS) — only with a verified response partner.
- Corporate/NRI-association B2B plans.

---

## Team & cost sketch (Phase 1–3)
- 1 full-stack developer (Next.js + Supabase + React Native), part-time designer, you as product owner.
- Monthly infra at early volume: Supabase ₹0–2,000, Vercel ₹0, WhatsApp BSP ₹1,500–3,000 + per-conversation fees, Razorpay 2% per transaction, Google Maps mostly free tier.
- Non-negotiables before Phase 2 goes live: privacy policy update for photo/location data, staff agreements, data retention rule (e.g. visit photos deleted after 12 months unless family opts to keep).

---

## Immediate next steps (this month)
1. Approve pricing and the five open questions in README.md.
2. Create Supabase project (Mumbai region), run the schema above, set `FORM_ENDPOINT` so leads land in the database.
3. Register WhatsApp Business API via a BSP; design 3 templates: booking confirmation, visit update, renewal reminder.
4. Build the Admin "Today board" first — it is the highest-leverage screen.
