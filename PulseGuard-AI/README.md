# PulseGuard AI

> **"Know what's going wrong before it becomes expensive."**

PulseGuard AI is an AI-powered operations early-warning intelligence platform engineered for small and medium-sized businesses (SMEs).

---

## 1. Core Value Proposition

Traditional business dashboards tell owners:
> *"What happened?"* (e.g., *"Inventory decreased 28%."*)

PulseGuard AI answers:
> 1. **"What is going wrong?"**
> 2. **"Why is it happening?"**
> 3. **"What will happen next?"**
> 4. **"How much could it cost me?"**
> 5. **"What concrete action should I take today?"**

---

## 2. Architecture & Design Principles

* **Deterministic Analytics First**: All metrics (depletion burn rate, lead time delay, risk scores, scenario sensitivity, and financial loss bounds) are computed via strict deterministic mathematical models before AI explanation layers.
* **Grounded Hallucination Prevention**: The "Ask PulseGuard" copilot is strictly bound to verified ledger records. If the requested information is absent, it responds honestly: *"I don't have enough verified data to answer that."* It never fabricates numbers.
* **Human-in-the-Loop Actions**: The AI suggests mitigation actions; human management confirms and marks them as executed.
* **Zero External Network Dependencies**: All SVG icons, charts, and SQLite databases run self-contained with 100% resilience offline.
* **Built-in Demo Dataset**: Includes a 90-day multi-signal dataset for **Heritage Bites** (Restaurant & Delivery business).

---

## 3. Quick Start

### Start Server
Run either:
```powershell
.\start.bat
```
or
```powershell
& "C:\Users\RAKSHA\AppData\Roaming\Antigravity\bin\agy-node.cmd" src/server.js
```

Open your browser at:
```
http://localhost:3000
```

---

## 4. The 3-Minute Hackathon Demo Script

Follow this step-by-step presentation flow:

1. **Open PulseGuard**: Navigate to `http://localhost:3000`. Show the SaaS Landing Page and the core comparison box:
   * *Traditional:* "Inventory decreased 28%."
   * *PulseGuard:* "Chicken inventory is likely to run out in approximately 2.4 days because weekend demand increased 31% while supplier delivery time increased 18%."
2. **Click "Try Demo Business"**: Loads 90 days of verified data for **Heritage Bites**.
3. **Show Business Health Score**: Display the **68 / 100** score and 5-pillar breakdown:
   * Revenue Stability: **78**
   * Inventory Health: **51**
   * Customer Sentiment: **74**
   * Supplier Reliability: **43**
   * Operations: **69**
4. **Hero Alert ("What Needs Attention?")**:
   * Alert: **Potential chicken stockout in approximately 2.4 days**
   * Risk Score: **82 / 100** (Probability: 78%, Impact: ₹18,400–₹25,000, Urgency: High)
   * 4 Signals: Sales +31%, Supplier delay +18%, Inventory -24%, Complaints +17%.
5. **Click "View Evidence"**:
   * Inspect the 4 side-by-side evidence cards.
   * Review the **Visual Root Cause Flow Tree**.
   * Review **"What If I Do Nothing?"** (Cost of Inaction: ₹18,400–₹25,000 lost revenue, 73–96 unserved orders).
6. **Click "What If?"**:
   * Open the interactive scenario simulator.
   * Adjust **Weekend Demand Shift** to **+20%**.
   * Watch the live deterministic recalculation: Days drop to 2.0 days, probability spikes to 88%, Risk Score jumps to 84+, potential loss increases to ₹24,750–₹32,500.
7. **Click "Ask PulseGuard"**:
   * Click prompt chip: *"What should I do today?"*
   * Observe the structured answer:
     * **Answer**: Clear executive mitigation steps.
     * **Evidence**: Verified metrics with specific numbers.
     * **Recommendation**: Immediate vendor contact & secondary supplier activation.
     * **Data Limitation**: Honest scope boundary note.
8. **Click "Actions"**:
   * Review the Action Management table.
   * Click **"Mark Done"** on *Contact Apex Meat Logistics*.
   * Watch the live status update to **Completed / Verified Mitigated**, and the Business Health Score update from 68 to **76 / 100**.
9. **Show "Reports"**:
   * View the print-friendly Executive Business Risk Audit Report.
   * Click **"Print / Save PDF"** to demonstrate formal printable audit generation.
10. **Show "Data & Import"**:
    * Show safe CSV upload with column validation.
    * Click sample download buttons to show available CSV templates.

---

## 5. Active Workspace Recommendation

To work with this repository in Antigravity or VS Code, set your active workspace directory to:
```
C:\Users\RAKSHA\.gemini\antigravity\scratch\pulseguard-ai
```
