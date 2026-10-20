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
  salary: 10624,
  carryover: 400,
  reminder: "",
  expenses: [
    { category: "固定支出", icon: "🏠", item: "房贷", amount: 2700.8, note: "月度必还" },
    { category: "信用还款", icon: "💳", item: "花呗 (2480.88+28)", amount: 2508.88, note: "已合并结算" },
    { category: "健康支出", icon: "➕", item: "中药+快递费 2100+65", amount: 2165, note: "外卖/采买" },
    { category: "家庭转账", icon: "💗", item: "转给媳妇", amount: 2100, note: "——" },
  ],
};

const STORAGE_KEY = "family-money-report-v1";

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
};

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

async function exportImage() {
  readFormIntoState();
  renderReport();
  els.exportStatus.textContent = "正在生成图片…";
  els.exportBtn.disabled = true;

  try {
    const canvas = await html2canvas(els.report, {
      backgroundColor: "#fbfcfe",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const filename = `家庭收支报表-${stamp}.png`;

    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();

    els.exportStatus.textContent = `已导出：${filename}`;
  } catch (err) {
    console.error(err);
    els.exportStatus.textContent = "导出失败，请换 Chrome / Edge 再试。";
  } finally {
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
}

fillForm();
renderReport();
bind();
