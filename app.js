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
  voiceBtn: document.getElementById("voice-btn"),
  voiceStatus: document.getElementById("voice-status"),
  voiceHint: document.getElementById("voice-hint"),
  voiceText: document.getElementById("voice-text"),
  voiceTextBtn: document.getElementById("voice-text-btn"),
};

let lastExportUrl = "";
let lastExportName = "";
let recognition = null;
let listening = false;

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

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent || "");
}

function isMobile() {
  return window.matchMedia("(max-width: 980px)").matches || /Mobile|Android|iPhone/i.test(navigator.userAgent || "");
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
  els.exportStatus.textContent = "正在生成图片…";
  els.exportBtn.disabled = true;

  if (typeof html2canvas !== "function") {
    els.exportStatus.textContent = "导出组件加载失败，请刷新页面后重试。";
    els.exportBtn.disabled = false;
    return;
  }

  // 离屏克隆固定 720 宽导出，不影响手机预览布局
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:720px;pointer-events:none;opacity:0;";
  const clone = els.report.cloneNode(true);
  clone.id = "report-export-clone";
  clone.style.cssText =
    "width:720px;max-width:720px;margin:0;transform:none;box-sizing:border-box;";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(clone, {
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
    host.remove();
    els.exportBtn.disabled = false;
  }
}

function parseSpokenAmount(text) {
  const arabic = text.match(/(\d+(?:\.\d+)?)/);
  if (arabic) return Number(arabic[1]);

  const map = {
    零: 0,
    〇: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  let n = 0;
  let current = 0;
  let hasUnit = false;
  let lastUnit = 1;
  let sawZero = false;
  for (const ch of text) {
    if (ch === "零" || ch === "〇") {
      sawZero = true;
      current = 0;
      continue;
    }
    if (map[ch] != null) {
      current = map[ch];
      continue;
    }
    const unit = { 十: 10, 百: 100, 千: 1000, 万: 10000 }[ch];
    if (!unit) continue;
    if (unit === 10000) n = (n + current) * unit;
    else n += (current || 1) * unit;
    current = 0;
    hasUnit = true;
    lastUnit = unit;
    sawZero = false;
  }
  if (current) {
    // 「两千五」= 2500，「一万五」= 15000；「两千零五」仍是 2005。
    n += !sawZero && lastUnit >= 100 ? current * (lastUnit / 10) : current;
    hasUnit = true;
  }
  return hasUnit || n > 0 ? n : null;
}

function guessCategory(text) {
  const pairs = [
    ["房", "固定支出"],
    ["租", "固定支出"],
    ["贷", "固定支出"],
    ["花呗", "信用还款"],
    ["信用卡", "信用还款"],
    ["还款", "信用还款"],
    ["药", "健康支出"],
    ["医", "健康支出"],
    ["媳妇", "家庭转账"],
    ["转账", "家庭转账"],
    ["外卖", "餐饮外卖"],
    ["餐饮", "餐饮外卖"],
    ["饭", "餐饮外卖"],
    ["菜", "日常开销"],
    ["超市", "日常开销"],
    ["采买", "日常开销"],
    ["加油", "交通出行"],
    ["打车", "交通出行"],
    ["地铁", "交通出行"],
  ];
  for (const [key, cat] of pairs) {
    if (text.includes(key)) return cat;
  }
  return "其它支出";
}

function applyVoiceCommand(raw, note = "语音录入") {
  const text = String(raw || "")
    .replace(/\s+/g, "")
    .replace(/[，。！？、]/g, "");
  if (!text) return "没听清，请再说一次。";

  const amount = parseSpokenAmount(text);

  if (/工资|收入|实发/.test(text) && amount != null) {
    state.salary = amount;
    fillForm();
    renderReport();
    return `已设置工资为 ¥${money(amount)}`;
  }

  if (/结转|结余|上月/.test(text) && amount != null) {
    state.carryover = amount;
    fillForm();
    renderReport();
    return `已设置上月结转为 ¥${money(amount)}`;
  }

  if (/提醒|零花钱/.test(text)) {
    state.reminder = raw.trim();
    fillForm();
    renderReport();
    return "已更新零花钱提醒文案";
  }

  if (/支出|花费|开销|添加|记一笔|消费/.test(text) || amount != null) {
    const category = guessCategory(text);
    let item = text
      .replace(/支出|花费|开销|添加|记一笔|消费|元|块钱|块/g, "")
      .replace(/(\d+(?:\.\d+)?)/g, "")
      .replace(/[零〇一二两三四五六七八九十百千万]/g, "")
      .trim();
    if (!item) item = category;
    state.expenses.push({
      category,
      icon: iconFor(category),
      item,
      amount: amount || 0,
      note,
    });
    fillForm();
    renderReport();
    return `已添加支出：${category} / ${item} / ¥${money(amount || 0)}`;
  }

  return `已识别「${raw}」，可说：工资八千、结转五百、支出房租两千五`;
}

function getSpeechRecognition() {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function setVoiceUi(isOn, message) {
  listening = isOn;
  els.voiceBtn.classList.toggle("listening", isOn);
  els.voiceBtn.textContent = isOn ? "⏹ 说完点停止" : "🎤 点一下说话";
  if (message != null) els.voiceStatus.textContent = message;
}

const VOICE_FALLBACK_TIP =
  "请点下方输入框，再用键盘上的麦克风说话，说完点「录入」。也可以右上角 ··· → 在浏览器打开后再用上方按钮。";

function focusVoiceFallback(message) {
  if (message) els.voiceStatus.textContent = message;
  els.voiceText.focus();
}

function submitVoiceText() {
  const raw = els.voiceText.value;
  const result = applyVoiceCommand(raw, "快捷录入");
  els.voiceStatus.textContent = result;
  if (result.startsWith("已")) els.voiceText.value = "";
}

function stopVoice() {
  if (recognition) {
    try {
      recognition.stop();
    } catch (_) {}
  }
  setVoiceUi(false);
}

function startVoice() {
  if (isWeChat()) {
    focusVoiceFallback(`微信禁止了网页语音识别，所以上方按钮会失败。${VOICE_FALLBACK_TIP}`);
    return;
  }

  const rec = getSpeechRecognition();
  if (!rec) {
    focusVoiceFallback(`当前浏览器不支持网页语音识别。${VOICE_FALLBACK_TIP}`);
    return;
  }

  recognition = rec;
  recognition.lang = "zh-CN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => setVoiceUi(true, "正在听，请说话…");
  recognition.onerror = (e) => {
    const code = e.error || "";
    const fallbackCodes = {
      "service-not-allowed": `当前浏览器禁止了网页语音服务。${VOICE_FALLBACK_TIP}`,
      "not-allowed": `没有麦克风权限。可以到系统设置里允许，也可以点下方输入框，用键盘麦克风说话后点「录入」。`,
      network: `连不上网页语音服务（国内网络经常如此）。${VOICE_FALLBACK_TIP}`,
    };
    if (fallbackCodes[code]) {
      setVoiceUi(false);
      focusVoiceFallback(fallbackCodes[code]);
      return;
    }
    const map = {
      "no-speech": "没有听到声音，请再试一次。",
      aborted: "",
    };
    setVoiceUi(false, map[code] ?? `语音失败：${code || "未知错误"}`);
  };
  recognition.onend = () => setVoiceUi(false, els.voiceStatus.textContent || "");
  recognition.onresult = (event) => {
    const said = event.results?.[0]?.[0]?.transcript || "";
    const result = applyVoiceCommand(said);
    els.voiceStatus.textContent = `识别：${said}。${result}`;
  };

  try {
    recognition.start();
  } catch (err) {
    console.error(err);
    focusVoiceFallback(`无法启动网页语音。${VOICE_FALLBACK_TIP}`);
  }
}

function toggleVoice() {
  if (listening) {
    stopVoice();
    return;
  }
  startVoice();
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
  els.voiceBtn.addEventListener("click", toggleVoice);
  els.voiceTextBtn.addEventListener("click", submitVoiceText);
  els.voiceText.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitVoiceText();
    }
  });
  els.exportModalClose.addEventListener("click", closeExportModal);
  els.exportModal.addEventListener("click", (e) => {
    if (e.target === els.exportModal) closeExportModal();
  });
  els.exportModalDownload.addEventListener("click", () => {
    if (!lastExportUrl) return;
    downloadDataUrl(lastExportUrl, lastExportName || "家庭收支报表.png");
  });
}

fillForm();
renderReport();
bind();

if (isWeChat()) {
  els.voiceHint.textContent =
    "微信里网页语音会被禁止。请点下方输入框，用键盘上的麦克风说「工资八千」「结转五百」「支出房租两千五」，说完点录入。";
}
