# 05. The Design System (The Vibe)

This document establishes the UI visual identity and tokenized styling standards for the **LIVE-MUSIC** retail ecosystem.

---

## 🎸 Aesthetic Blueprint: "Midnight Lounge"
Instead of clinical, stark default blacks and generic tech grays, the showroom and POS dashboard leverage a custom **"Midnight Lounge"** theme. The color choices are intentionally tailored to match the warmth, premium feel, and mood of a high-end physical brick-and-mortar instrument boutique.

---

## 🎨 Core Color Palette

| Token Role | Color Hex Code | Applied Context | Visual Intent / Mood |
| :--- | :--- | :--- | :--- |
| **Primary Accent** | `#d4af37` / `#ffc107` | Buttons, badges, focus states, branding icons. | Evokes brass instruments, premium guitar hardware, and vintage stage lighting. |
| **Deep Tones** | `#1e2229` | Navigation bars, primary table headers, dark UI frames. | Charcoal Slate — softer and more contemporary than pure flat black. |
| **Canvas** | `#faf6ee` / `#f8f9fa` | Full-screen app viewports, main layout backgrounds. | Soft, warm off-white that feels organic, comforting, and high-end. |
| **Cards & Surfaces** | `#ffffff` | Product display cards, interactive intake forms. | Pure floating white surfaces that make rich instrument wood grains and finishes pop. |

---

## 📐 Layout & Surface Rules

### 1. The Canvas & Card Relationship
To create visual depth, components on the dashboard or showroom floor follow a strict layering hierarchy:
*   The base app canvas uses the warm off-white backdrop (`#faf6ee`).
*   Content groups use pure white card modules (`#ffffff`) hovering over the canvas.
*   Cards use subtle, soft shadow utilities (`shadow-sm`) and pronounced rounded corners (`rounded-4` or `1rem / 16px`) to mirror premium instrument edge profiles.

### 2. Media Presentation Rules
Because physical instrument finishes (flamed maple tops, burst polishes, lacquered brass) are the primary conversion drivers, the UI honors the original media shapes:
*   **Aspect Ratio Preservation:** Images must use `object-fit-contain` layout classes within bounded containers.
*   **No Aggressive Clipping:** Never stretch or crop instrument bodies unevenly. Let the warm white backgrounds naturally padding-pad asymmetrical shapes (like bass guitars or odd-shaped FX pedals).

---

## 🔤 Typography & Font Hierarchy

The UI ecosystem follows a strict **Two-Font Hierarchy** to balance modern consumer branding with high-density administrative utility.

### 1. Font Classification & Roles

| Font Class | CSS Class / Stack | Primary Usage | Visual Intent |
| :--- | :--- | :--- | :--- |
| **Primary Sans-Serif** | Default System UI (`sans-serif`) | Brand titles, hero headings, product card names, section labels, and body prose. | Delivers a clean, warm, high-readability consumer experience. |
| **Accent Monospace** | `font-monospace` | Prices, stock counts, SKUs, inventory tables, sales ledgers, status badges, and action buttons. | Creates a precise, technical feel reminiscent of audio spec sheets and transaction terminals. |

### 2. Contextual Application Rules

* **Public Showroom (`frontend-public`)**: Primarily uses sans-serif typography with wide letter-spacing (`fw-black tracking-wider`) for hero headers and product titles. Monospace is reserved for prices, stock status pills, and cart counts.
* **POS Back-Office (`frontend-pos`)**: Heavily utilizes `font-monospace` across inventory tables, form fields, and sales history grids to function as an authentic, high-precision inventory tracking terminal.
* **Shared Components (`Navbar`)**: Ensures uniform brand font styling (`fw-black tracking-wider`) and link sizing (`.nav-link`) across both applications, with monospace applied strictly to utility controls (Cart button, system status badges).