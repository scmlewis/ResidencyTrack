# ResidencyTrack — UK Immigration Compliance & Residency Planning

> A web application for **British National (Overseas) (BN(O))** visa holders to track overseas absences, monitor ILR (Indefinite Leave to Remain) rolling limits, and simulate travel impact — helping you stay compliant on the 5-year route to settlement.

**Live app:** https://scmlewis.github.io/ResidencyTrack/

---

## Who this is for

- BN(O) visa holders and their families on the 5-year route to ILR and British citizenship
- Anyone who travels frequently and needs to keep overseas absences within the statutory limits
- Users who want a private, browser-based tool with **no server and no data leaving your device**

---

## Key features

- **Compliance Dashboard** — at-a-glance view of rolling 180-day ILR limits and naturalisation progression
- **Travel Absence Log** — comprehensive record of all UK departures and returns, with status tracking
- **Absence Analytics Engine** — detailed mathematical breakdown of continuous residence and final-year limits
- **Interactive Residence Calendar** — monthly visual mapping of UK presence, overseas travel, and milestones
- **Immigration Journey Timeline** — five-year continuous residence milestones and earliest settlement eligibility
- **Travel Impact Simulator** — test proposed flight bookings and evaluate absence impact in real time
- **Settings, Data & Policy Rules** — JSON backups, CSV exports, official statutory references, and test suite
- **Local-first storage** — all data saved in your browser (localStorage); nothing is uploaded to any server
- **Dark / Light theme** toggle

---

## How to use

1. Open the [live app](https://scmlewis.github.io/ResidencyTrack/).
2. Click **Immigration Profile** and enter your first UK arrival date and qualifying period start date.
3. Use **Log Overseas Trip** to record each departure and return.
4. Switch between tabs (Dashboard, Travel Log, Analytics, Calendar, Timeline, Simulator) to review compliance.
5. Back up your data anytime via **Settings → Export** (JSON/CSV).

> ⚠️ This tool is for personal planning reference only and is **not legal advice**. Always verify against official UK Home Office guidance.

---

## Run locally

**Prerequisites:** Node.js 18+ (or Bun)

```bash
# Install dependencies
npm install        # or: bun install

# Start dev server
npm run dev        # or: bun run dev

# Type-check
npm run lint

# Run tests
npm run test

# Production build
npm run build
```

The dev server runs at `http://localhost:3000`.

### Environment variables

Copy `.env.example` to `.env.local` and set your Gemini API key if you use AI features:

```bash
cp .env.example .env.local
```

---

## Privacy

- All profile and travel data is stored **locally in your browser**.
- No account, no login, no server-side database.
- Clearing browser data removes your records — export backups regularly.

---

## Tech stack

- React 19 + TypeScript
- Vite 8 + Tailwind CSS 4
- Vitest for unit tests
- GitHub Pages for hosting

---

## Disclaimer

ResidencyTrack is an independent planning aid. It is not affiliated with the UK Home Office and does not constitute immigration or legal advice. Statutory rules may change — always confirm current requirements on [gov.uk](https://www.gov.uk).

---

## License

MIT
