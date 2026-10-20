const CATEGORY_PRESETS = [
  { name: "固定支出", icon: "🏠" },
  { name: "信用还款", icon: "💳" },
  { name: "健康支出", icon: "➕" },
  { name: "家庭转账", icon: "💗" },
  { name: "日常开销", icon: "🛒" },
  { name: "餐饮外卖", icon: "🍜" },
  { name: "交通出行", icon: "🚗" },
  { name: "娱乐休闲", icon: "🎮" },
  { name: "人情往来", icon: "🎁" },
  { name: "其它支出", icon: "📦" },
];

const SAMPLE_DATA = {
  title: "本月家庭收支报表",
  subtitle: "这爱的家庭账本",
  salary: 8000,
  carryover: 500,
  reminder: "",
  expenses: [
    { category: "固定支出", icon: "🏠", item: "房租（示例）", amount: 2500, note: "月度固定" },
    { category: "日常开销", icon: "🛒", item: "生活采买（示例）", amount: 1200, note: "食材/日用品" },
    { category: "餐饮外卖", icon: "🍜", item: "餐饮（示例）", amount: 800, note: "——" },
    { category: "家庭转账", icon: "💗", item: "家庭共用（示例）", amount: 1500, note: "——" },
  ],
};

const STORAGE_KEY = "family-money-report-v2";

const els = {
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  salary: document.getElementById("salary"),
  carryover: document.getElementById("carryover"),
  reminder: document.getElementById("reminder"),
  expenseList: document.getElementById("expense-list"),
  addExpense: document.getElementById("add-expense"),
  exportBtn: document.getElementById("export-btn"),
  saveBtn: document.getElementById("save-btn"),
  resetBtn: document.getElementById("reset-btn"),
  exportStatus: document.getElementById("export-status"),
  report: document.getElementById("report"),
  reportTitle: document.getElementById("report-title"),
  reportSubtitle: document.getElementById("report-subtitle"),
  reportSalary: document.getElementById("report-salary"),
  reportCarryover: document.getElementById("report-carryover"),
  reportDisposable: document.getElementById("report-disposable"),
  reportExpenses: document.getElementById("report-expenses"),
  reportTotalExpense: document.getElementById("report-total-expense"),
  reportBalance: document.getElementById("report-balance"),
  reportReminder: document.getElementById("report-reminder"),
  reminderBox: document.getElementById("reminder-box"),
  previewFrame: document.getElementById("preview-frame"),
  exportModal: document.getElementById("export-modal"),
  exportPreview: document.getElementById("export-preview"),
  exportModalClose: document.getElementById("export-modal-close"),
  exportModalDownload: document.getElementById("export-modal-download"),
};

let lastExportUrl = "";
let lastExportName = "";

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (_) {}
  return structuredClone(SAMPLE_DATA);
}

function normalizeState(data) {
  return {
    title: data.title || SAMPLE_DATA.title,
    subtitle: data.subtitle || SAMPLE_DATA.subtitle,
    salary: Number(data.salary) || 0,
    carryover: Number(data.carryover) || 0,
    reminder: data.reminder ?? "",
    expenses: Array.isArray(data.expenses)
      ? data.expenses.map((e) => ({
          category: e.category || "其它支出",
          icon: e.icon || iconFor(e.category),
          item: e.item || "",
          amount: Number(e.amount) || 0,
          note: e.note || "",
        }))
      : [],
  };
}

function iconFor(category) {
  const found = CATEGORY_PRESETS.find((c) => c.name === category);
  return found ? found.icon : "📦";
}

function money(n) {
  const abs = Math.abs(Number(n) || 0);
  return abs.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatYen(n, negative = false) {
  const prefix = negative ? "-¥" : "¥";
  return prefix + money(n);
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function calc() {
  const salary = round2(state.salary);
  const carryover = round2(state.carryover);
  const disposable = round2(salary + carryover);
  const totalExpense = round2(
    state.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  );
  const balance = round2(disposable - totalExpense);
  return { salary, carryover, disposable, totalExpense, balance };
}

function readFormIntoState() {
  state.title = els.title.value.trim() || SAMPLE_DATA.title;
  state.subtitle = els.subtitle.value.trim() || SAMPLE_DATA.subtitle;
  state.salary = Number(els.salary.value) || 0;
  state.carryover = Number(els.carryover.value) || 0;
  state.reminder = els.reminder.value;
}

function fillForm() {
  els.title.value = state.title;
  els.subtitle.value = state.subtitle;
  els.salary.value = state.salary;
  els.carryover.value = state.carryover;
  els.reminder.value = state.reminder;
  renderExpenseEditors();
}

function renderExpenseEditors() {
  els.expenseList.innerHTML = "";
  state.expenses.forEach((expense, index) => {
    const card = document.createElement("div");
    card.className = "expense-card";
    card.innerHTML = `
      <div class="expense-card-head">
        <span>支出 #${index + 1}</span>
        <button type="button" class="btn-danger" data-remove="${index}">删除</button>
      </div>
      <div class="expense-grid">
        <div>
          <label>类别</label>
          <select data-field="category" data-index="${index}">
            ${CATEGORY_PRESETS.map(
              (c) =>
                `<option value="${c.name}" ${
                  c.name === expense.category ? "selected" : ""
                }>${c.icon} ${c.name}</option>`
            ).join("")}
            ${
              !CATEGORY_PRESETS.some((c) => c.name === expense.category)
                ? `<option value="${expense.category}" selected>${expense.icon} ${expense.category}</option>`
                : ""
            }
          </select>
        </div>
        <div>
          <label>金额（元）</label>
          <input type="number" step="0.01" min="0" data-field="amount" data-index="${index}" value="${expense.amount}" />
        </div>
        <div class="full">
          <label>项目说明</label>
          <input type="text" data-field="item" data-index="${index}" value="${escapeAttr(expense.item)}" placeholder="例如：房贷 / 花呗 (2480+28)" />
        </div>
        <div class="full">
          <label>备注</label>
          <input type="text" data-field="note" data-index="${index}" value="${escapeAttr(expense.note)}" placeholder="例如：月度必还" />
        </div>
      </div>
    `;
    els.expenseList.appendChild(card);
  });
}

function escapeAttr(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderReport() {
  const { salary, carryover, disposable, totalExpense, balance } = calc();

  els.reportTitle.innerHTML = `${escapeHtml(state.title)} <span class="emoji">💖</span>`;
  els.reportSubtitle.innerHTML = `${escapeHtml(state.subtitle)} <span class="emoji">🧡</span>`;
  els.reportSalary.textContent = formatYen(salary);
  els.reportCarryover.textContent = formatYen(carryover);
  els.reportDisposable.textContent = formatYen(disposable);
  els.reportTotalExpense.textContent = formatYen(totalExpense, true);
  els.reportBalance.textContent = formatYen(balance);

  els.reportExpenses.innerHTML = state.expenses
    .map(
      (e) => `
      <tr>
        <td>
          <div class="cat-cell">
            <span class="cat-icon">${e.icon || iconFor(e.category)}</span>
            <span>${escapeHtml(e.category)}</span>
          </div>
        </td>
        <td>${escapeHtml(e.item || "—")}</td>
        <td class="amount-cell">${formatYen(e.amount, true)}</td>
        <td class="note-cell">${escapeHtml(e.note || "——")}</td>
      </tr>
    `
    )
    .join("");

  const custom = state.reminder.trim();
  const bal = round2(balance);
  const balanceText = Number.isInteger(bal) ? String(bal) : bal.toFixed(2);
  const reminderText =
    custom || `${balanceText}元已存入零花钱，留作下月机动备用金~`;
  els.reportReminder.textContent = reminderText;
  els.reminderBox.classList.toggle("hidden", state.expenses.length === 0 && !custom);
  requestAnimationFrame(scalePreview);
}

function sync() {
  readFormIntoState();
  renderReport();
}

function addExpense() {
  readFormIntoState();
  state.expenses.push({
    category: "其它支出",
    icon: "📦",
    item: "",
    amount: 0,
    note: "",
  });
  renderExpenseEditors();
  renderReport();
}

function onExpenseListClick(e) {
  const btn = e.target.closest("[data-remove]");
  if (!btn) return;
  readFormIntoState();
  const index = Number(btn.dataset.remove);
  state.expenses.splice(index, 1);
  renderExpenseEditors();
  renderReport();
}

function onExpenseListInput(e) {
  const field = e.target.dataset.field;
  const index = e.target.dataset.index;
  if (field == null || index == null) return;

  const i = Number(index);
  if (!state.expenses[i]) return;

  if (field === "amount") {
    state.expenses[i].amount = Number(e.target.value) || 0;
  } else if (field === "category") {
    state.expenses[i].category = e.target.value;
    state.expenses[i].icon = iconFor(e.target.value);
  } else {
    state.expenses[i][field] = e.target.value;
  }
  renderReport();
}

function saveToBrowser() {
  readFormIntoState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  els.exportStatus.textContent = "已保存到本机浏览器，下次打开会自动恢复。";
}

function resetSample() {
  state = structuredClone(SAMPLE_DATA);
  localStorage.removeItem(STORAGE_KEY);
  fillForm();
  renderReport();
  els.exportStatus.textContent = "已恢复示例数据。";
}

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent || "");
}

function isMobile() {
  return window.matchMedia("(max-width: 980px)").matches || /Mobile|Android|iPhone/i.test(navigator.userAgent || "");
}

function scalePreview() {
  const frame = els.previewFrame;
  const report = els.report;
  if (!frame || !report) return;

  report.style.transform = "";
  report.style.width = "720px";

  if (!isMobile()) {
    frame.style.height = "";
    return;
  }

  const frameWidth = frame.clientWidth || window.innerWidth - 24;
  const scale = Math.min(1, frameWidth / 720);
  report.style.transform = `scale(${scale})`;
  frame.style.height = `${Math.ceil(report.scrollHeight * scale)}px`;
}

function openExportModal(dataUrl, filename) {
  lastExportUrl = dataUrl;
  lastExportName = filename;
  els.exportPreview.src = dataUrl;
  els.exportModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  if (isWeChat()) {
    els.exportModalDownload.classList.add("hidden");
    els.exportStatus.textContent = "请长按图片保存，再发给媳妇。";
  } else {
    els.exportModalDownload.classList.remove("hidden");
    els.exportStatus.textContent = `已生成：${filename}`;
  }
}

function closeExportModal() {
  els.exportModal.classList.add("hidden");
  document.body.style.overflow = "";
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function exportImage() {
  readFormIntoState();
  renderReport();
  scalePreview();
  els.exportStatus.textContent = "正在生成图片…";
  els.exportBtn.disabled = true;

  if (typeof html2canvas !== "function") {
    els.exportStatus.textContent = "导出组件加载失败，请刷新页面后重试。";
    els.exportBtn.disabled = false;
    return;
  }

  const prevTransform = els.report.style.transform;
  const prevWidth = els.report.style.width;

  try {
    // 导出时用完整宽度，避免手机缩放影响清晰度
    els.report.style.transform = "none";
    els.report.style.width = "720px";

    const canvas = await html2canvas(els.report, {
      backgroundColor: "#fbfcfe",
      scale: Math.min(2, window.devicePixelRatio || 2),
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 720,
      windowWidth: 720,
    });

    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const filename = `家庭收支报表-${stamp}.png`;
    const dataUrl = canvas.toDataURL("image/png");

    // 微信 / 手机：弹层长按保存；电脑：尝试直接下载，并仍展示预览
    if (isWeChat() || isMobile()) {
      openExportModal(dataUrl, filename);
    } else {
      try {
        downloadDataUrl(dataUrl, filename);
      } catch (_) {}
      openExportModal(dataUrl, filename);
    }
  } catch (err) {
    console.error(err);
    els.exportStatus.textContent = "导出失败，请刷新后重试；微信里也可截图预览区域。";
  } finally {
    els.report.style.transform = prevTransform;
    els.report.style.width = prevWidth;
    scalePreview();
    els.exportBtn.disabled = false;
  }
}

function bind() {
  ["title", "subtitle", "salary", "carryover", "reminder"].forEach((key) => {
    els[key].addEventListener("input", sync);
  });
  els.expenseList.addEventListener("input", onExpenseListInput);
  els.expenseList.addEventListener("change", onExpenseListInput);
  els.expenseList.addEventListener("click", onExpenseListClick);
  els.addExpense.addEventListener("click", addExpense);
  els.exportBtn.addEventListener("click", exportImage);
  els.saveBtn.addEventListener("click", saveToBrowser);
  els.resetBtn.addEventListener("click", resetSample);
  els.exportModalClose.addEventListener("click", closeExportModal);
  els.exportModal.addEventListener("click", (e) => {
    if (e.target === els.exportModal) closeExportModal();
  });
  els.exportModalDownload.addEventListener("click", () => {
    if (!lastExportUrl) return;
    downloadDataUrl(lastExportUrl, lastExportName || "家庭收支报表.png");
  });
  window.addEventListener("resize", scalePreview);
  window.addEventListener("orientationchange", () => setTimeout(scalePreview, 100));
}

fillForm();
renderReport();
bind();
scalePreview();
