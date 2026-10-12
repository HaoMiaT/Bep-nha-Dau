
const CSV_URL = "./recipes.csv";

const PALETTES = ["peach", "green", "blue", "yellow", "pink", "purple"];

const EMOJI_BY_CATEGORY = {
  "tôm": "🍤",
  "cá": "🐟",
  "gà": "🍗",
  "bò": "🥩",
  "heo": "🥩",
  "thịt": "🍖",
  "rau": "🥦",
  "trứng": "🥚",
  "bánh": "🥞",
  "cháo": "🥣",
  "mì": "🍜",
  "cơm": "🍚",
  "trái cây": "🍓",
  "canh": "🥣"
};

let recipes = [];
let activeCategory = "Tất cả";

function clean(value) {
  return (value ?? "").toString().trim();
}

function getField(row, names) {
  const key = Object.keys(row).find(k =>
    names.includes(k.trim().toLowerCase())
  );
  return key ? clean(row[key]) : "";
}

function parseRecipes(rows) {
  const grouped = new Map();

  rows.forEach(row => {
    const id = getField(row, [
      "recipe_id", "recipe id", "id"
    ]);

    if (!id) return;

    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        name: "",
        category1: "",
        category2: "",
        oldCategory: "",
        ingredients: [],
        steps: [],
        image: ""
      });
    }

    const recipe = grouped.get(id);

    recipe.name ||= getField(row, ["name", "tên", "tên món"]);

    recipe.category1 ||= getField(row, [
      "category1", "category 1", "danh mục 1"
    ]);

    recipe.category2 ||= getField(row, [
      "category2", "category 2", "danh mục 2"
    ]);

    recipe.oldCategory ||= getField(row, [
      "category", "danh mục", "loại"
    ]);

    recipe.image ||= getField(row, [
      "link ảnh", "image", "image_url", "ảnh"
    ]);

    const ingredient = getField(row, [
      "ingredient", "ingredients", "nguyên liệu"
    ]);

    if (
      ingredient &&
      !recipe.ingredients.includes(ingredient)
    ) {
      recipe.ingredients.push(ingredient);
    }

    const stepNumber = getField(row, [
      "step number", "step_number", "bước", "số bước"
    ]);

    const instruction = getField(row, [
      "instruction", "hướng dẫn", "cách làm"
    ]);

    if (instruction) {
      recipe.steps.push({
        number: stepNumber || String(recipe.steps.length + 1),
        instruction
      });
    }
  });

  return [...grouped.values()]
    .filter(recipe => recipe.name)
    .map(recipe => {
      const category1 =
        recipe.category1 || recipe.oldCategory || "Khác";

      const category2 =
        recipe.category2 ||
        (recipe.category1 ? "" : "");

      return {
        ...recipe,
        category1,
        category2,
        steps: recipe.steps.sort(
          (a, b) =>
            (Number(a.number) || 0) -
            (Number(b.number) || 0)
        )
      };
    });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function emojiFor(recipe) {
  const text = [
    recipe.name,
    recipe.category1,
    recipe.category2
  ].join(" ").toLowerCase();

  for (const [key, emoji] of Object.entries(EMOJI_BY_CATEGORY)) {
    if (text.includes(key)) return emoji;
  }

  return "🍲";
}

function renderCategories() {
  const container = document.querySelector("#categories");

  const categories = [
    "Tất cả",
    ...new Set(
      recipes.map(r => r.category1).filter(Boolean)
    )
  ];

  container.innerHTML = categories.map(category => `
    <button
      class="category-button ${
        category === activeCategory ? "active" : ""
      }"
      data-category="${escapeHTML(category)}"
    >${escapeHTML(category)}</button>
  `).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;

      // Khi đổi danh mục lớn, trở về tất cả danh mục nhỏ.
      document.querySelector("#subcategories").dataset.active =
        "Tất cả";

      renderCategories();
      renderCards();
    });
  });

  renderSubcategories();
}

function renderSubcategories() {
  const container = document.querySelector("#subcategories");

  const scopedRecipes =
    activeCategory === "Tất cả"
      ? recipes
      : recipes.filter(r => r.category1 === activeCategory);

  const categories = [
    "Tất cả",
    ...new Set(
      scopedRecipes.map(r => r.category2).filter(Boolean)
    )
  ];

  if (categories.length === 1) {
    container.hidden = true;
    container.innerHTML = "";
    container.dataset.active = "Tất cả";
    return;
  }

  container.hidden = false;

  let selected = container.dataset.active || "Tất cả";

  if (!categories.includes(selected)) {
    selected = "Tất cả";
  }

  container.dataset.active = selected;

  container.innerHTML = categories.map(category => `
    <button
      class="subcategory-button ${
        category === selected ? "active" : ""
      }"
      data-subcategory="${escapeHTML(category)}"
    >${escapeHTML(category)}</button>
  `).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      container.dataset.active = button.dataset.subcategory;
      renderSubcategories();
      renderCards();
    });
  });
}

function visibleRecipes() {
  const query = document.querySelector("#search")
    .value.trim().toLocaleLowerCase("vi");

  const subcategory =
    document.querySelector("#subcategories").dataset.active ||
    "Tất cả";

  return recipes.filter(recipe => {
    const matchesCategory =
      activeCategory === "Tất cả" ||
      recipe.category1 === activeCategory;

    const matchesSubcategory =
      subcategory === "Tất cả" ||
      recipe.category2 === subcategory;

    const searchableText = [
      recipe.name,
      recipe.category1,
      recipe.category2,
      ...recipe.ingredients
    ].join(" ").toLocaleLowerCase("vi");

    return (
      matchesCategory &&
      matchesSubcategory &&
      searchableText.includes(query)
    );
  });
}

function renderCards() {
  const shown = visibleRecipes();

  document.querySelector("#recipe-count").textContent =
    `${recipes.length} món`;

  document.querySelector("#recipe-grid").innerHTML =
    shown.map(recipe => {
      const index = recipes.indexOf(recipe);
      const palette = PALETTES[index % PALETTES.length];

      const art = recipe.image
        ? `<img src="${escapeHTML(recipe.image)}"
             alt="${escapeHTML(recipe.name)}"
             style="width:100%;height:100%;object-fit:cover">`
        : `<span class="card-emoji">${emojiFor(recipe)}</span>`;

      const categoryLabel = [
        recipe.category1,
        recipe.category2
      ].filter(Boolean).join(" · ");

      return `
        <article
          class="recipe-card"
          tabindex="0"
          role="button"
          data-id="${escapeHTML(recipe.id)}"
        >
          <div class="card-art ${palette}">
            ${art}
            <span class="category-tag">
              ${escapeHTML(categoryLabel || "Món nhà làm")}
            </span>
          </div>

          <div class="card-body">
            <h3>${escapeHTML(recipe.name)}</h3>
            <div class="card-meta">
              <span>
                ${recipe.ingredients.length} nguyên liệu ·
                ${recipe.steps.length} bước
              </span>
              <span class="view">Xem công thức ↗</span>
            </div>
          </div>
        </article>
      `;
    }).join("");

  document.querySelector("#empty-state").hidden =
    shown.length > 0;

  document.querySelectorAll(".recipe-card").forEach(card => {
    const openRecipe = () => showRecipe(card.dataset.id);

    card.addEventListener("click", openRecipe);

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openRecipe();
      }
    });
  });
}

function showRecipe(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  const dialog = document.querySelector("#recipe-dialog");

  const hero = recipe.image
    ? `<img src="${escapeHTML(recipe.image)}"
         alt="${escapeHTML(recipe.name)}"
         style="width:100%;height:180px;object-fit:cover">`
    : `<div class="dialog-hero">${emojiFor(recipe)}</div>`;

  const ingredients = recipe.ingredients.length
    ? recipe.ingredients.map(item =>
        `<li>${escapeHTML(item)}</li>`
      ).join("")
    : "<li>Chưa có dữ liệu nguyên liệu.</li>";

  const steps = recipe.steps.length
    ? recipe.steps.map(step => `
        <li>
          <span class="step-number">
            ${escapeHTML(step.number)}
          </span>
          <div>${escapeHTML(step.instruction)}</div>
        </li>
      `).join("")
    : "<li>Chưa có hướng dẫn nấu.</li>";

  const categoryLabel = [
    recipe.category1,
    recipe.category2
  ].filter(Boolean).join(" · ");

  document.querySelector("#dialog-content").innerHTML = `
    ${hero}
    <div class="dialog-inner">
      <div class="dialog-category">
        ${escapeHTML(categoryLabel || "Bếp nhà Đậu")}
      </div>

      <h2>${escapeHTML(recipe.name)}</h2>

      <h3>Nguyên liệu</h3>
      <ul class="ingredient-list">${ingredients}</ul>

      <h3>Cách làm</h3>
      <ol class="steps">${steps}</ol>
    </div>
  `;

  dialog.showModal();
}

document.querySelector("#search").addEventListener(
  "input",
  renderCards
);

document.querySelector("#close-dialog").addEventListener(
  "click",
  () => document.querySelector("#recipe-dialog").close()
);

document.querySelector("#recipe-dialog").addEventListener(
  "click",
  event => {
    if (event.target === event.currentTarget) {
      event.currentTarget.close();
    }
  }
);

fetch(CSV_URL + "?v=" + Date.now(), { cache: "no-store" })
  .then(response => {
    if (!response.ok) {
      throw new Error("Không tìm thấy recipes.csv");
    }
    return response.text();
  })
  .then(csv => {
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: "greedy"
    });

    recipes = parseRecipes(parsed.data);

    const status = document.querySelector("#status");

    if (!recipes.length) {
      status.className = "status error";
      status.textContent =
        "Chưa đọc được công thức. Hãy kiểm tra file CSV.";
      return;
    }

    status.hidden = true;
    renderCategories();
    renderCards();
  })
  .catch(() => {
    const status = document.querySelector("#status");

    status.className = "status error";
    status.textContent =
      "Chưa tải được dữ liệu. Hãy kiểm tra file recipes.csv.";
  });
