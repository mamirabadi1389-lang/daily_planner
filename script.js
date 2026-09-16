// ---------- تاریخ و سلام فانتزی ----------
const now = new Date();
const hour = now.getHours();
let greetText = "شب بخیر ✨";
if (hour >= 5 && hour < 12) greetText = "صبح بخیر ☀️";
else if (hour >= 12 && hour < 17) greetText = "ظهر بخیر 🌤️";
else if (hour >= 17 && hour < 21) greetText = "عصر بخیر 🌇";

document.getElementById("greeting").textContent = greetText;
document.getElementById("todayDate").textContent =
  now.toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

// ---------- داده‌ها ----------
const task = { name: "", time: "", priority: "medium", desc: "" };
const tasks = [];

const prLabel = { low: "کم", medium: "متوسط", high: "زیاد" };
const prColor = { low: "#3fae5c", medium: "#f0a92e", high: "#d43d2a" };

// ---------- سیستم تم ----------
const themeAssets = {
  wood: {
    boardBg: "assets/01_top_bar_5.png",
    longButton: "assets/35_long_button.png",
    buttonCenter: "assets/09_large_button_center.png",
    buttonBar: "assets/08_large_button_left.png",
    iconSettings: "assets/13_settings_square.png",
    iconBack: "assets/12_back_square.png"
  },
  pink: {
    boardBg: "assets/pink_top_bar.png",
    longButton: "assets/pink_long_button.png",
    buttonCenter: "assets/pink_large_button.png",
    buttonBar: "assets/pink_large_button.png",
    iconSettings: "assets/pink_settings_square.png",
    iconBack: "assets/pink_back_square.png"
  },
  stone: {
    boardBg: "assets/asset_04.png",
    longButton: "assets/asset_03.png",
    buttonCenter: "assets/asset_07.png",
    buttonBar: "assets/asset_10.png",
    iconSettings: "assets/icon_09_settings_gear.png",
    iconBack: "assets/icon_16_refresh.png",
    iconInfo: "assets/icon_08_info.png"
  },
};

let currentTheme = localStorage.getItem("plannerTheme") || "wood";

function swapAssetImage(img, newSrc) {
  // ۱) انیمیشن swap قبلی رو کنسل کن تا fill:forwards زامبی نشه
  if (img._swapAnim) img._swapAnim.cancel();

  const fadeOut = img.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 130, easing: "ease-in", fill: "forwards" }
  );
  img._swapAnim = fadeOut;

  fadeOut.onfinish = () => {
    const probe = new Image();
    probe.onload = () => {
      fadeOut.cancel();   // ← کلید حل مشکل: انیمیشن محو شدن کاملاً حذف می‌شه
      img.src = newSrc;
      const fadeIn = img.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 220, easing: "ease-out" }
      );
      img._swapAnim = fadeIn;
    };
    probe.onerror = () => {
      console.warn("فایل تم پیدا نشد، همون عکس قبلی نگه داشته شد:", newSrc);
      fadeOut.cancel();
      const fadeIn = img.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 220, easing: "ease-out" }
      );
      img._swapAnim = fadeIn;
    };
    probe.src = newSrc;
  };
}

function applyTheme(theme, { animate = true } = {}) {
  currentTheme = theme;
  document.body.dataset.theme = theme;
  localStorage.setItem("plannerTheme", theme);
  // خواندن تم از دیتابیس وقتی پل pywebview آماده شد
window.addEventListener("pywebviewready", () => {
  window.pywebview.api.get_theme()
    .then(saved => { if (saved && saved !== currentTheme) applyTheme(saved, { animate: false }); })
    .catch(() => {});
});

  const assets = themeAssets[theme];
  document.querySelectorAll("[data-asset]").forEach(img => {
    const newSrc = assets[img.dataset.asset];
    if (!newSrc || img.getAttribute("src") === newSrc) return;
    if (animate) swapAssetImage(img, newSrc);
    else img.src = newSrc;
  });

  document.querySelectorAll(".theme-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });

  if (typeof renderTasks === "function") renderTasks();
}

// ---------- مودال ورودی ----------
const overlay = document.getElementById("inputOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");

let currentField = null;

const fieldTemplates = {
  name: () => `
    <label>نام کار</label>
    <input type="text" id="input-name" placeholder="مثلاً: جلسه با تیم" value="${task.name}">
  `,
  time: () => `
    <label>ساعت</label>
    <input type="time" id="input-time" value="${task.time}">
    <label>اولویت</label>
    <select id="input-priority">
      <option value="low" ${task.priority === "low" ? "selected" : ""}>کم</option>
      <option value="medium" ${task.priority === "medium" ? "selected" : ""}>متوسط</option>
      <option value="high" ${task.priority === "high" ? "selected" : ""}>زیاد</option>
    </select>
  `,
  desc: () => `
    <label>توضیحات</label>
    <textarea id="input-desc" placeholder="جزئیات کار را بنویس...">${task.desc}</textarea>
  `
};

document.querySelectorAll(".field-btn").forEach(btn => {
  btn.addEventListener("click", () => openModal(btn.dataset.field, btn.dataset.title));
});

function openModal(field, title) {
  currentField = field;
  modalTitle.textContent = title;
  modalBody.innerHTML = fieldTemplates[field]();
  overlay.classList.add("open");
}

function closeModal() {
  overlay.classList.remove("open");
  currentField = null;
}

modalCancel.addEventListener("click", closeModal);
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

modalConfirm.addEventListener("click", () => {
  if (currentField === "name") {
    task.name = document.getElementById("input-name").value.trim();
    updateFieldDisplay("name", task.name);
  } else if (currentField === "time") {
    task.time = document.getElementById("input-time").value;
    task.priority = document.getElementById("input-priority").value;
    updateFieldDisplay("time", task.time ? `${task.time} · اولویت ${prLabel[task.priority]}` : "");
  } else if (currentField === "desc") {
    task.desc = document.getElementById("input-desc").value.trim();
    updateFieldDisplay("desc", task.desc.length > 24 ? task.desc.slice(0, 24) + "…" : task.desc);
  }
  closeModal();
});

function updateFieldDisplay(field, value) {
  const btn = document.querySelector(`.field-btn[data-field="${field}"]`);
  const valueEl = btn.querySelector(".field-value");
  if (value) {
    valueEl.textContent = value;
    valueEl.classList.add("filled");
  } else {
    valueEl.textContent = valueEl.dataset.empty;
    valueEl.classList.remove("filled");
  }
}

function resetForm() {
  task.name = "";
  task.time = "";
  task.priority = "medium";
  task.desc = "";
  ["name", "time", "desc"].forEach(f => updateFieldDisplay(f, ""));
}

// ---------- رندر لیست کارها روی تخته ----------
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderTasks() {
  emptyState.classList.toggle("hidden", tasks.length > 0);

  taskList.innerHTML = tasks.map((t, i) => `
    <div class="task-item" style="--pr-color:${prColor[t.priority]}; animation-delay:${i * 55}ms">
      <img src="${themeAssets[currentTheme].longButton}" class="btn-bg" alt="">
      <div class="task-content">
        <span class="task-badge" title="اولویت ${prLabel[t.priority]}"></span>
        <span class="task-texts">
          <span class="task-name">${escapeHtml(t.name)}</span>
          <span class="task-meta">${t.time ? "⏰ " + t.time : "⏰ بدون ساعت"} · اولویت ${prLabel[t.priority]}${t.desc ? " · 🖋 " + escapeHtml(t.desc.slice(0, 30)) : ""}</span>
        </span>
        <button class="task-del" data-i="${i}" aria-label="حذف کار">✕</button>
      </div>
    </div>
  `).join("");

  taskList.querySelectorAll(".task-del").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".task-item");
      item.style.animation = "none";
      item.animate(
        [
          { transform: "translateX(0) scale(1)", opacity: 1 },
          { transform: "translateX(28px) scale(.92)", opacity: 0 }
        ],
        { duration: 240, easing: "cubic-bezier(.55,0,.85,.35)", fill: "forwards" }
      );
      setTimeout(() => {
        tasks.splice(Number(btn.dataset.i), 1);
        renderTasks();
      }, 240);
    });
  });
}

renderTasks();

// ---------- افزودن کار ----------
document.getElementById("addTaskBtn").addEventListener("click", () => {
  if (!task.name) {
    document.querySelector('.field-btn[data-field="name"]').animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(6px)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(0)" }
      ],
      { duration: 320, easing: "ease-in-out" }
    );
    openModal("name", "نام کار");
    return;
  }
  tasks.push({ ...task });
  renderTasks();
  resetForm();
  document.getElementById("addTaskBtn").animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(.94)" },
      { transform: "scale(1.1)" },
      { transform: "scale(1)" }
    ],
    { duration: 340, easing: "cubic-bezier(.34,1.56,.64,1)" }
  );
});

// ---------- پنل‌های کشویی ----------
const themePanel = document.getElementById("themePanel");
const infoPanel = document.getElementById("infoPanel");

function openPanel(panel) {
  panel.classList.add("open");
  if (panel === themePanel) {
    const cards = themePanel.querySelectorAll(".theme-option");
    cards.forEach((card, i) => {
      card.animate(
        [
          { transform: "translateY(16px)", opacity: 0 },
          { transform: "translateY(0)", opacity: 1 }
        ],
        { duration: 320, delay: 120 + i * 80, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "backwards" }
      );
    });
  }
}
function closePanel(panel) { panel.classList.remove("open"); }
function anyPanelOpen() {
  return themePanel.classList.contains("open") || infoPanel.classList.contains("open");
}
function closeAllPanels() {
  closePanel(themePanel);
  closePanel(infoPanel);
}

document.getElementById("settingsBtn").addEventListener("click", () => {
  closePanel(infoPanel);
  openPanel(themePanel);
});
document.getElementById("infoBtn").addEventListener("click", () => {
  closePanel(themePanel);
  openPanel(infoPanel);
});
document.getElementById("themeClose").addEventListener("click", () => closePanel(themePanel));
document.getElementById("infoClose").addEventListener("click", () => closePanel(infoPanel));

[themePanel, infoPanel].forEach(panel => {
  panel.addEventListener("click", e => { if (e.target === panel) closePanel(panel); });
});

// ---------- انتخاب تم ----------
document.querySelectorAll(".theme-option").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.theme === currentTheme) return;
    btn.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.08)" },
        { transform: "scale(1)" }
      ],
      { duration: 320, easing: "cubic-bezier(.34,1.56,.64,1)" }
    );
    applyTheme(btn.dataset.theme);
  });
});

applyTheme(currentTheme, { animate: false });

// ---------- دکمه بازگشت / خروج ----------
document.getElementById("backBtn").addEventListener("click", () => {
  if (overlay.classList.contains("open")) {
    closeModal();
    return;
  }
  if (anyPanelOpen()) {
    closeAllPanels();
    return;
  }
  exitApp();
});

function exitApp() {
  if (window.pywebview && window.pywebview.api && window.pywebview.api.exit_app) {
    window.pywebview.api.exit_app();
  } else {
    window.close();
  }
}
