/* script.js – Logika penuh tabungan, grafik, partikel, efek */
(function() {
  "use strict";

  // ---- DOM refs ----
  const $ = id => document.getElementById(id);
  const loadingScreen = $('loadingScreen');
  const namePopup = $('namePopup');
  const nameInput = $('nameInput');
  const startBtn = $('startBtn');
  const dashboard = $('dashboard');
  const userNameDisplay = $('userNameDisplay');
  const totalSavings = $('totalSavings');
  const targetDisplay = $('targetDisplay');
  const progressFill = $('progressFill');
  const progressPercent = $('progressPercent');
  const progressAmount = $('progressAmount');
  const totalIncome = $('totalIncome');
  const totalExpense = $('totalExpense');
  const currentBalance = $('currentBalance');
  const totalTransactions = $('totalTransactions');
  const historyList = $('historyList');
  const searchInput = $('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const addMoneyBtn = $('addMoneyBtn');
  const withdrawBtn = $('withdrawBtn');
  const setTargetBtn = $('setTargetBtn');
  const modal = $('transactionModal');
  const modalTitle = $('modalTitle');
  const modalAmount = $('modalAmount');
  const modalDesc = $('modalDesc');
  const modalDate = $('modalDate');
  const modalConfirmBtn = $('modalConfirmBtn');
  const closeModal = $('closeModal');
  const targetModal = $('targetModal');
  const targetInput = $('targetInput');
  const targetConfirmBtn = $('targetConfirmBtn');
  const closeTargetModal = $('closeTargetModal');
  const settingsToggle = $('settingsToggle');
  const settingsModal = $('settingsModal');
  const closeSettingsModal = $('closeSettingsModal');
  const themeToggle = $('themeToggle');
  const resetAllBtn = $('resetAllBtn');
  const exportJsonBtn = $('exportJsonBtn');
  const importJsonBtn = $('importJsonBtn');
  const importFileInput = $('importFileInput');
  const toastContainer = $('toastContainer');
  const realTimeClock = $('realTimeClock');
  const realTimeDate = $('realTimeDate');
  const quoteBox = $('quoteBox');
  const savingsChart = $('savingsChart');
  const ctx = savingsChart.getContext('2d');
  const mouseGlow = $('mouseGlow');
  const bgCanvas = $('bgCanvas');
  const bCtx = bgCanvas.getContext('2d');

  // ---- State ----
  let transactions = [];
  let target = 0;
  let userName = '';
  let currentFilter = 'all';
  let modalMode = 'add'; // 'add' or 'withdraw'
  let chartData = [];

  // ---- Quotes ----
  const quotes = [
    "“Tabungan kecil, impian besar.”",
    "“Hari ini menabung, esok tersenyum.”",
    "“Konsistensi adalah kunci kekayaan.”",
    "“Uang yang ditabung adalah kebebasan.”",
    "“Mimpi butuh dana, tabunglah.”",
    "“Setiap rupiah berharga.”",
    "“Masa depan dimulai dari tabungan.”"
  ];

  // ---- Init ----
  function init() {
    // Load dari localStorage
    const saved = localStorage.getItem('neonvault_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        transactions = data.transactions || [];
        target = data.target || 0;
        userName = data.userName || '';
        if (userName) {
          namePopup.classList.add('hidden');
          dashboard.classList.add('active');
          loadingScreen.classList.add('hidden');
          renderAll();
        } else {
          loadingScreen.classList.add('hidden');
          namePopup.classList.remove('hidden');
        }
      } catch(e) { resetData(); }
    } else {
      loadingScreen.classList.add('hidden');
      namePopup.classList.remove('hidden');
    }
    // Event listeners
    startBtn.addEventListener('click', handleStart);
    nameInput.addEventListener('keydown', e => { if(e.key === 'Enter') handleStart(); });
    addMoneyBtn.addEventListener('click', ()=> openModal('add'));
    withdrawBtn.addEventListener('click', ()=> openModal('withdraw'));
    closeModal.addEventListener('click', ()=> modal.classList.add('hidden'));
    modalConfirmBtn.addEventListener('click', confirmTransaction);
    setTargetBtn.addEventListener('click', ()=> targetModal.classList.remove('hidden'));
    closeTargetModal.addEventListener('click', ()=> targetModal.classList.add('hidden'));
    targetConfirmBtn.addEventListener('click', setTarget);
    settingsToggle.addEventListener('click', ()=> settingsModal.classList.remove('hidden'));
    closeSettingsModal.addEventListener('click', ()=> settingsModal.classList.add('hidden'));
    themeToggle.addEventListener('click', toggleTheme);
    resetAllBtn.addEventListener('click', resetAll);
    exportJsonBtn.addEventListener('click', exportData);
    importJsonBtn.addEventListener('click', ()=> importFileInput.click());
    importFileInput.addEventListener('change', importData);
    searchInput.addEventListener('input', renderHistory);
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderHistory();
      });
    });
    // clock
    setInterval(updateClock, 1000);
    updateClock();
    // quote
    quoteBox.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    // background
    initBackground();
    // mouse glow
    document.addEventListener('mousemove', e => {
      mouseGlow.style.left = e.clientX + 'px';
      mouseGlow.style.top = e.clientY + 'px';
    });
    // close modals outside
    document.querySelectorAll('.modal-overlay').forEach(el => {
      el.addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
      });
    });
    // resize chart
    window.addEventListener('resize', drawChart);
  }

  function handleStart() {
    const name = nameInput.value.trim();
    if (!name) { toast('Masukkan nama dulu'); return; }
    userName = name;
    saveData();
    namePopup.classList.add('hidden');
    dashboard.classList.add('active');
    renderAll();
    toast('Selamat datang, ' + userName + '!');
  }

  // ---- Data ----
  function saveData() {
    localStorage.setItem('neonvault_data', JSON.stringify({ transactions, target, userName }));
  }
  function resetData() {
    transactions = []; target = 0; userName = '';
    localStorage.removeItem('neonvault_data');
    renderAll();
  }

  // ---- Render ----
  function renderAll() {
    userNameDisplay.textContent = userName || 'User';
    updateStats();
    renderHistory();
    drawChart();
    updateTargetProgress();
  }

  function updateStats() {
    const totalInc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalInc - totalExp;
    totalIncome.textContent = formatRupiah(totalInc);
    totalExpense.textContent = formatRupiah(totalExp);
    currentBalance.textContent = formatRupiah(balance);
    totalTransactions.textContent = transactions.length;
    totalSavings.textContent = formatRupiah(balance);
    targetDisplay.textContent = formatRupiah(target);
  }

  function updateTargetProgress() {
    const totalInc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalInc - totalExp;
    if (target > 0) {
      const pct = Math.min(100, (balance / target) * 100);
      progressFill.style.width = pct + '%';
      progressPercent.textContent = Math.round(pct) + '%';
      progressAmount.textContent = formatRupiah(balance) + ' / ' + formatRupiah(target);
    } else {
      progressFill.style.width = '0%';
      progressPercent.textContent = '0%';
      progressAmount.textContent = formatRupiah(balance) + ' / ∞';
    }
  }

  function renderHistory() {
    const query = searchInput.value.toLowerCase();
    let filtered = [...transactions];
    // filter
    const now = new Date();
    if (currentFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(t => new Date(t.date) >= today);
    } else if (currentFilter === 'week') {
      const week = new Date(now); week.setDate(now.getDate() - 7);
      filtered = filtered.filter(t => new Date(t.date) >= week);
    } else if (currentFilter === 'month') {
      const month = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter(t => new Date(t.date) >= month);
    }
    if (query) {
      filtered = filtered.filter(t => t.desc?.toLowerCase().includes(query) || t.amount.toString().includes(query));
    }
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
    if (filtered.length === 0) {
      historyList.innerHTML = '<div class="glass" style="padding:20px;text-align:center;color:#88a0b8;">Belum ada transaksi</div>';
      return;
    }
    historyList.innerHTML = filtered.map(t => {
      const d = new Date(t.date);
      const dateStr = d.toLocaleDateString('id-ID');
      const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const isIncome = t.type === 'income';
      const icon = isIncome ? '📈' : '📉';
      const cls = isIncome ? 'income' : 'expense';
      const sign = isIncome ? '+' : '-';
      const amtCls = isIncome ? 'income' : 'expense';
      return `<div class="history-item ${cls}">
        <span class="h-icon">${icon}</span>
        <div class="h-detail">
          <div class="h-title">${t.desc || (isIncome ? 'Pemasukan' : 'Pengeluaran')}</div>
          <div class="h-meta">${dateStr} · ${timeStr}</div>
        </div>
        <div class="h-amount ${amtCls}">${sign} ${formatRupiah(t.amount)}</div>
      </div>`;
    }).join('');
  }

  // ---- Chart ----
  function drawChart() {
    if (!ctx) return;
    const W = savingsChart.width = savingsChart.clientWidth || 400;
    const H = savingsChart.height = savingsChart.clientHeight || 160;
    ctx.clearRect(0, 0, W, H);
    // ambil data 7 hari terakhir
    const now = new Date();
    const days = 7;
    const labels = [];
    const values = [];
    for (let i = days-1; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      const dayTransactions = transactions.filter(t => {
        const td = new Date(t.date);
        return td >= start && td < end;
      });
      const total = dayTransactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
      values.push(total);
      labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
    }
    const maxVal = Math.max(1, ...values.map(Math.abs));
    const pad = 12;
    const chartW = W - pad*2;
    const chartH = H - pad*2 - 10;
    const stepX = chartW / (days-1 || 1);
    const minY = 0;
    const maxY = maxVal * 1.2;

    // grid lines
    ctx.strokeStyle = 'rgba(0,229,255,0.08)';
    ctx.lineWidth = 0.5;
    for (let i=0; i<5; i++) {
      const y = pad + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(W-pad, y);
      ctx.stroke();
    }

    // draw line
    ctx.beginPath();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00e5ff88';
    ctx.shadowBlur = 12;
    for (let i=0; i<values.length; i++) {
      const x = pad + i * stepX;
      const y = pad + chartH - (values[i] / maxY) * chartH;
      if (i===0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // points
    for (let i=0; i<values.length; i++) {
      const x = pad + i * stepX;
      const y = pad + chartH - (values[i] / maxY) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2*Math.PI);
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
      // label
      ctx.fillStyle = '#88a0b8';
      ctx.font = '8px Rajdhani';
      ctx.fillText(labels[i], x-10, H-4);
    }
  }

  // ---- Modal ----
  function openModal(mode) {
    modalMode = mode;
    modalTitle.textContent = mode === 'add' ? '➕ Tambah Uang' : '➖ Ambil Uang';
    modalAmount.value = '';
    modalDesc.value = '';
    modalDate.textContent = new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
    modal.classList.remove('hidden');
    modalAmount.focus();
  }

  function confirmTransaction() {
    const amount = parseInt(modalAmount.value);
    if (!amount || amount <= 0) { toast('Nominal harus > 0'); return; }
    const desc = modalDesc.value.trim() || (modalMode === 'add' ? 'Pemasukan' : 'Penarikan');
    const trans = {
      id: Date.now() + Math.random().toString(36),
      type: modalMode === 'add' ? 'income' : 'expense',
      amount: amount,
      desc: desc,
      date: new Date().toISOString()
    };
    transactions.push(trans);
    saveData();
    renderAll();
    modal.classList.add('hidden');
    toast((modalMode === 'add' ? '➕ Berhasil tambah ' : '➖ Berhasil ambil ') + formatRupiah(amount));
    // efek suara opsional (simple beep via Web Audio)
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = modalMode === 'add' ? 880 : 440;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch(e) {}
  }

  function setTarget() {
    const val = parseInt(targetInput.value);
    if (!val || val <= 0) { toast('Target harus > 0'); return; }
    target = val;
    saveData();
    renderAll();
    targetModal.classList.add('hidden');
    toast('Target diupdate: ' + formatRupiah(target));
  }

  // ---- Settings ----
  function toggleTheme() {
    document.body.style.background = document.body.style.background === '#050816' ? '#f0f4ff' : '#050816';
    document.body.style.color = document.body.style.color === '#e0f0ff' ? '#111' : '#e0f0ff';
    themeToggle.textContent = document.body.style.background === '#050816' ? '🌓 Mode Terang' : '🌓 Mode Gelap';
  }

  function resetAll() {
    if (!confirm('Yakin reset semua data?')) return;
    resetData();
    renderAll();
    toast('Data direset');
    settingsModal.classList.add('hidden');
  }

  function exportData() {
    const data = JSON.stringify({ transactions, target, userName }, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'neonvault_backup.json';
    a.click();
    toast('Data diekspor');
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.transactions && typeof data.target === 'number') {
          transactions = data.transactions;
          target = data.target;
          userName = data.userName || userName;
          saveData();
          renderAll();
          toast('Data diimpor sukses');
          settingsModal.classList.add('hidden');
        } else {
          toast('Format file tidak valid');
        }
      } catch(e) { toast('Gagal import'); }
    };
    reader.readAsText(file);
    importFileInput.value = '';
  }

  // ---- Toast ----
  function toast(msg) {
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = msg;
    toastContainer.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s';
      setTimeout(() => div.remove(), 500);
    }, 2500);
  }

  // ---- Clock ----
  function updateClock() {
    const now = new Date();
    realTimeClock.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    realTimeDate.textContent = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ---- Background ----
  function initBackground() {
    let w, h;
    function resize() {
      w = bgCanvas.width = window.innerWidth;
      h = bgCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    for (let i=0; i<60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1
      });
    }

    function drawBg() {
      bCtx.clearRect(0, 0, w, h);
      // grid
      bCtx.strokeStyle = 'rgba(0,229,255,0.04)';
      bCtx.lineWidth = 0.5;
      const step = 50;
      for (let x=0; x<w; x+=step) {
        bCtx.beginPath();
        bCtx.moveTo(x, 0);
        bCtx.lineTo(x, h);
        bCtx.stroke();
      }
      for (let y=0; y<h; y+=step) {
        bCtx.beginPath();
        bCtx.moveTo(0, y);
        bCtx.lineTo(w, y);
        bCtx.stroke();
      }
      // particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        bCtx.beginPath();
        bCtx.arc(p.x, p.y, p.r, 0, 2*Math.PI);
        bCtx.fillStyle = `rgba(0,229,255,${p.alpha})`;
        bCtx.fill();
      });
      // glow blur
      const grd = bCtx.createRadialGradient(w*0.2, h*0.2, 10, w*0.2, h*0.2, w*0.6);
      grd.addColorStop(0, 'rgba(124,77,255,0.03)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      bCtx.fillStyle = grd;
      bCtx.fillRect(0,0,w,h);
      requestAnimationFrame(drawBg);
    }
    drawBg();
  }

  // ---- Helper ----
  function formatRupiah(num) {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  }

  // ---- Start ----
  document.addEventListener('DOMContentLoaded', init);
})();
