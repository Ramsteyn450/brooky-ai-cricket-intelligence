# BROOKY AI — Cricket Intelligence Platform

An interactive cricket performance analytics web application dedicated to **Harry Brook**, styled with an official **England Cricket-inspired visual identity** (Navy Blue `#102B50`, Secondary Blue `#173F70`, England Red `#D7193F`, White `#FFFFFF`, Light Background `#F3F5F9`) and powered by **BROOKY**, a 3D animated virtual cricket analyst with voice recognition and speech synthesis.

## Features

- **8 Interactive Dashboard Pages**
  - **Overview**: 8 real-time KPI cards (Total Runs, Batting Average, Strike Rate, Total Matches, Centuries, Half Centuries, Highest Score, Total Fours & Sixes) plus 6 interactive visualizations.
  - **Performance Analysis**: Seasonal scoring overlays, cumulative batting average trend, strike rate progression, boundary vs running-runs breakdown, score distribution brackets, and dismissal profile.
  - **Match Analysis**: Interactive innings bar timeline, sortable & searchable match-by-match ledger, and slide-over scorecard detail drawer.
  - **Venue Analysis**: Ground-by-ground runs, batting averages, highest scores, and clickable drill-downs.
  - **Opposition Analysis**: Head-to-head runs, averages, strike rates, win rates, and best-performing opposition spotlights.
  - **Format Analysis**: Side-by-side comparison across **Test**, **ODI**, and **T20I** formats plus season-by-format breakdowns.
  - **Recent Matches**: Defaults strictly to the **latest 5 matches** ordered chronologically descending, with a separate **Complete Match History** toggle.
  - **Brooky AI Assistant**: Dedicated full-screen intelligence studio alongside a persistent bottom-right floating assistant widget.
- **Unified Global Filter System**: Multi-select filtering across **Season**, **Format**, **Opposition**, **Venue**, and **Match Type** (Result & Innings) synchronized across all pages with active filter chips and **Clear All Filters**.
- **BROOKY 3D Avatar & Voice Interaction**:
  - Authentic Harry Brook-inspired 3D sports-broadcast portrait with idle breathing, blinking, listening, thinking, and speaking states.
  - Browser speech-to-text input (Web Speech API) and text-to-speech playback (`SpeechSynthesis`).
  - Grounded analytics responses via **Gemini 3.8 Flash** (`@google/genai` Interactions API) when `GEMINI_API_KEY` is configured, with an automatic **Smart Analytics Demonstration Mode** fallback calculated directly from the dataset.
- **Subtle Web Audio UI Sound FX**: Gesture-safe synthesized UI feedback with a global ON/OFF mute toggle.

## Dataset

All metrics and charts are calculated directly from [`Harry_Brook_Tableau_Public_Corrected_Dataset.xlsx`](./Harry_Brook_Tableau_Public_Corrected_Dataset.xlsx) (`85` sample batting innings, `3,920` runs, `49.62` average, `101.3` strike rate, `8` centuries, `23` half-centuries, `150` highest score). Note that the workbook records are synthetic practice records for demonstration purposes rather than official career statistics.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Recharts, Lucide React
- **Backend**: Node.js, Express, ExcelJS, `@google/genai`

## Getting Started

### Prerequisites

- Node.js `>= 20.0.0`
- npm `>= 10.0.0`

### Installation

```bash
npm install
npm --prefix server install
npm --prefix client install
```

### Environment Variables (Optional)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set `GEMINI_API_KEY` to enable live **Gemini 3.8 Flash** responses on the backend. Without a key, BROOKY AI runs in Smart Analytics Demonstration Mode using the Excel dataset.

### Run Locally

Development mode (Vite frontend on `http://localhost:5173` + Express API on `http://localhost:3001`):

```bash
npm run dev
```

Production build and serve (`http://localhost:3001`):

```bash
npm run build
npm start
```

### Run Tests

```bash
npm test
```
