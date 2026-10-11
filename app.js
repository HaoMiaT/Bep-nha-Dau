const CSV_URL = "./recipes.csv"; // Thay file recipes.csv bằng bản mới để cập nhật website.
const PALETTES = ["peach", "green", "blue", "yellow", "pink", "purple"];
const EMOJI_BY_CATEGORY = {
  "tôm":"🍤","cá":"🐟","gà":"🍗","bò":"🥩","heo":"🥩","thịt":"🍖",
  "rau":"🥦","trứng":"🥚","bánh":"🥞","cháo":"🥣","mì":"🍜","cơm":"🍚",
  "trái cây":"🍓","món ăn dặm":"🥣"
};
let recipes = [];
let activeCategory = "Tất cả";

function clean(value) { return (value ?? "").toString().trim(); }
function getField(row, names) {
  const key = Object.keys(row).find(k => names.includes(k.trim().toLowerCase()));
  return key ? clean(row[key]) : "";
}
function parseRecipes(rows) {
  const grouped = new Map();
  rows.forEach(row => {
    const id = getField(row, ["recipe_id", "recipe id", "id"]);
    if (!id) return;
    if (!grouped.has(id)) grouped.set(id, { id, name: "", category: "", ingredients: [], steps: [], image: "" });
    const recipe = grouped.get(id);
    recipe.name ||= getField(row, ["name", "tên", "tên món"]);
    recipe.category ||= getField(row, ["category", "danh mục", "loại"]);
    recipe.image ||= getField(row, ["link ảnh", "image", "image_url", "ảnh"]);
    const ingredient = getField(row, ["ingredient", "ingredients", "nguyên liệu"]);
    if (ingredient && !recipe.ingredients.includes(ingredient)) recipe.ingredients.push(ingredient);
    const stepNumber = getField(row, ["step number", "step_number", "bước", "số bước"]);
    const instruction = getField(row, ["instruction", "hướng dẫn", "cách làm"]);
    if (instruction) recipe.steps.push({ number: stepNumber || String(recipe.steps.length + 1), instruction, image: getField(row, ["link ảnh bước", "step image"]) });
  });
  return [...grouped.values()].filter(r => r.name).map(r => ({
    ...r,
    steps: r.steps.sort((a,b) => (Number(a.number)||0) - (Number(b.number)||0))
  }));
}
function emojiFor(recipe) {
  const text = `${recipe.name} ${recipe.category}`.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_BY_CATEGORY)) if (text.includes(key)) return emoji;
  return "🍲";
}
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function renderCategories() {
  const categories = ["Tất cả", ...new Set(recipes.map(r => r.category).filter(Boolean))];
  const container = document.querySelector("#categories");
  container.innerHTML = categories.map(cat => `<button class="category-button ${cat === activeCategory ? "active" : ""}" data-category="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`).join("");
  container.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    renderCategories(); renderCards();
  }));
}
function visibleRecipes() {
  const q = document.querySelector("#search").value.trim().toLocaleLowerCase("vi");
  return recipes.filter(r => (activeCategory === "Tất cả" || r.category === activeCategory) &&
    `${r.name} ${r.category} ${r.ingredients.join(" ")}`.toLocaleLowerCase("vi").includes(q));
}
function renderCards() {
  const shown = visibleRecipes();
  document.querySelector("#recipe-count").textContent = `${recipes.length} món`;
  document.querySelector("#recipe-grid").innerHTML = shown.map((r) => {
    const i = recipes.indexOf(r);
    const palette = PALETTES[i % PALETTES.length];
    const art = r.image
      ? `<img src="${escapeHTML(r.image)}" alt="" style="width:100%;height:100%;object-fit:cover">`
      : `<span class="card-emoji">${emojiFor(r)}</span>`;
    return `<article class="recipe-card" tabindex="0" role="button" data-id="${escapeHTML(r.id)}" aria-label="Xem ${escapeHTML(r.name)}">
      <div class="card-art ${palette}">${art}<span class="category-tag">${escapeHTML(r.category || "Món nhà làm")}</span></div>
      <div class="card-body"><h3>${escapeHTML(r.name)}</h3><div class="card-meta"><span>${r.ingredients.length} nguyên liệu · ${r.steps.length} bước</span><span class="view">Xem công thức ↗</span></div></div>
    </article>`;
  }).join("");
  document.querySelector("#empty-state").hidden = shown.length > 0;
  document.querySelector("#recipe-grid").querySelectorAll(".recipe-card").forEach(card => {
    const open = () => showRecipe(card.dataset.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
}
function showRecipe(id) {
  const r = recipes.find(x => x.id === id);
  if (!r) return;
  const dialog = document.querySelector("#recipe-dialog");
  const hero = r.image ? `<img src="${escapeHTML(r.image)}" alt="" style="width:100%;height:180px;object-fit:cover">` : `<div class="dialog-hero">${emojiFor(r)}</div>`;
  const ingredients = r.ingredients.length ? r.ingredients.map(x => `<li>${escapeHTML(x)}</li>`).join("") : "<li>Chưa có dữ liệu nguyên liệu.</li>";
  const steps = r.steps.length ? r.steps.map(s => `<li><span class="step-number">${escapeHTML(s.number)}</span><div>${escapeHTML(s.instruction)}${s.image ? `<br><img class="step-image" src="${escapeHTML(s.image)}" alt="Ảnh bước ${escapeHTML(s.number)}">` : ""}</div></li>`).join("") : "<li>Chưa có hướng dẫn nấu.</li>";
  document.querySelector("#dialog-content").innerHTML = `${hero}<div class="dialog-inner"><div class="dialog-category">${escapeHTML(r.category || "Bếp nhà Đậu")}</div><h2>${escapeHTML(r.name)}</h2><h3>Nguyên liệu</h3><ul class="ingredient-list">${ingredients}</ul><h3>Cách làm</h3><ol class="steps">${steps}</ol></div>`;
  if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
}
document.querySelector("#search").addEventListener("input", renderCards);
document.querySelector("#close-dialog").addEventListener("click", () => document.querySelector("#recipe-dialog").close());
document.querySelector("#recipe-dialog").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
fetch(CSV_URL + "?v=" + Date.now(), { cache: "no-store" })
  .then(res => { if (!res.ok) throw new Error("Không tìm thấy file recipes.csv"); return res.text(); })
  .then(csv => {
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: "greedy" });
    recipes = parseRecipes(parsed.data);
    document.querySelector("#status").hidden = true;
    if (!recipes.length) {
      const status = document.querySelector("#status");
      status.hidden = false; status.className = "status error";
      status.textContent = "Chưa đọc được công thức. Hãy kiểm tra tên cột và dữ liệu trong file CSV.";
      return;
    }
    renderCategories(); renderCards();
  })
  .catch(() => {
    const status = document.querySelector("#status");
    status.className = "status error";
    status.textContent = "Chưa tải được dữ liệu. Hãy kiểm tra xem file recipes.csv đã được upload cùng website chưa.";
    document.querySelector("#recipe-count").textContent = "0 món";
  });
