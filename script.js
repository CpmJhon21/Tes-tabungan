/* ============================================================
   script.js – Logika Penuh Tabungan, Grafik, Partikel, Efek
   ============================================================ */

(function() {
  'use strict';

  // ============================================================
  // DOM REFS
  // ============================================================
  var $ = function(id) { return document.getElementById(id); };

  var loadingScreen = $('loadingScreen');
  var namePopup = $('namePopup');
  var nameInput = $('nameInput');
  var startBtn = $('startBtn');
  var dashboard = $('dashboard');

  var userNameDisplay = $('userNameDisplay');
  var totalSavings = $('totalSavings');
  var targetDisplay = $('targetDisplay');
  var progressFill = $('progressFill');
  var progressPercent = $('progressPercent');
  var progressAmount = $('progressAmount');
  var totalIncome = $('totalIncome');
  var totalExpense = $('totalExpense');
  var currentBalance = $('currentBalance');
  var totalTransactions = $('totalTransactions');
  var historyList = $('historyList');
  var searchInput = $('searchInput');
  var filterBtns = document.querySelectorAll('.filter-btn');

  var addMoneyBtn = $('addMoneyBtn');
  var withdrawBtn = $('withdrawBtn');
  var setTargetBtn = $('setTargetBtn');

  var modal = $('transactionModal');
  var modalTitle = $('modalTitle');
  var modalAmount = $('modalAmount');
  var modalDesc = $('modalDesc');
  var modalDate = $('modalDate');
  var modalConfirmBtn = $('modalConfirmBtn');
  var closeModal = $('closeModal');

  var targetModal = $('targetModal');
  var targetInput = $('targetInput');
  var targetConfirmBtn = $('targetConfirmBtn');
  var closeTargetModal = $('closeTargetModal');

  var settingsToggle = $('settingsToggle');
  var settingsModal = $('settingsModal');
  var closeSettingsModal = $('closeSettingsModal');
  var themeToggle = $('themeToggle');
  var resetAllBtn = $('resetAllBtn');
  var exportJsonBtn = $('exportJsonBtn');
  var importJsonBtn = $('importJsonBtn');
  var importFileInput = $('importFileInput');

  var toastContainer = $('toastContainer');
  var realTimeClock = $('realTimeClock');
  var realTimeDate = $('realTimeDate');
  var quoteBox = $('quoteBox');

  var savingsChart = $('savingsChart');
  var mouseGlow = $('mouseGlow');
  var bgCanvas = $('bgCanvas');

  // ============================================================
  // STATE
  // ============================================================
  var transactions = [];
  var target = 0;
  var userName = '';
  var currentFilter = 'all';
  var modalMode = 'add';
  var bgAnimationFrame = null;

  // ============================================================
  // QUOTES
  // ============================================================
  var quotes = [
    '"Tabungan kecil, impian besar."',
    '"Hari ini menabung, esok tersenyum."',
    '"Konsistensi adalah kunci kekayaan."',
    '"Uang yang ditabung adalah kebebasan."',
    '"Mimpi butuh dana, tabunglah."',
    '"Setiap rupiah berharga."',
    '"Masa depan dimulai dari tabungan."',
    '"Sedikit demi sedikit, lama-lama jadi bukit."',
    '"Menabung adalah investasi untuk diri sendiri."',
    '"Bijak menabung, bahagia hidup."',
    '"Hemat pangkal kaya."',
    '"Tabungan adalah pelindung masa depan."'
  ];

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    try {
      // Load data dari localStorage
      var saved = localStorage.getItem('neonvault_data');
      if (saved) {
        try {
          var data = JSON.parse(saved);
          transactions = Array.isArray(data.transactions) ? data.transactions : [];
          target = typeof data.target === 'number' ? data.target : 0;
          userName = typeof data.userName === 'string' ? data.userName : '';
        } catch (e) {
          console.warn('Gagal parse data, gunakan default');
          transactions = [];
          target = 0;
          userName = '';
        }
      }

      // Tampilkan popup atau dashboard
      if (userName) {
        if (namePopup) namePopup.classList.add('hidden');
        if (dashboard) dashboard.classList.add('active');
        renderAll();
      } else {
        if (namePopup) namePopup.classList.remove('hidden');
        if (dashboard) dashboard.classList.remove('active');
      }

      // Sembunyikan loading
      if (loadingScreen) loadingScreen.classList.add('hidden');

    } catch (e) {
      console.error('Error init:', e);
      if (loadingScreen) loadingScreen.classList.add('hidden');
      if (namePopup) namePopup.classList.remove('hidden');
    }

    // Setup semua event listeners
    setupEventListeners();

    // Clock
    updateClock();
    setInterval(updateClock, 1000);

    // Quote random
    if (quoteBox) {
      quoteBox.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    }

    // Background
    initBackground();

    // Mouse glow (non-touch devices)
    if (!('ontouchstart' in window)) {
      document.addEventListener('mousemove', function(e) {
        if (mouseGlow) {
          mouseGlow.style.left = e.clientX + 'px';
          mouseGlow.style.top = e.clientY + 'px';
        }
      });
    } else {
      // Sembunyikan mouse glow di touch device
      if (mouseGlow) mouseGlow.style.display = 'none';
    }

    // Close modal saat klik di luar
    document.querySelectorAll('.modal-overlay').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.add('hidden');
        }
      });
    });

    // Resize chart
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (dashboard && dashboard.classList.contains('active')) {
          drawChart();
        }
      }, 250);
    });

    // Ripple effect untuk button
    document.querySelectorAll('.neon-btn').forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var rect = this.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        this.style.setProperty('--x', x + '%');
        this.style.setProperty('--y', y + '%');
      });
    });
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  function setupEventListeners() {
    // Start
    if (startBtn) {
      startBtn.addEventListener('click', handleStart);
      startBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleStart();
      });
    }
    if (nameInput) {
      nameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleStart();
      });
    }

    // Action buttons
    if (addMoneyBtn) {
      addMoneyBtn.addEventListener('click', function() {
        openModal('add');
      });
    }
    if (withdrawBtn) {
      withdrawBtn.addEventListener('click', function() {
        openModal('withdraw');
      });
    }

    // Modal transaction
    if (closeModal) {
      closeModal.addEventListener('click', function() {
        if (modal) modal.classList.add('hidden');
      });
    }
    if (modalConfirmBtn) {
      modalConfirmBtn.addEventListener('click', confirmTransaction);
    }

    // Modal target
    if (setTargetBtn) {
      setTargetBtn.addEventListener('click', function() {
        if (targetModal) {
          targetModal.classList.remove('hidden');
          setTimeout(function() {
            if (targetInput) targetInput.focus();
          }, 100);
        }
      });
    }
    if (closeTargetModal) {
      closeTargetModal.addEventListener('click', function() {
        if (targetModal) targetModal.classList.add('hidden');
      });
    }
    if (targetConfirmBtn) {
      targetConfirmBtn.addEventListener('click', setTarget);
    }
    if (targetInput) {
      targetInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') setTarget();
      });
    }

    // Settings
    if (settingsToggle) {
      settingsToggle.addEventListener('click', function() {
        if (settingsModal) settingsModal.classList.remove('hidden');
      });
    }
    if (closeSettingsModal) {
      closeSettingsModal.addEventListener('click', function() {
        if (settingsModal) settingsModal.classList.add('hidden');
      });
    }
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', resetAll);
    }
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', exportData);
    }
    if (importJsonBtn) {
      importJsonBtn.addEventListener('click', function() {
        if (importFileInput) importFileInput.click();
      });
    }
    if (importFileInput) {
      importFileInput.addEventListener('change', importData);
    }

    // Search & Filter
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        renderHistory();
      });
    }
    if (filterBtns) {
      filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          filterBtns.forEach(function(b) {
            b.classList.remove('active');
          });
          this.classList.add('active');
          currentFilter = this.getAttribute('data-filter') || 'all';
          renderHistory();
        });
      });
    }

    // Modal enter key
    if (modalAmount) {
      modalAmount.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          if (modalDesc) modalDesc.focus();
        }
      });
    }
    if (modalDesc) {
      modalDesc.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') confirmTransaction();
      });
    }
  }

  // ============================================================
  // HANDLE START
  // ============================================================
  function handleStart() {
    if (!nameInput) return;
    var name = nameInput.value.trim();
    if (!name) {
      toast('Masukkan nama terlebih dahulu');
      nameInput.focus();
      return;
    }
    userName = name;
    saveData();
    if (namePopup) namePopup.classList.add('hidden');
    if (dashboard) dashboard.classList.add('active');
    renderAll();
    toast('Selamat datang, ' + userName + '! ✦');
  }

  // ============================================================
  // DATA
  // ============================================================
  function saveData() {
    try {
      localStorage.setItem('neonvault_data', JSON.stringify({
        transactions: transactions || [],
        target: target || 0,
        userName: userName || ''
      }));
    } catch (e) {
      console.error('Gagal save data:', e);
    }
  }

  function resetData() {
    transactions = [];
    target = 0;
    userName = '';
    try {
      localStorage.removeItem('neonvault_data');
    } catch (e) {
      console.error('Gagal remove data:', e);
    }
    renderAll();
  }

  // ============================================================
  // RENDER
  // ============================================================
  function renderAll() {
    if (userNameDisplay) {
      userNameDisplay.textContent = userName || 'User';
    }
    updateStats();
    renderHistory();
    drawChart();
    updateTargetProgress();
  }

  function updateStats() {
    var totalInc = transactions.filter(function(t) {
      return t.type === 'income';
    }).reduce(function(s, t) {
      return s + (t.amount || 0);
    }, 0);

    var totalExp = transactions.filter(function(t) {
      return t.type === 'expense';
    }).reduce(function(s, t) {
      return s + (t.amount || 0);
    }, 0);

    var balance = totalInc - totalExp;

    if (totalIncome) totalIncome.textContent = formatRupiah(totalInc);
    if (totalExpense) totalExpense.textContent = formatRupiah(totalExp);
    if (currentBalance) currentBalance.textContent = formatRupiah(balance);
    if (totalTransactions) totalTransactions.textContent = transactions.length;
    if (totalSavings) totalSavings.textContent = formatRupiah(balance);
    if (targetDisplay) targetDisplay.textContent = formatRupiah(target);
  }

  function updateTargetProgress() {
    var totalInc = transactions.filter(function(t) {
      return t.type === 'income';
    }).reduce(function(s, t) {
      return s + (t.amount || 0);
    }, 0);

    var totalExp = transactions.filter(function(t) {
      return t.type === 'expense';
    }).reduce(function(s, t) {
      return s + (t.amount || 0);
    }, 0);

    var balance = totalInc - totalExp;

    if (target > 0) {
      var pct = Math.min(100, (balance / target) * 100);
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressPercent) progressPercent.textContent = Math.round(pct) + '%';
      if (progressAmount) {
        progressAmount.textContent = formatRupiah(balance) + ' / ' + formatRupiah(target);
      }
    } else {
      if (progressFill) progressFill.style.width = '0%';
      if (progressPercent) progressPercent.textContent = '0%';
      if (progressAmount) {
        progressAmount.textContent = formatRupiah(balance) + ' / ∞';
      }
    }
  }

  function renderHistory() {
    if (!historyList) return;

    var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var filtered = transactions.slice();
    var now = new Date();

    // Filter berdasarkan waktu
    if (currentFilter === 'today') {
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(function(t) {
        return new Date(t.date) >= today;
      });
    } else if (currentFilter === 'week') {
      var week = new Date(now);
      week.setDate(now.getDate() - 7);
      filtered = filtered.filter(function(t) {
        return new Date(t.date) >= week;
      });
    } else if (currentFilter === 'month') {
      var month = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter(function(t) {
        return new Date(t.date) >= month;
      });
    }

    // Filter berdasarkan pencarian
    if (query) {
      filtered = filtered.filter(function(t) {
        var desc = (t.desc || '').toLowerCase();
        return desc.includes(query) || t.amount.toString().includes(query);
      });
    }

    // Urutkan terbaru
    filtered.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    if (filtered.length === 0) {
      historyList.innerHTML = 
        '<div class="glass" style="padding:20px;text-align:center;color:#88a0b8;border-radius:20px;">' +
        'Belum ada transaksi' +
        '</div>';
      return;
    }

    var html = '';
    filtered.forEach(function(t) {
      try {
        var d = new Date(t.date);
        var dateStr = d.toLocaleDateString('id-ID');
        var timeStr = d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });
        var isIncome = t.type === 'income';
        var icon = isIncome ? '📈' : '📉';
        var cls = isIncome ? 'income' : 'expense';
        var sign = isIncome ? '+' : '-';
        var amtCls = isIncome ? 'income' : 'expense';
        var desc = t.desc || (isIncome ? 'Pemasukan' : 'Pengeluaran');

        html += '<div class="history-item ' + cls + '">';
        html += '<span class="h-icon">' + icon + '</span>';
        html += '<div class="h-detail">';
        html += '<div class="h-title">' + escapeHtml(desc) + '</div>';
        html += '<div class="h-meta">' + dateStr + ' · ' + timeStr + '</div>';
        html += '</div>';
        html += '<div class="h-amount ' + amtCls + '">' + sign + ' ' + formatRupiah(t.amount) + '</div>';
        html += '</div>';
      } catch (e) {
        console.warn('Error render item:', e);
      }
    });

    historyList.innerHTML = html;
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================
  // CHART
  // ============================================================
  function drawChart() {
    if (!savingsChart) return;

    var ctx = savingsChart.getContext('2d');
    if (!ctx) return;

    var W = savingsChart.clientWidth || 400;
    var H = savingsChart.clientHeight || 160;
    savingsChart.width = W;
    savingsChart.height = H;

    ctx.clearRect(0, 0, W, H);

    var now = new Date();
    var days = 7;
    var values = [];
    var labels = [];

    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(now);
      d.setDate(now.getDate() - i);
      var start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      var end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      var dayTotal = 0;
      for (var j = 0; j < transactions.length; j++) {
        var td = new Date(transactions[j].date);
        if (td >= start && td < end) {
          dayTotal += (transactions[j].type === 'income' ?
            transactions[j].amount :
            -transactions[j].amount);
        }
      }
      values.push(dayTotal);
      labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
    }

    var maxVal = 1;
    for (var k = 0; k < values.length; k++) {
      if (Math.abs(values[k]) > maxVal) maxVal = Math.abs(values[k]);
    }
    if (maxVal === 0) maxVal = 1;

    var pad = 12;
    var chartW = W - pad * 2;
    var chartH = H - pad * 2 - 10;
    var stepX = chartW / (days - 1 || 1);
    var maxY = maxVal * 1.2;

    // Grid lines
    ctx.strokeStyle = 'rgba(0,229,255,0.06)';
    ctx.lineWidth = 0.5;
    for (var g = 0; g < 5; g++) {
      var gy = pad + (chartH / 5) * g;
      ctx.beginPath();
      ctx.moveTo(pad, gy);
      ctx.lineTo(W - pad, gy);
      ctx.stroke();
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0,229,255,0.5)';
    ctx.shadowBlur = 12;

    for (var l = 0; l < values.length; l++) {
      var x = pad + l * stepX;
      var y = pad + chartH - (values[l] / maxY) * chartH;
      if (l === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Points & labels
    for (var p = 0; p < values.length; p++) {
      var px = pad + p * stepX;
      var py = pad + chartH - (values[p] / maxY) * chartH;

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = 'rgba(0,229,255,0.8)';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#88a0b8';
      ctx.font = '8px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText(labels[p], px, H - 4);
    }

    // Area fill bawah
    ctx.beginPath();
    var firstX = pad;
    var firstY = pad + chartH - (values[0] / maxY) * chartH;
    ctx.moveTo(firstX, pad + chartH);
    ctx.lineTo(firstX, firstY);
    for (var a = 1; a < values.length; a++) {
      var ax = pad + a * stepX;
      var ay = pad + chartH - (values[a] / maxY) * chartH;
      ctx.lineTo(ax, ay);
    }
    var lastX = pad + (values.length - 1) * stepX;
    ctx.lineTo(lastX, pad + chartH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,229,255,0.05)';
    ctx.fill();
  }

  // ============================================================
  // MODAL
  // ============================================================
  function openModal(mode) {
    if (!modal) return;
    modalMode = mode;
    if (modalTitle) {
      modalTitle.textContent = mode === 'add' ? '➕ Tambah Uang' : '➖ Ambil Uang';
    }
    if (modalAmount) modalAmount.value = '';
    if (modalDesc) modalDesc.value = '';
    if (modalDate) {
      modalDate.textContent = new Date().toLocaleDateString('id-ID') + ' ' +
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });
    }
    modal.classList.remove('hidden');
    setTimeout(function() {
      if (modalAmount) modalAmount.focus();
    }, 100);
  }

  function confirmTransaction() {
    if (!modalAmount) return;
    var amount = parseInt(modalAmount.value);
    if (!amount || amount <= 0) {
      toast('Nominal harus lebih dari 0');
      modalAmount.focus();
      return;
    }
    var desc = modalDesc ? modalDesc.value.trim() : '';
    desc = desc || (modalMode === 'add' ? 'Pemasukan' : 'Penarikan');

    var trans = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      type: modalMode === 'add' ? 'income' : 'expense',
      amount: amount,
      desc: desc,
      date: new Date().toISOString()
    };

    transactions.push(trans);
    saveData();
    renderAll();
    if (modal) modal.classList.add('hidden');
    toast((modalMode === 'add' ? '➕ Berhasil tambah ' : '➖ Berhasil ambil ') +
      formatRupiah(amount));

    // Sound effect
    try {
      var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = modalMode === 'add' ? 880 : 440;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      // Audio tidak didukung, abaikan
    }
  }

  function setTarget() {
    if (!targetInput) return;
    var val = parseInt(targetInput.value);
    if (!val || val <= 0) {
      toast('Target harus lebih dari 0');
      targetInput.focus();
      return;
    }
    target = val;
    saveData();
    renderAll();
    if (targetModal) targetModal.classList.add('hidden');
    toast('Target diupdate: ' + formatRupiah(target));
  }

  // ============================================================
  // SETTINGS
  // ============================================================
  function toggleTheme() {
    var isDark = document.body.classList.contains('light-mode') === false;
    if (isDark) {
      document.body.classList.add('light-mode');
      if (themeToggle) themeToggle.textContent = '🌓 Mode Gelap';
    } else {
      document.body.classList.remove('light-mode');
      if (themeToggle) themeToggle.textContent = '🌓 Mode Terang';
    }
    toast('Tema diubah');
  }

  function resetAll() {
    if (!confirm('⚠️ Yakin ingin mereset semua data? Tindakan ini tidak bisa dibatalkan.')) return;
    resetData();
    renderAll();
    toast('Semua data telah direset');
    if (settingsModal) settingsModal.classList.add('hidden');
  }

  function exportData() {
    try {
      var data = JSON.stringify({
        transactions: transactions || [],
        target: target || 0,
        userName: userName || ''
      }, null, 2);
      var blob = new Blob([data], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'neonvault_backup_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast('📤 Data berhasil diekspor');
    } catch (e) {
      toast('Gagal ekspor data');
      console.error(e);
    }
  }

  function importData(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (data.transactions && typeof data.target === 'number') {
          transactions = Array.isArray(data.transactions) ? data.transactions : [];
          target = data.target || 0;
          if (data.userName) userName = data.userName;
          saveData();
          renderAll();
          toast('📥 Data berhasil diimpor');
          if (settingsModal) settingsModal.classList.add('hidden');
        } else {
          toast('Format file tidak valid');
        }
      } catch (e) {
        toast('Gagal membaca file: ' + e.message);
        console.error(e);
      }
    };
    reader.readAsText(file);
    if (importFileInput) importFileInput.value = '';
  }

  // ============================================================
  // TOAST
  // ============================================================
  function toast(msg) {
    if (!toastContainer) return;
    var div = document.createElement('div');
    div.className = 'toast';
    div.textContent = msg;
    toastContainer.appendChild(div);
    setTimeout(function() {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s ease';
      setTimeout(function() {
        if (div.parentNode) div.remove();
      }, 500);
    }, 2800);
  }

  // ============================================================
  // CLOCK
  // ============================================================
  function updateClock() {
    try {
      var now = new Date();
      if (realTimeClock) {
        realTimeClock.textContent = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      if (realTimeDate) {
        realTimeDate.textContent = now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch (e) {
      // Abaikan error clock
    }
  }

  // ============================================================
  // BACKGROUND
  // ============================================================
  function initBackground() {
    if (!bgCanvas) return;

    var ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    var w, h;

    function resize() {
      w = bgCanvas.width = window.innerWidth;
      h = bgCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var particles = [];
    var particleCount = Math.min(70, Math.floor(window.innerWidth / 10));
    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1
      });
    }

    function drawBg() {
      if (!ctx || !bgCanvas) return;

      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(0,229,255,0.03)';
      ctx.lineWidth = 0.5;
      var step = 50;
      for (var x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (var y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Particles
      for (var p = 0; p < particles.length; p++) {
        var part = particles[p];
        part.x += part.vx;
        part.y += part.vy;
        if (part.x < 0) part.x = w;
        if (part.x > w) part.x = 0;
        if (part.y < 0) part.y = h;
        if (part.y > h) part.y = 0;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.r, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0,229,255,' + part.alpha + ')';
        ctx.fill();
      }

      // Glow blur
      var grd = ctx.createRadialGradient(
        w * 0.15, h * 0.15, 10,
        w * 0.15, h * 0.15, w * 0.7
      );
      grd.addColorStop(0, 'rgba(124,77,255,0.03)');
      grd.addColorStop(0.5, 'rgba(0,229,255,0.015)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      bgAnimationFrame = requestAnimationFrame(drawBg);
    }
    drawBg();
  }

  // ============================================================
  // HELPER
  // ============================================================
  function formatRupiah(num) {
    if (typeof num !== 'number') num = 0;
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  // ============================================================
  // START
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
