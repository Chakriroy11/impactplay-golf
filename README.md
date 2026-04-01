# ImpactPlay: Golf Charity Platform

A customized, premium subscription-based golf performance platform that combines score tracking, a monthly draw-based reward engine, and automated charitable giving. 

This platform uses the **MERN (React/Express)** stack with **Supabase (PostgreSQL)** handling Database/Storage logic and **Stripe** managing subscription tiers. An emphasis has been placed on an emotion-driven UI utilizing Framer Motion and modern Tailwind CSS over traditional sport-cliché visual design.

## Core Feature Execution Details

1. **Draw Engine Execution (`simulate-draw-engine.js`)**
   The draw algorithm calculates dynamically based on active subscriptions. To test this mathematically prior to live platform usage, we included a simulation memory script:
   ```bash
   cd server
   node scripts/simulate-draw-engine.js
   ```
   **What this does:**
   - Generates 100 fake subscribers in local Node memory with 5 random Stableford scores each.
   - Mathematically calculates the $1,000 mocked pool and strictly splits it into the required 40/35/25 distribution percentages.
   - Calculates any un-won Jackpot properties to simulate Rollover.
   - Drops `1` published Draw record into your Supabase `draws` table so that your actual frontend React Admin panel has historical UI data without polluting your `users` table.

2. **Stripe Workflow Configurator (`setup-stripe.js`)**
   The subscription model relies on strict monthly and yearly plans mapping mathematically back to the draw allocations. To avoid manual error in the Stripe UI, run this automatically:
   ```bash
   cd server
   node scripts/setup-stripe.js
   ```
   **What this does:**
   - Mentions a new Product called `Golf Charity Subscription`.
   - Provisions a £29/$29 base monthly tier and a £290/$290 discounted yearly tier.
   - Binds the required `$10` and `$100` Prize Pool Contribution metadata automatically to these prices.
   - Outputs the `PRICE_IDs` to paste into your `.env`.

3. **Winner Verification System (Admin Action Walkthrough)**
   Because the PRD requires winners to upload a screenshot of their Golf Platform scores for Admin review, we constructed an isolated `winner_proofs` Supabase Storage Bucket. 

   **How an Admin processes these:**
   - When a user gets a Match 3, 4, or 5, an upload portal opens on their React Dashboard allowing them to upload their JPEG/PNG proof directly to their user-scoped Supabase bucket folder.
   - In the `AdminPanel.jsx` (accessible only logic-side to `role: admin`), the Admin selects the "Winner Approvals" modal.
   - Because the Supabase SQL RLS Policy was configured to `FOR ALL USING ... = 'admin'`, the Admin loads all pending `winnings` table items, clicks the `proof_screenshot_url`, and manually compares the 5-score physical screenshot with the array in the database.
   - If it matches, the Admin clicks **[Verify]** which changes the database constraint `payout_status` from `pending` -> `verified`, allowing the external manual Stripe/Bank payout to process locally. The Admin then selects **[Mark Paid]** to finalize.

---

## 🚀 Getting Started

1. Set up a fresh instance of Supabase and Stripe.
2. In Supabase, run the SQL code located in `supabase/schema.sql` within your SQL Editor to immediately provision all typed tables, Row Level Security constraints, and the populated Charity Directory.
3. Rename the `server/.env.example` file to `server/.env` and paste your newly acquired keys inside. 
4. Run the preflight automation start environments:
   ```bash
   # Terminal 1: Backend Express Platform
   cd server
   npm install
   npm run dev  # (Runs check-env.js pre-flight first automatically)

   # Terminal 2: Frontend Vite UI
   cd client
   npm install
   npm run dev
   ```

*The frontend UI strictly avoids conventional imagery while ensuring subscription payment webhooks process strictly inside standard REST methodologies.*
