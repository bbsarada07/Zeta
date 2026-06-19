# ⚡ ZETA 
#   Autonomous Multi-Agent Command Core & Enterprise ERP-CRM HUD

[![Production Build](https://img.shields.io/badge/Build-Stable-emerald?style=flat-square&logo=githubactions)](https://github.com/bbsarada07/Zeta)
[![Architecture](https://img.shields.io/badge/Architecture-Distributed--Agent-blue?style=flat-square)](https://github.com/bbsarada07/Zeta)
[![UI Framework](https://img.shields.io/badge/UI-Tailwind--Hardware--Accelerated-cyan?style=flat-square)](https://github.com/bbsarada07/Zeta)
[![Theme Capability](https://img.shields.io/badge/Theme-Onyx%20%7C%20Alabaster-darkgreen?style=flat-square)](https://github.com/bbsarada07/Zeta)

ZETA is a high-performance, defense-grade administrative interface designed to orchestrate autonomous multi-agent software networks while managing complex global enterprise resource pipelines (ERP/CRM). It bridges cryptographic systems isolation with zero-lag telemetry virtualization.

---

## 🛠️ The Problem Statement

In the era of autonomous AI agents, enterprise operations have become deeply fragmented. Modern companies struggle with three critical operational failures:

* **The Telemetry Visibility Void:** AI agents often run in "black box" environments. Operators cannot monitor asynchronous agent decision loops in real time, leading to hidden runtime bottlenecks and failed transactions that go unnoticed until they aggregate into major fiscal losses.
* **Context Disconnect:** Enterprise tools currently force a hard partition between high-level business management data (Revenue streams, ERP/CRM metrics) and the low-level technical telemetry of the agents powering them. This creates operational silos where decision-makers have no visibility into the AI systems executing their strategy.
* **Projection and Clarity Fragility:** Many existing enterprise dashboards are optimized only for standard desktop viewports. When these interfaces are ported to physical presentation hardware—such as 4K stadium displays, conference room walls, or varied lighting environments—data readability collapses, typography bleaches out, and layout structures break due to poor responsive scaling.

---

## 💡 The Solution

**ZETA** represents a breakthrough in **Unified Administrative Command**. It bridges the gap between raw AI machine-logic and enterprise-grade human decision-making:

* **Real-Time Telemetry Virtualization:** ZETA integrates asynchronous multi-agent execution logs directly into the visual interface layers. Instead of hidden logs, the user sees a "living" command matrix that updates in real time, allowing operators to instantly diagnose agent-level bottlenecks.
* **Unified Relational HUD:** By mapping technical telemetry against core financial metrics (Funnel conversion, revenue tracking, inventory alerts), ZETA provides a single pane of glass for total organizational visibility.
* **Defense-Grade Visual Integrity:** Built on a hardware-accelerated volumetric engine, ZETA ensures that critical alerts are legible from any distance. By enforcing strict padding constraints, layout protections, `tabular-nums` for time-critical data, and adaptive color-profile rendering (Onyx/Alabaster), the UI maintains absolute structural pixel-perfection.

---

## 🎯 Strategic Impact 

ZETA is more than an interface; it is a **Command-and-Control (C2) layer for the AI-first enterprise.**

1. **Zero-Latency Monitoring:** By synchronizing back-end agent telemetry with front-end rendering threads, ZETA allows for sub-millisecond reaction times to system-wide failures.
2. **Hardware-Agnostic Professionalism:** Unlike competitor prototypes that clip or overlap text on changing screen resolutions, ZETA utilizes a custom-built typographic scaling and grid system that preserves document-level clarity under all lighting environments.
3. **Operational Transparency:** ZETA eliminates the "AI Black Box." Every agent action is logged, visualized, and mapped to a specific business outcome, providing a clean audit trail that is critical for security-sensitive enterprise procurement.

---

## 🏗️ System Architecture

```plaintext
                                    [ USER / OPERATOR ]
                                             │
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
            ┌───────────────────────┐                 ┌───────────────────────┐
            │ Terminal Lockscreen   │                 │ Dashboard Control HUD │
            │                       │                 │                       │
            │  • Tabular Time Sync  │                 │  • Total Revenue      │
            │  • Volumetric Core    │                 │  • Funnel Conversion  │
            │  • Security Metrics   │                 │  • Live Diagnostics   │
            └───────────┬───────────┘                 └───────────┬───────────┘
                        │                                         │
                        └────────────────────┬────────────────────┘
                                             ▼
                               ┌───────────────────────────┐
                               │     Global Store Core     │
                               │   (src/store/zetaStore)   │
                               └─────────────┬─────────────┘
                                             ▼
                               ┌───────────────────────────┐
                               │ Multi-Agent Crew Pipeline │
                               │     (Asynchronous Logs)   │
                               └───────────────────────────┘

```

---

## 📂 Project Directory Structure

```plaintext
Zeta/
├── public/                  # Static production assets & platform vector SVGs
├── src/
│   ├── agents/              # Autonomous agent orchestration modules & simulators
│   │   ├── agentRouter.ts   # Asynchronous multi-agent pipeline threads
│   │   └── zetaOrchestrator.ts # Logic sync matching agent computations to store states
│   ├── assets/              # Integrated interface design graphics and media
│   ├── components/          # High-fidelity architectural UI modules
│   │   ├── ui/              # Atomized base layout pieces (buttons, inputs, status tags)
│   │   ├── AdminHRPortal.tsx# Enterprise workforce data dashboard core
│   │   ├── Dashboard.tsx    # Primary CRM/ERP financial control matrix HUD
│   │   ├── Login.tsx        # Gateway security authentication surface
│   │   ├── SecureMailbox.tsx# Encrypted system communications node
│   │   └── TerminalLockscreen.tsx # Volumetric 3D encryption lock system canvas
│   ├── db/                  # Local data persistence emulation & models
│   │   └── dbManager.ts     # In-memory relational state handlers for ledger transactions
│   ├── pages/               # Functional view layouts & sub-routing interceptors
│   ├── store/               # Global Application State Layer
│   │   └── zetaStore.ts     # Global context monitoring core logs & theme Profiles
│   ├── types/               # Strict TypeScript declaration registries
│   │   ├── database.ts      # Schema definitions for data persistence
│   │   └── zeta.ts          # Central type tokens (banishes implicit 'any' overrides)
│   ├── App.tsx              # Core app bootstrapping logic & viewport layout wrappers
│   ├── main.tsx             # DOM engine initializer
│   └── index.css            # Tailored Tailwind configurations & pure 3D transformation matrices
├── tailwind.config.js       # Adaptive custom style utility tokens (Onyx/Alabaster boundaries)
├── tsconfig.json            # Strict-mode TypeScript compilation ruleset
└── vite.config.ts           # Ultra-fast compilation bundler configuration
```

---

## 🔄 Dynamic State & Data Flow Pipeline
To maintain zero-lag visual performance, ZETA maps all operational metrics through a highly responsive state pipeline:

### 1. Telemetry Generation: 
Background agent files (zetaOrchestrator.ts) simulate continuous multi-agent system execution loops, appending timestamped cryptographic entries.

### 2.  Global Store Interception: 
The state controller (zetaStore.ts) catches the incoming streams, formatting logs and calculating metric fluctuations on the fly.

### 3. Component Re-Rendering:

Dashboard.tsx checks the themeProfile configuration to switch color systems across UI cards instantly.

TerminalLockscreen.tsx monitors the array length of incoming logs. The split second a new log registers, it switches the 3D core's rotational speed from baseline idle to a high-speed computational flare.

---

## 🚀 Core Features & High-Value Mechanics

### 1. Volumetric 3D Holographic Encryption Core
Located inside the terminal lock screen component, this core drops flat 2D vector animations for a hardware-accelerated 3D Cylinder Cage Interface leveraging perspective: 1000px and transform-style: preserve-3d.

Dual-Ring Counter-Oscillation: The top and bottom base tracks translate separately across the Z-axis (translateZ(40px) and translateZ(-40px)), rotating in opposing directions to preserve dimensional vertical height without viewport compression.

State-Reactive Velocity Interceptor: The rings dynamically listen to incoming data packets from the backend stream. The baseline rotation velocity of 12s instantly slips into a high-velocity 2s burst spin for exactly 400ms the moment an active agent loop generates a thread response.

### 2. Micro-Typographic Glanceability Scale
Custom font-tracking systems guarantee that numbers and security keys are legible from 10–15 feet away on projection equipment.

Enforces tabular-nums alignment across live-updating clocks to lock structural element positions into place, eliminating layout-shiver as seconds tick over.

### 3. Adaptive Dual-Theme Engine (Onyx / Alabaster)
Onyx Mode: A deep, obsidian-black workspace container mapped around high-contrast emerald highlights (#22c55e) and low-opacity structural zinc matrices.

### Alabaster Mode:
Instantly re-maps all internal containers, text tracking vectors, and side navigation components into light slate surfaces without bleeding out horizontal progress data graphs.

---

## 🧰 Tech Stack

 ### Frontend Engine:
 React 18, TypeScript (100% strict compilation targets, zero implicit any fallbacks)

 ### Styling Framework: 
 Tailwind CSS, Pure CSS 3D Space Transformations Matrix layers

 ### State Management:
 Reactive Architecture Component Store (Global Context Engine tracking theme profiles, user context configurations, and real-time ledger histories)

 ### Build System & Dev Pipeline: 
 Vite, Git, Node.js

--- 

## 💻 Technical Setup Guide
Prerequisites
Ensure you have Node.js (v18+) and npm installed locally.

1. Installation
Clone the repository and install the production dependencies:
```
git clone [https://github.com/bbsarada07/Zeta.git](https://github.com/bbsarada07/Zeta.git)
cd Zeta
npm install
```
2. Local Development Server
Boot up the high-velocity local server instance:
```
npm run dev
```
3. Production Compilation Guardrail
To verify asset compilation and absolute Type safety rules before deploying:
```
npm run build
```
---

## License & Security

License: Distributed under the MIT License.

Security: This repository uses a high-priority .gitignore to prevent the exposure of Google Gemini API keys and sensitive environment variables. 

All previously detected secrets have been fully revoked and rotated.

---

## Developed by Team Zenthra

Focus Theme: Saasum: Unified CRM + ERP

Project Lead: B.Bhuvana Sarada

Hackathon: Summer SaaS Hackathon (2026)

---
