// Bếp nhà Đậu — bản sửa hiển thị Category / Category1 / Category2
const CSV_URL = "./recipes.csv";
const PALETTES = ["peach", "green", "blue", "yellow", "pink", "purple"];
const EMOJI_BY_CATEGORY = {
  "tôm":"🍤","cá":"🐟","gà":"🍗","bò":"🥩","heo":"🥩","thịt":"🍖",
  "rau":"🥦","trứng":"🥚","bánh":"🥞","cháo":"🥣","mì":"🍜","cơm":"🍚","canh":"🥣"
};

let recipes = [];
let activeCategory = "Tất cả";
let activeSubcategory = "Tất cả";

function norm(s) {
  return String(s ?? "").replace(/^\uFEFF/, "").trim().toLocaleLowerCase("vi");
}
function clean(s) { return String(s ?? "").replace(/^\uFEFF/, "").trim(); }

function getField(row, aliases) {
  const keys = Object.keys(row);
  const aliasSet = new Set(aliases.map(norm));
  const key = keys.find(k => aliasSet.has(norm(k)));
  return key === undefined ? "" : clean(row[key]);
}

function parseRecipes(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const id = getField(row, ["Recipe_ID", "Recipe ID", "id"]);
    if (!id) continue;

    if (!grouped.has(id)) {
      grouped.set(id, {
        id, name: "", category1: "", category2: "", oldCategory: "",
        ingredients: [], steps: [], image: ""
      });
    }

    const r = grouped.get(id);
    r.name ||= getField(row, ["Name", "Tên", "Tên món"]);
    r.category1 ||= getField(row, ["Category1", "Category 1", "Danh mục 1"]);
    r.category2 ||= getField(row, ["Category2", "Category 2", "Danh mục 2"]);
    r.oldCategory ||= getField(row, ["Category", "Danh mục", "Loại"]);
    r.image ||= getField(row, ["Link ảnh", "Image", "Image_URL", "Ảnh"]);

    const ingredient = getField(row, ["Ingredient", "Ingredients", "Nguyên liệu"]);
    if (ingredient && !r.ingredients.includes(ingredient)) r.ingredients.push(ingredient);

    const number = getField(row, ["Step number", "Step_Number", "Bước", "Số bước"]);
    const instruction = getField(row, ["Instruction", "Hướng dẫn", "Cách làm"]);
    if (instruction) r.steps.push({ number: number || String(r.steps.length + 1), instruction });
  }

  return [...grouped.values()].filter(r => r.name).map(r => {
    // Hỗ trợ file cũ chỉ có Category và file mới có Category1/Category2.
    const category1 = r.category1 || r.oldCategory || "Khác";
    return {
      ...r,
      category1,
      category2: r.category2 || "",
      steps: r.steps.sort((a,b) => (Number(a.number) || 0) - (Number(b.number) || 0))
    };
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}
function categoryLabel(r) {
  return [r.category1, r.category2].filter(Boolean).join(" · ") || "Món nhà làm";
}
function emojiFor(r) {
  const text = `${r.name} ${r.category1} ${r.category2}`.toLocaleLowerCase("vi");
  for (const [key, emoji] of Object.entries(EMOJI_BY_CATEGORY)) {
    if (text.includes(key)) return emoji;
  }
  return "🍲";
}

function renderCategories() {
  const el = document.querySelector("#categories");
  if (!el) return;
  const categories = ["Tất cả", ...new Set(recipes.map(r => r.category1).filter(Boolean))];
  if (!categories.includes(activeCategory)) activeCategory = "Tất cả";

  el.innerHTML = categories.map(c => `
    <button class="category-button ${c === activeCategory ? "active" : ""}"
      data-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("");

  el.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => {
    activeCategory = btn.dataset.category;
    activeSubcategory = "Tất cả";
    renderCategories();
    renderCards();
  }));
  renderSubcategories();
}

function renderSubcategories() {
  const el = document.querySelector("#subcategories");
  if (!el) return;
  const scope = activeCategory === "Tất cả" ? recipes : recipes.filter(r => r.category1 === activeCategory);
  const children = [...new Set(scope.map(r => r.category2).filter(Boolean))];

  if (!children.length) {
    el.hidden = true;
    el.innerHTML = "";
    activeSubcategory = "Tất cả";
    return;
  }

  el.hidden = false;
  const options = ["Tất cả", ...children];
  if (!options.includes(activeSubcategory)) activeSubcategory = "Tất cả";
  el.innerHTML = options.map(c => `
    <button class="subcategory-button ${c === activeSubcategory ? "active" : ""}"
      data-subcategory="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("");

  el.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => {
    activeSubcategory = btn.dataset.subcategory;
    renderSubcategories();
    renderCards();
  }));
}

function visibleRecipes() {
  const search = (document.querySelector("#search")?.value || "").trim().toLocaleLowerCase("vi");
  return recipes.filter(r => {
    const ok1 = activeCategory === "Tất cả" || r.category1 === activeCategory;
    const ok2 = activeSubcategory === "Tất cả" || r.category2 === activeSubcategory;
    const text = [r.name, r.category1, r.category2, r.oldCategory, ...r.ingredients]
      .join(" ").toLocaleLowerCase("vi");
    return ok1 && ok2 && text.includes(search);
  });
}

function renderCards() {
  const grid = document.querySelector("#recipe-grid");
  if (!grid) return;
  const shown = visibleRecipes();
  const count = document.querySelector("#recipe-count");
  if (count) count.textContent = `${recipes.length} món`;

  grid.innerHTML = shown.map(r => {
    const i = recipes.indexOf(r);
    const art = r.image
      ? `<img src="${escapeHTML(r.image)}" alt="${escapeHTML(r.name)}" style="width:100%;height:100%;object-fit:cover">`
      : `<span class="card-emoji">${emojiFor(r)}</span>`;
    return `<article class="recipe-card" tabindex="0" role="button" data-id="${escapeHTML(r.id)}">
      <div class="card-art ${PALETTES[i % PALETTES.length]}">
        ${art}<span class="category-tag">${escapeHTML(categoryLabel(r))}</span>
      </div>
      <div class="card-body"><h3>${escapeHTML(r.name)}</h3>
        <div class="card-meta"><span>${r.ingredients.length} nguyên liệu · ${r.steps.length} bước</span>
        <span class="view">Xem công thức ↗</span></div>
      </div></article>`;
  }).join("");

  const empty = document.querySelector("#empty-state");
  if (empty) empty.hidden = shown.length > 0;

  grid.querySelectorAll(".recipe-card").forEach(card => {
    const open = () => showRecipe(card.dataset.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

function showRecipe(id) {
  const r = recipes.find(item => item.id === id);
  if (!r) return;
  const dialog = document.querySelector("#recipe-dialog");
  const content = document.querySelector("#dialog-content");
  if (!dialog || !content) return;

  const hero = r.image
    ? `<img src="${escapeHTML(r.image)}" alt="${escapeHTML(r.name)}" style="width:100%;height:180px;object-fit:cover">`
    : `<div class="dialog-hero">${emojiFor(r)}</div>`;
  const ingredients = r.ingredients.length
    ? r.ingredients.map(x => `<li>${escapeHTML(x)}</li>`).join("")
    : "<li>Chưa có dữ liệu nguyên liệu.</li>";
  const steps = r.steps.length
    ? r.steps.map(s => `<li><span class="step-number">${escapeHTML(s.number)}</span><div>${escapeHTML(s.instruction)}</div></li>`).join("")
    : "<li>Chưa có hướng dẫn nấu.</li>";

  content.innerHTML = `${hero}<div class="dialog-inner">
    <div class="dialog-category">${escapeHTML(categoryLabel(r))}</div>
    <h2>${escapeHTML(r.name)}</h2>
    <h3>Nguyên liệu</h3><ul class="ingredient-list">${ingredients}</ul>
    <h3>Cách làm</h3><ol class="steps">${steps}</ol>
  </div>`;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

document.querySelector("#search")?.addEventListener("input", renderCards);
document.querySelector("#close-dialog")?.addEventListener("click", () => {
  const d = document.querySelector("#recipe-dialog");
  if (d?.close) d.close(); else d?.removeAttribute("open");
});
document.querySelector("#recipe-dialog")?.addEventListener("click", e => {
  if (e.target === e.currentTarget) {
    if (e.currentTarget.close) e.currentTarget.close();
    else e.currentTarget.removeAttribute("open");
  }
});

fetch(`${CSV_URL}?v=${Date.now()}`, { cache: "no-store" })
  .then(response => { if (!response.ok) throw new Error("CSV missing"); return response.text(); })
  .then(csv => {
    const parsed = Papa.parse(csv, {
      header: true, skipEmptyLines: "greedy",
      transformHeader: h => h.replace(/^\uFEFF/, "").trim()
    });
    recipes = parseRecipes(parsed.data);
    const status = document.querySelector("#status");

    if (!recipes.length) {
      if (status) {
        status.hidden = false;
        status.className = "status error";
        status.textContent = "Không đọc được công thức. Kiểm tra tiêu đề CSV và cột Recipe_ID.";
      }
      return;
    }
    if (status) status.hidden = true;
    renderCategories();
    renderCards();
  })
  .catch(() => {
    const status = document.querySelector("#status");
    if (status) {
      status.hidden = false;
      status.className = "status error";
      status.textContent = "Không tải được recipes.csv. Hãy kiểm tra file nằm cùng thư mục với index.html.";
    }
  });
