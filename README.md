# 🍳 FlavorCraft — Recipe Finder & Kitchen Companion

A modern, fast, and responsive Recipe Finder application built with **pure HTML5**, **vanilla CSS3**, and **vanilla JavaScript** (no external framework required).

---

## ✨ Features

- **Instant Recipe Search:** Search in real time by recipe title, cuisine, diet tags, or ingredients.
- **Global Web Recipe Search:** Optional toggle to query thousands of worldwide recipes on the fly via the free [TheMealDB](https://www.themealdb.com/) API.
- **Pantry Matcher ("What's In My Fridge?"):** Select or enter ingredients you have at home to see recipes you can make right away with matching percentage badges.
- **Recipe Details Modal:** 
  - **Dynamic Servings Scaler (`-` / `+`):** Automatically recalculates all ingredient amounts in real-time.
  - **Interactive Checklist:** Mark off ingredients as you prep or cook.
  - **Nutrition Breakdown:** Calories, protein, carbs, and fats per serving.
  - **One-Click Kitchen Timer:** Pre-sets and starts a timer matching the recipe's cooking time.
  - **Share & Print:** Copy recipe ingredients and steps to clipboard or trigger a print-friendly view.
- **Floating Kitchen Timer:**
  - Quick presets (`+1m`, `+5m`, `+10m`, `+15m`) and custom minute inputs.
  - Synthesized melodic audio chime when the timer finishes (via Web Audio API).
- **Favorites & Bookmarks:** Save your favorite dishes with persistence across visits via `localStorage`.
- **Dark & Light Mode:** Toggle between sleek dark mode and warm culinary light mode.

---

## 🚀 How to Run

Because this app uses standard web technologies without external build tools, you can run it directly:

### Option 1: Using Python (already active on port 3000)
```bash
python -m http.server 3000
```
Then open your browser at **[http://localhost:3000](http://localhost:3000)**.

### Option 2: Using Node / npx
```bash
npx serve .
```

### Option 3: Direct File Opening
Double-click `index.html` to open it directly in any modern web browser.

---

## 📁 File Structure

```text
Recipe Finder/
├── index.html         # Semantic HTML5 layout and modal structure
├── style.css          # Vanilla CSS design system, dark mode & animations
├── app.js             # State management, search, pantry matcher, timer & modal
├── recipes-data.js    # Curated recipe library with ingredients, nutrition & steps
└── README.md          # Documentation
```
