/**
 * FLAVORCRAFT - APP JAVASCRIPT
 * Full-featured interactive recipe finder & kitchen companion
 */

// Application State
const state = {
  recipes: [...INITIAL_RECIPES],
  favorites: JSON.parse(localStorage.getItem("flavorcraft_favorites") || "[]"),
  activeTab: "explore",
  searchQuery: "",
  activeCategory: "All",
  activeCuisine: "All",
  activeMaxTime: "All",
  sortBy: "rating",
  globalApiEnabled: false,
  selectedPantryIngredients: new Set(),
  activeModalRecipe: null,
  activeServings: 4,
  theme: localStorage.getItem("flavorcraft_theme") || "light",
  
  // Kitchen Timer State
  timerTotalSeconds: 0,
  timerRemainingSeconds: 0,
  timerRunning: false,
  timerIntervalId: null,
  timerAudioCtx: null
};

// DOM Elements
const elements = {
  // Navigation & Tabs
  tabs: document.querySelectorAll(".nav-tab"),
  sections: {
    explore: document.getElementById("sectionExplore"),
    pantry: document.getElementById("sectionPantry"),
    favorites: document.getElementById("sectionFavorites")
  },
  favoritesCount: document.getElementById("favoritesCount"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  
  // Search & Filters
  searchInput: document.getElementById("searchInput"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  globalApiToggle: document.getElementById("globalApiToggle"),
  quickTags: document.querySelectorAll(".quick-tag"),
  categoryChips: document.getElementById("categoryChips"),
  cuisineFilter: document.getElementById("cuisineFilter"),
  timeFilter: document.getElementById("timeFilter"),
  sortBy: document.getElementById("sortBy"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),
  emptyResetBtn: document.getElementById("emptyResetBtn"),
  resultsCountText: document.getElementById("resultsCountText"),
  loadingIndicator: document.getElementById("loadingIndicator"),
  emptyState: document.getElementById("emptyState"),
  recipesGrid: document.getElementById("recipesGrid"),
  
  // Pantry
  pantryIngredientsList: document.getElementById("pantryIngredientsList"),
  customIngredientInput: document.getElementById("customIngredientInput"),
  addCustomIngredientBtn: document.getElementById("addCustomIngredientBtn"),
  selectedPantryCount: document.getElementById("selectedPantryCount"),
  selectedPantryTags: document.getElementById("selectedPantryTags"),
  clearPantryBtn: document.getElementById("clearPantryBtn"),
  pantryRecipesGrid: document.getElementById("pantryRecipesGrid"),
  pantryMatchCountText: document.getElementById("pantryMatchCountText"),
  
  // Favorites
  favoritesGrid: document.getElementById("favoritesGrid"),
  favoritesEmptyState: document.getElementById("favoritesEmptyState"),
  
  // Recipe Modal
  recipeModal: document.getElementById("recipeModal"),
  modalCloseBtn: document.getElementById("modalCloseBtn"),
  modalContent: document.getElementById("modalContent"),
  
  // Timer Widget
  timerToggleBtn: document.getElementById("timerToggleBtn"),
  timerBadge: document.getElementById("timerBadge"),
  kitchenTimerWidget: document.getElementById("kitchenTimerWidget"),
  timerWidgetHeader: document.getElementById("timerWidgetHeader"),
  timerMinimizeBtn: document.getElementById("timerMinimizeBtn"),
  timerCompactDisplay: document.getElementById("timerCompactDisplay"),
  timerDisplay: document.getElementById("timerDisplay"),
  timerStartBtn: document.getElementById("timerStartBtn"),
  timerPauseBtn: document.getElementById("timerPauseBtn"),
  timerResetBtn: document.getElementById("timerResetBtn"),
  timerPresets: document.querySelectorAll(".timer-preset-btn"),
  timerCustomInput: document.getElementById("timerCustomInput"),
  timerSetCustomBtn: document.getElementById("timerSetCustomBtn"),
  
  // Toast
  toastContainer: document.getElementById("toastContainer")
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
function init() {
  applyTheme(state.theme);
  updateFavoritesBadge();
  setupEventListeners();
  setupPantryList();
  renderExploreGrid();
  renderFavoritesGrid();
}

/* ==========================================================================
   EVENT LISTENERS
   ========================================================================== */
function setupEventListeners() {
  // Navigation Tabs
  elements.tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;
      switchTab(targetTab);
    });
  });

  // Theme Toggle
  elements.themeToggleBtn.addEventListener("click", toggleTheme);

  // Search Input
  let debounceTimeout;
  elements.searchInput.addEventListener("input", (e) => {
    const value = e.target.value.trim();
    state.searchQuery = value;
    elements.clearSearchBtn.classList.toggle("visible", value.length > 0);

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (state.globalApiEnabled && value.length >= 3) {
        searchTheMealDB(value);
      } else {
        renderExploreGrid();
      }
    }, 300);
  });

  elements.clearSearchBtn.addEventListener("click", () => {
    elements.searchInput.value = "";
    state.searchQuery = "";
    elements.clearSearchBtn.classList.remove("visible");
    renderExploreGrid();
    elements.searchInput.focus();
  });

  // Global API Toggle
  elements.globalApiToggle.addEventListener("change", (e) => {
    state.globalApiEnabled = e.target.checked;
    if (state.globalApiEnabled && state.searchQuery.length >= 3) {
      searchTheMealDB(state.searchQuery);
    } else {
      renderExploreGrid();
    }
  });

  // Quick Tags
  elements.quickTags.forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag;
      elements.searchInput.value = tag;
      state.searchQuery = tag;
      elements.clearSearchBtn.classList.add("visible");
      renderExploreGrid();
    });
  });

  // Category Filter Chips
  elements.categoryChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;

    elements.categoryChips.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.activeCategory = chip.dataset.category;
    renderExploreGrid();
  });

  // Dropdown Filters
  elements.cuisineFilter.addEventListener("change", (e) => {
    state.activeCuisine = e.target.value;
    renderExploreGrid();
  });

  elements.timeFilter.addEventListener("change", (e) => {
    state.activeMaxTime = e.target.value;
    renderExploreGrid();
  });

  elements.sortBy.addEventListener("change", (e) => {
    state.sortBy = e.target.value;
    renderExploreGrid();
  });

  // Reset Filters
  elements.resetFiltersBtn.addEventListener("click", resetFilters);
  elements.emptyResetBtn.addEventListener("click", resetFilters);

  // Modal interactions
  elements.modalCloseBtn.addEventListener("click", closeModal);
  elements.recipeModal.addEventListener("click", (e) => {
    if (e.target === elements.recipeModal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && elements.recipeModal.classList.contains("open")) {
      closeModal();
    }
    // Quick search shortcut '/'
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
      e.preventDefault();
      elements.searchInput.focus();
    }
  });

  // Pantry Matcher Events
  elements.addCustomIngredientBtn.addEventListener("click", handleAddCustomIngredient);
  elements.customIngredientInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddCustomIngredient();
  });
  elements.clearPantryBtn.addEventListener("click", clearPantrySelection);

  // Timer Events
  elements.timerToggleBtn.addEventListener("click", toggleTimerWidget);
  elements.timerWidgetHeader.addEventListener("click", toggleTimerCollapse);
  elements.timerMinimizeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTimerCollapse();
  });

  elements.timerPresets.forEach(presetBtn => {
    presetBtn.addEventListener("click", () => {
      const secs = parseInt(presetBtn.dataset.seconds, 10);
      setTimerDuration(secs);
    });
  });

  elements.timerSetCustomBtn.addEventListener("click", () => {
    const mins = parseFloat(elements.timerCustomInput.value);
    if (!isNaN(mins) && mins > 0) {
      setTimerDuration(Math.round(mins * 60));
      elements.timerCustomInput.value = "";
    }
  });

  elements.timerStartBtn.addEventListener("click", startTimer);
  elements.timerPauseBtn.addEventListener("click", pauseTimer);
  elements.timerResetBtn.addEventListener("click", resetTimer);
}

/* ==========================================================================
   THEME TOGGLING
   ========================================================================== */
function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("flavorcraft_theme", theme);
  state.theme = theme;
}

function toggleTheme() {
  const newTheme = state.theme === "light" ? "dark" : "light";
  applyTheme(newTheme);
  showToast(`Switched to ${newTheme} mode`);
}

/* ==========================================================================
   TAB NAVIGATION
   ========================================================================== */
function switchTab(tabId) {
  state.activeTab = tabId;

  // Update tab buttons
  elements.tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === tabId);
  });

  // Show corresponding section
  Object.keys(elements.sections).forEach(key => {
    elements.sections[key].classList.toggle("active", key === tabId);
  });

  if (tabId === "favorites") {
    renderFavoritesGrid();
  } else if (tabId === "pantry") {
    renderPantryMatches();
  } else {
    renderExploreGrid();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ==========================================================================
   EXPLORE RECIPES & FILTERING
   ========================================================================== */
function getFilteredRecipes() {
  return state.recipes.filter(recipe => {
    // Search query matching
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const inTitle = recipe.title.toLowerCase().includes(q);
      const inCuisine = recipe.cuisine.toLowerCase().includes(q);
      const inDesc = recipe.description && recipe.description.toLowerCase().includes(q);
      const inTags = recipe.tags && recipe.tags.some(t => t.toLowerCase().includes(q));
      const inIngredients = recipe.ingredients.some(ing => ing.name.toLowerCase().includes(q));

      if (!inTitle && !inCuisine && !inDesc && !inTags && !inIngredients) {
        return false;
      }
    }

    // Category filter
    if (state.activeCategory !== "All") {
      if (recipe.category.toLowerCase() !== state.activeCategory.toLowerCase()) {
        return false;
      }
    }

    // Cuisine filter
    if (state.activeCuisine !== "All") {
      if (recipe.cuisine.toLowerCase() !== state.activeCuisine.toLowerCase()) {
        return false;
      }
    }

    // Time filter
    if (state.activeMaxTime !== "All") {
      const maxTime = parseInt(state.activeMaxTime, 10);
      const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
      if (totalTime > maxTime) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (state.sortBy === "rating") {
      return (b.rating || 0) - (a.rating || 0);
    } else if (state.sortBy === "time") {
      const totalA = (a.prepTime || 0) + (a.cookTime || 0);
      const totalB = (b.prepTime || 0) + (b.cookTime || 0);
      return totalA - totalB;
    } else if (state.sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else if (state.sortBy === "calories") {
      return (a.calories || 999) - (b.calories || 999);
    }
    return 0;
  });
}

function renderExploreGrid() {
  const filtered = getFilteredRecipes();
  elements.resultsCountText.textContent = `Showing ${filtered.length} recipe${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    elements.recipesGrid.innerHTML = "";
    elements.emptyState.classList.remove("hidden");
  } else {
    elements.emptyState.classList.add("hidden");
    elements.recipesGrid.innerHTML = filtered.map(recipe => createRecipeCardHTML(recipe)).join("");
    attachCardListeners(elements.recipesGrid);
  }
}

function resetFilters() {
  state.searchQuery = "";
  elements.searchInput.value = "";
  elements.clearSearchBtn.classList.remove("visible");

  state.activeCategory = "All";
  elements.categoryChips.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("active", c.dataset.category === "All");
  });

  state.activeCuisine = "All";
  elements.cuisineFilter.value = "All";

  state.activeMaxTime = "All";
  elements.timeFilter.value = "All";

  state.sortBy = "rating";
  elements.sortBy.value = "rating";

  renderExploreGrid();
  showToast("Filters reset");
}

/* ==========================================================================
   THEMEALDB API LIVE GLOBAL SEARCH
   ========================================================================== */
async function searchTheMealDB(query) {
  elements.loadingIndicator.classList.remove("hidden");
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    if (data.meals && data.meals.length > 0) {
      const fetchedRecipes = data.meals.map(meal => {
        // Parse ingredients from TheMealDB format
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ing = meal[`strIngredient${i}`];
          const measure = meal[`strMeasure${i}`];
          if (ing && ing.trim()) {
            ingredients.push({
              name: ing.trim(),
              amount: 1,
              unit: measure ? measure.trim() : ""
            });
          }
        }

        // Clean instructions into step array
        const rawSteps = meal.strInstructions || "";
        const instructions = rawSteps
          .split(/\r?\n+/)
          .map(s => s.trim())
          .filter(s => s.length > 10);

        return {
          id: `mealdb_${meal.idMeal}`,
          title: meal.strMeal,
          category: meal.strCategory || "Dinner",
          cuisine: meal.strArea || "Global",
          prepTime: 15,
          cookTime: 25,
          servings: 4,
          difficulty: "Medium",
          rating: 4.8,
          reviews: 45,
          image: meal.strMealThumb,
          description: `Delicious ${meal.strArea || ''} style ${meal.strMeal} prepared with fresh ingredients.`,
          calories: 450,
          protein: "28g",
          carbs: "45g",
          fat: "18g",
          ingredients: ingredients.length > 0 ? ingredients : [{ name: "Main ingredient", amount: 1, unit: "serving" }],
          instructions: instructions.length > 0 ? instructions : [rawSteps],
          tags: meal.strTags ? meal.strTags.split(",") : ["Global Recipe"]
        };
      });

      // Merge newly fetched recipes avoiding duplicates
      fetchedRecipes.forEach(newRec => {
        if (!state.recipes.some(r => r.id === newRec.id)) {
          state.recipes.push(newRec);
        }
      });
    }
  } catch (err) {
    console.error("TheMealDB API fetch error:", err);
  } finally {
    elements.loadingIndicator.classList.add("hidden");
    renderExploreGrid();
  }
}

/* ==========================================================================
   RECIPE CARD HTML BUILDER
   ========================================================================== */
function createRecipeCardHTML(recipe, extraBadge = "") {
  const isFav = state.favorites.includes(recipe.id);
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return `
    <article class="recipe-card" data-id="${recipe.id}">
      <div class="card-image-wrap">
        <img class="card-img" src="${recipe.image}" alt="${recipe.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'">
        <span class="card-category-badge">${recipe.category}</span>
        <button class="card-favorite-btn ${isFav ? 'favorited' : ''}" data-fav-id="${recipe.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" aria-label="Favorite recipe">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>
      </div>

      <div class="card-body">
        ${extraBadge}
        <div class="card-meta-row">
          <span class="card-cuisine">${recipe.cuisine}</span>
          <span class="card-rating">★ ${recipe.rating || 4.8} <small style="color:var(--text-subtle);">(${recipe.reviews || 50})</small></span>
        </div>

        <h3 class="card-title">${recipe.title}</h3>
        <p class="card-description">${recipe.description || ''}</p>

        <div class="card-specs">
          <span class="spec-item">
            <span class="spec-icon">⏱️</span>
            <span>${totalTime} mins</span>
          </span>
          <span class="spec-item">
            <span class="spec-icon">🔥</span>
            <span>${recipe.calories ? recipe.calories + ' kcal' : 'Healthy'}</span>
          </span>
          <span class="spec-item">
            <span class="spec-icon">⚡</span>
            <span>${recipe.difficulty || 'Easy'}</span>
          </span>
        </div>
      </div>
    </article>
  `;
}

function attachCardListeners(container) {
  // Favorite button click
  container.querySelectorAll(".card-favorite-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.favId;
      toggleFavorite(id);
    });
  });

  // Card click opens modal
  container.querySelectorAll(".recipe-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const recipe = state.recipes.find(r => r.id === id);
      if (recipe) {
        openRecipeModal(recipe);
      }
    });
  });
}

/* ==========================================================================
   FAVORITES MANAGEMENT
   ========================================================================== */
function toggleFavorite(id) {
  const index = state.favorites.indexOf(id);
  const recipe = state.recipes.find(r => r.id === id);
  const name = recipe ? recipe.title : "Recipe";

  if (index > -1) {
    state.favorites.splice(index, 1);
    showToast(`Removed "${name}" from favorites`);
  } else {
    state.favorites.push(id);
    showToast(`Saved "${name}" to favorites! ⭐`);
  }

  localStorage.setItem("flavorcraft_favorites", JSON.stringify(state.favorites));
  updateFavoritesBadge();

  // Re-render relevant grids
  if (state.activeTab === "favorites") {
    renderFavoritesGrid();
  } else if (state.activeTab === "pantry") {
    renderPantryMatches();
  } else {
    renderExploreGrid();
  }

  // Update active modal button if opened
  if (state.activeModalRecipe && state.activeModalRecipe.id === id) {
    updateModalFavButton();
  }
}

function updateFavoritesBadge() {
  const count = state.favorites.length;
  elements.favoritesCount.textContent = count;
}

function renderFavoritesGrid() {
  const favRecipes = state.recipes.filter(r => state.favorites.includes(r.id));
  
  if (favRecipes.length === 0) {
    elements.favoritesGrid.innerHTML = "";
    elements.favoritesEmptyState.classList.remove("hidden");
  } else {
    elements.favoritesEmptyState.classList.add("hidden");
    elements.favoritesGrid.innerHTML = favRecipes.map(recipe => createRecipeCardHTML(recipe)).join("");
    attachCardListeners(elements.favoritesGrid);
  }
}

/* ==========================================================================
   PANTRY / "WHAT'S IN MY FRIDGE" MATCHER
   ========================================================================== */
function setupPantryList() {
  elements.pantryIngredientsList.innerHTML = COMMON_PANTRY_INGREDIENTS.map(ing => `
    <button class="pantry-tag-btn" data-ingredient="${ing}">
      + ${ing}
    </button>
  `).join("");

  elements.pantryIngredientsList.querySelectorAll(".pantry-tag-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const ing = btn.dataset.ingredient;
      togglePantryIngredient(ing, btn);
    });
  });
}

function togglePantryIngredient(ingredient, btnElement = null) {
  const normalized = ingredient.trim().toLowerCase();
  
  if (state.selectedPantryIngredients.has(normalized)) {
    state.selectedPantryIngredients.delete(normalized);
  } else {
    state.selectedPantryIngredients.add(normalized);
  }

  // Update tag button class if available
  if (btnElement) {
    btnElement.classList.toggle("selected", state.selectedPantryIngredients.has(normalized));
  } else {
    // Sync all preset buttons
    elements.pantryIngredientsList.querySelectorAll(".pantry-tag-btn").forEach(btn => {
      const match = btn.dataset.ingredient.toLowerCase() === normalized;
      if (match) {
        btn.classList.toggle("selected", state.selectedPantryIngredients.has(normalized));
      }
    });
  }

  updateSelectedPantryDisplay();
  renderPantryMatches();
}

function handleAddCustomIngredient() {
  const val = elements.customIngredientInput.value.trim();
  if (val) {
    togglePantryIngredient(val);
    elements.customIngredientInput.value = "";
  }
}

function clearPantrySelection() {
  state.selectedPantryIngredients.clear();
  elements.pantryIngredientsList.querySelectorAll(".pantry-tag-btn").forEach(b => b.classList.remove("selected"));
  updateSelectedPantryDisplay();
  renderPantryMatches();
  showToast("Cleared selected pantry ingredients");
}

function updateSelectedPantryDisplay() {
  elements.selectedPantryCount.textContent = state.selectedPantryIngredients.size;

  if (state.selectedPantryIngredients.size === 0) {
    elements.selectedPantryTags.innerHTML = `<span class="placeholder-tag">No ingredients selected yet. Tap tags above to add!</span>`;
    return;
  }

  const pillsHTML = Array.from(state.selectedPantryIngredients).map(item => `
    <span class="selected-pill">
      ${item.charAt(0).toUpperCase() + item.slice(1)}
      <button class="selected-pill-remove" data-remove="${item}" aria-label="Remove ${item}">×</button>
    </span>
  `).join("");

  elements.selectedPantryTags.innerHTML = pillsHTML;

  elements.selectedPantryTags.querySelectorAll(".selected-pill-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.dataset.remove;
      togglePantryIngredient(item);
    });
  });
}

function renderPantryMatches() {
  if (state.selectedPantryIngredients.size === 0) {
    elements.pantryMatchCountText.textContent = "Select ingredients above to find matches";
    elements.pantryRecipesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🥦</div>
        <h3>Select what's in your pantry</h3>
        <p>Pick a few ingredients above like Chicken, Eggs, Cheese, or Pasta to see matching recipes instantly!</p>
      </div>
    `;
    return;
  }

  // Calculate match scores for all recipes
  const scoredRecipes = state.recipes.map(recipe => {
    let matchCount = 0;
    const recipeIngs = recipe.ingredients.map(i => i.name.toLowerCase());

    state.selectedPantryIngredients.forEach(selected => {
      if (recipeIngs.some(ri => ri.includes(selected) || selected.includes(ri))) {
        matchCount++;
      }
    });

    const percent = Math.round((matchCount / Math.max(recipe.ingredients.length, 1)) * 100);
    return { recipe, matchCount, percent, totalIngs: recipe.ingredients.length };
  });

  // Filter recipes with at least 1 match, sorted by matchCount desc
  const matched = scoredRecipes
    .filter(item => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || b.percent - a.percent);

  elements.pantryMatchCountText.textContent = `Found ${matched.length} recipe${matched.length === 1 ? '' : 's'} you can cook`;

  if (matched.length === 0) {
    elements.pantryRecipesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <h3>No matching recipes for this combination</h3>
        <p>Try adding common pantry basics like garlic, olive oil, onion, or eggs.</p>
      </div>
    `;
    return;
  }

  elements.pantryRecipesGrid.innerHTML = matched.map(({ recipe, matchCount, totalIngs, percent }) => {
    const badgeHTML = `
      <div class="pantry-match-badge">
        <span>✓</span> You have ${matchCount} of ${totalIngs} ingredients (${percent}%)
      </div>
    `;
    return createRecipeCardHTML(recipe, badgeHTML);
  }).join("");

  attachCardListeners(elements.pantryRecipesGrid);
}

/* ==========================================================================
   RECIPE DETAILS MODAL & SERVING SCALER
   ========================================================================== */
function openRecipeModal(recipe) {
  state.activeModalRecipe = recipe;
  state.activeServings = recipe.servings || 4;
  renderModalContent();
  elements.recipeModal.classList.add("open");
  elements.recipeModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  elements.recipeModal.classList.remove("open");
  elements.recipeModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function renderModalContent() {
  const recipe = state.activeModalRecipe;
  if (!recipe) return;

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const baseServings = recipe.servings || 4;
  const scale = state.activeServings / baseServings;
  const isFav = state.favorites.includes(recipe.id);

  // Scaled Ingredients HTML
  const ingredientsHTML = recipe.ingredients.map((ing, idx) => {
    let displayAmount = "";
    if (typeof ing.amount === "number") {
      const scaled = ing.amount * scale;
      displayAmount = (Math.round(scaled * 10) / 10) + " ";
    } else if (ing.amount) {
      displayAmount = ing.amount + " ";
    }

    return `
      <li class="ingredient-item">
        <input type="checkbox" id="ing_${idx}">
        <label for="ing_${idx}">
          <strong>${displayAmount}</strong>${ing.unit || ''} ${ing.name}
        </label>
      </li>
    `;
  }).join("");

  // Numbered Instructions HTML
  const instructionsHTML = recipe.instructions.map((step, idx) => `
    <li class="step-item">
      <span class="step-num">${idx + 1}</span>
      <p class="step-text">${step}</p>
    </li>
  `).join("");

  // Macro Summary
  const caloriesScaled = recipe.calories ? Math.round(recipe.calories * (state.activeServings / baseServings)) : null;

  elements.modalContent.innerHTML = `
    <!-- Modal Hero -->
    <div class="modal-hero">
      <img src="${recipe.image}" alt="${recipe.title}">
      <div class="modal-hero-overlay">
        <h2 class="modal-title">${recipe.title}</h2>
        <div class="modal-sub-meta">
          <span>${recipe.cuisine} Cuisine</span>
          <span>•</span>
          <span>${recipe.category}</span>
          <span>•</span>
          <span>★ ${recipe.rating || 4.9} (${recipe.reviews || 50} reviews)</span>
        </div>
      </div>
    </div>

    <!-- Modal Body -->
    <div class="modal-body">
      <!-- Quick Highlights -->
      <div class="modal-highlights">
        <div class="highlight-box">
          <div class="highlight-label">Prep Time</div>
          <div class="highlight-value">${recipe.prepTime || 15}m</div>
        </div>
        <div class="highlight-box">
          <div class="highlight-label">Cook Time</div>
          <div class="highlight-value">${recipe.cookTime || 20}m</div>
        </div>
        <div class="highlight-box">
          <div class="highlight-label">Total Time</div>
          <div class="highlight-value">${totalTime}m</div>
        </div>
        <div class="highlight-box">
          <div class="highlight-label">Difficulty</div>
          <div class="highlight-value">${recipe.difficulty || 'Easy'}</div>
        </div>
      </div>

      <!-- Nutrition Row -->
      <div class="modal-nutrition-row">
        <div class="macro-item"><strong>Calories:</strong> ${caloriesScaled || 450} kcal</div>
        <div class="macro-item"><strong>Protein:</strong> ${recipe.protein || '30g'}</div>
        <div class="macro-item"><strong>Carbs:</strong> ${recipe.carbs || '35g'}</div>
        <div class="macro-item"><strong>Fat:</strong> ${recipe.fat || '15g'}</div>
      </div>

      <!-- Description -->
      <p style="font-size:0.95rem; color:var(--text-muted); line-height:1.6; margin-bottom:1.75rem;">
        ${recipe.description}
      </p>

      <!-- Main Split Grid -->
      <div class="modal-grid">
        <!-- Column 1: Ingredients -->
        <div class="modal-ingredients-col">
          <div class="section-subhead">
            <span>Ingredients</span>
            <div class="servings-scaler" title="Adjust servings">
              <span>Servings:</span>
              <button class="scaler-btn" id="decreaseServingsBtn" aria-label="Decrease servings">-</button>
              <strong id="servingsDisplay">${state.activeServings}</strong>
              <button class="scaler-btn" id="increaseServingsBtn" aria-label="Increase servings">+</button>
            </div>
          </div>
          <ul class="ingredients-list">
            ${ingredientsHTML}
          </ul>
        </div>

        <!-- Column 2: Step-by-Step Instructions -->
        <div class="modal-instructions-col">
          <div class="section-subhead">
            <span>Directions</span>
            <button class="btn-xs" id="quickStartTimerBtn" style="font-weight:600;">⏱️ Cook Timer (${recipe.cookTime || 15}m)</button>
          </div>
          <ol class="instructions-list">
            ${instructionsHTML}
          </ol>
        </div>
      </div>

      <!-- Modal Footer Actions -->
      <div class="modal-footer">
        <button id="modalFavBtn" class="btn ${isFav ? 'btn-secondary' : 'btn-primary'}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
          <span id="modalFavText">${isFav ? 'Saved to Favorites' : 'Add to Favorites'}</span>
        </button>

        <div style="display:flex; gap:0.5rem;">
          <button id="shareRecipeBtn" class="btn btn-outline" title="Copy recipe title and ingredients">
            📋 Share / Copy
          </button>
          <button id="printRecipeBtn" class="btn btn-outline" title="Print recipe">
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach Modal Action Listeners
  const decBtn = document.getElementById("decreaseServingsBtn");
  const incBtn = document.getElementById("increaseServingsBtn");
  if (decBtn && incBtn) {
    decBtn.addEventListener("click", () => {
      if (state.activeServings > 1) {
        state.activeServings--;
        renderModalContent();
      }
    });
    incBtn.addEventListener("click", () => {
      if (state.activeServings < 20) {
        state.activeServings++;
        renderModalContent();
      }
    });
  }

  // Ingredient checkbox strike-through toggle
  elements.modalContent.querySelectorAll(".ingredient-item input[type='checkbox']").forEach(cb => {
    cb.addEventListener("change", (e) => {
      e.target.closest(".ingredient-item").classList.toggle("checked", e.target.checked);
    });
  });

  // Modal Favorite Button
  const modalFavBtn = document.getElementById("modalFavBtn");
  if (modalFavBtn) {
    modalFavBtn.addEventListener("click", () => {
      toggleFavorite(recipe.id);
    });
  }

  // Quick Start Timer Button
  const timerBtn = document.getElementById("quickStartTimerBtn");
  if (timerBtn) {
    timerBtn.addEventListener("click", () => {
      const cookSecs = (recipe.cookTime || 15) * 60;
      setTimerDuration(cookSecs);
      openTimerWidget();
      startTimer();
      showToast(`Started ${recipe.cookTime || 15}-minute kitchen timer`);
    });
  }

  // Share Recipe Button
  const shareBtn = document.getElementById("shareRecipeBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      const textToCopy = `${recipe.title} (${recipe.cuisine})\n\nIngredients:\n${recipe.ingredients.map(i => `• ${i.amount || ''} ${i.unit || ''} ${i.name}`).join('\n')}\n\nInstructions:\n${recipe.instructions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Recipe copied to clipboard! 📋");
      }).catch(() => {
        showToast("Recipe ready to share!");
      });
    });
  }

  // Print Recipe
  const printBtn = document.getElementById("printRecipeBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }
}

function updateModalFavButton() {
  const modalFavBtn = document.getElementById("modalFavBtn");
  const modalFavText = document.getElementById("modalFavText");
  if (!modalFavBtn || !state.activeModalRecipe) return;

  const isFav = state.favorites.includes(state.activeModalRecipe.id);
  modalFavBtn.className = `btn ${isFav ? 'btn-secondary' : 'btn-primary'}`;
  modalFavText.textContent = isFav ? 'Saved to Favorites' : 'Add to Favorites';
}

/* ==========================================================================
   INTEGRATED KITCHEN TIMER
   ========================================================================== */
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function updateTimerDisplay() {
  const str = formatTime(state.timerRemainingSeconds);
  elements.timerDisplay.textContent = str;
  elements.timerCompactDisplay.textContent = str;
}

function setTimerDuration(seconds) {
  pauseTimer();
  state.timerTotalSeconds = seconds;
  state.timerRemainingSeconds = seconds;
  updateTimerDisplay();
  elements.timerDisplay.classList.remove("ringing");
}

function startTimer() {
  if (state.timerRemainingSeconds <= 0) {
    setTimerDuration(300); // default to 5m if 0
  }

  if (state.timerRunning) return;

  state.timerRunning = true;
  elements.timerStartBtn.disabled = true;
  elements.timerPauseBtn.disabled = false;
  elements.timerBadge.classList.add("active");
  elements.timerDisplay.classList.remove("ringing");

  state.timerIntervalId = setInterval(() => {
    if (state.timerRemainingSeconds > 0) {
      state.timerRemainingSeconds--;
      updateTimerDisplay();

      if (state.timerRemainingSeconds === 0) {
        timerFinished();
      }
    }
  }, 1000);
}

function pauseTimer() {
  state.timerRunning = false;
  clearInterval(state.timerIntervalId);
  elements.timerStartBtn.disabled = false;
  elements.timerPauseBtn.disabled = true;
  elements.timerBadge.classList.remove("active");
}

function resetTimer() {
  pauseTimer();
  state.timerRemainingSeconds = state.timerTotalSeconds;
  updateTimerDisplay();
  elements.timerDisplay.classList.remove("ringing");
}

function timerFinished() {
  pauseTimer();
  elements.timerDisplay.classList.add("ringing");
  playBeepAlert();
  showToast("🔔 Kitchen Timer Finished!");
  openTimerWidget();
}

function playBeepAlert() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const playChime = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Play 3 melodic alert chimes
    playChime(587.33, 0.0, 0.25); // D5
    playChime(880.00, 0.25, 0.35); // A5
    playChime(1174.66, 0.55, 0.6); // D6
  } catch (err) {
    console.log("Audio not supported or blocked by user gesture:", err);
  }
}

function toggleTimerWidget() {
  elements.kitchenTimerWidget.classList.toggle("collapsed");
}

function openTimerWidget() {
  elements.kitchenTimerWidget.classList.remove("collapsed");
}

function toggleTimerCollapse() {
  elements.kitchenTimerWidget.classList.toggle("collapsed");
}

/* ==========================================================================
   TOAST ALERTS
   ========================================================================== */
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Kickoff application
document.addEventListener("DOMContentLoaded", init);
