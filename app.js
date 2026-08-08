/**
 * ============================================================
 * app.js – NEONVAULT V2 Main Application
 * Version: 2.0.0
 * Description: Personal Savings Manager with Cyberpunk Design
 * ============================================================
 */

(function() {
  'use strict';

  // ============================================================
  // 1. HELPERS & UTILITIES
  // ============================================================

  function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
  }

  function formatCurrency(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
  }

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  function getCurrentDateTime() {
    return new Date().toISOString();
  }

  function formatDate(dateStr) {
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  function formatTime(dateStr) {
    try {
      var d = new Date(dateStr);
      return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }

  function formatDateTime(dateStr) {
    return formatDate(dateStr) + ' · ' + formatTime(dateStr);
  }

  function getCategoryIcon(cat) {
    var icons = {
      food: '🍔',
      transport: '🚗',
      shopping: '🛒',
      salary: '💼',
      bonus: '🎁',
      home: '🏠',
      education: '🎓',
      entertainment: '🎮',
      savings: '💰',
      other: '📦'
    };
    return icons[cat] || '📦';
  }

  function getCategoryName(cat) {
    var names = {
      food: 'Makanan',
      transport: 'Transportasi',
      shopping: 'Belanja',
      salary: 'Gaji',
      bonus: 'Bonus',
      home: 'Rumah',
      education: 'Pendidikan',
      entertainment: 'Hiburan',
      savings: 'Tabungan',
      other: 'Lainnya'
    };
    return names[cat] || 'Lainnya';
  }

  function sanitize(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================
  // 2. FINANCE CALCULATIONS
  // ============================================================

  function getTotalIncome(txs) {
    return txs.filter(function(t) { return t.type === 'income'; })
      .reduce(function(s, t) { return s + t.amount; }, 0);
  }

  function getTotalExpense(txs) {
    return txs.filter(function(t) { return t.type === 'expense'; })
      .reduce(function(s, t) { return s + t.amount; }, 0);
  }

  function getTotalSaving(txs) {
    return txs.filter(function(t) { return t.type === 'saving'; })
      .reduce(function(s, t) { return s + t.amount; }, 0);
  }

  function getTotalBalance(txs) {
    var balance = 0;
    txs.forEach(function(t) {
      if (t.type === 'income') balance += t.amount;
      else if (t.type === 'expense') balance -= t.amount;
    });
    return balance;
  }

  function getTotalGoalSavings(goals) {
    return goals.reduce(function(s, g) { return s + g.saved; }, 0);
  }

  function getActiveGoals(goals) {
    return goals.filter(function(g) { return g.saved < g.target; });
  }

  function getCompletedGoals(goals) {
    return goals.filter(function(g) { return g.saved >= g.target; });
  }

  function calculateProgress(goal) {
    if (!goal || goal.target <= 0) return 0;
    return Math.min(100, (goal.saved / goal.target) * 100);
  }

  // ============================================================
  // 3. STORAGE MANAGEMENT
  // ============================================================

  var STORAGE_KEY = 'neonvault_data_v2';

  function getDefaultData() {
    return {
      version: 2,
      settings: {
        theme: 'dark',
        currency: 'IDR',
        reminders: true,
        onboardingComplete: false,
        userName: ''
      },
      goals: [],
      transactions: []
    };
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        var def = getDefaultData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
        return def;
      }
      var data = JSON.parse(raw);
      if (!data.settings) data.settings = getDefaultData().settings;
      if (!data.goals) data.goals = [];
      if (!data.transactions) data.transactions = [];
      return data;
    } catch (e) {
      var def = getDefaultData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
      return def;
    }
  }

  function saveData(data) {
    try {
      data.version = 2;
      data.lastSaved = getCurrentDateTime();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save error:', e);
      return false;
    }
  }

  function resetAllData() {
    try {
      var def = getDefaultData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
      return def;
    } catch (e) {
      console.error('Reset error:', e);
      return null;
    }
  }

  function exportData() {
    try {
      var data = loadData();
      return JSON.stringify({
        version: 2,
        exportedAt: getCurrentDateTime(),
        data: data
      }, null, 2);
    } catch (e) {
      return null;
    }
  }

  function importData(jsonStr) {
    try {
      var imported = JSON.parse(jsonStr);
      if (imported.data && imported.data.transactions) {
        return saveData(imported.data);
      }
      if (imported.transactions && imported.goals) {
        return saveData(imported);
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  // ============================================================
  // 4. APPLICATION STATE
  // ============================================================

  var appData = null;
  var currentPage = 'dashboard';
  var transactionToUndo = null;
  var selectedColor = '#00e5ff';

  // ============================================================
  // 5. DOM REFS
  // ============================================================

  var loadingScreen = document.getElementById('loadingScreen');
  var onboarding = document.getElementById('onboarding');
  var onboardingStart = document.getElementById('onboardingStart');
  var namePopup = document.getElementById('namePopup');
  var nameInput = document.getElementById('nameInput');
  var startBtn = document.getElementById('startBtn');
  var dashboard = document.getElementById('dashboard');
  var mainContent = document.getElementById('mainContent');
  var toastContainer = document.getElementById('toastContainer');
  var clockEl = document.getElementById('realTimeClock');
  var dateEl = document.getElementById('realTimeDate');
  var settingsToggle = document.getElementById('settingsToggle');

  // ============================================================
  // 6. TOAST NOTIFICATION
  // ============================================================

  function showToast(message, type, undoCallback) {
    type = type || 'success';
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span>' + message + '</span>' +
      (undoCallback ? '<button class="toast-undo" onclick="window._undoCallback && window._undoCallback()">UNDO</button>' :
        '');

    if (undoCallback) {
      window._undoCallback = undoCallback;
    }

    toastContainer.appendChild(toast);

    setTimeout(function() {
      toast.classList.add('removing');
      setTimeout(function() {
        if (toast.parentNode) toast.remove();
        window._undoCallback = null;
      }, 300);
    }, 3000);
  }

  // ============================================================
  // 7. MODAL FUNCTIONS
  // ============================================================

  function closeModal(id) {
    var el = document.getElementById(id);
    if (el && el.parentNode) {
      el.remove();
    }
  }

  function openTransactionModal(type) {
    type = type || 'income';
    var titles = {
      income: '➕ Tambah Pemasukan',
      expense: '➖ Tambah Pengeluaran',
      saving: '💰 Tambah Tabungan'
    };

    var modal = document.createElement('div');
    modal.className = 'popup-overlay active';
    modal.id = 'transactionModal';
    modal.innerHTML =
      '<div class="popup-glass">' +
      '<button class="modal-close" onclick="closeModal(\'transactionModal\')">✕</button>' +
      '<div class="popup-title">' + (titles[type] || titles.income) + '</div>' +
      '<input type="number" id="modalAmount" placeholder="Nominal" min="1" step="1" />' +
      '<select id="modalCategory">' +
      '<option value="food">🍔 Makanan</option>' +
      '<option value="transport">🚗 Transportasi</option>' +
      '<option value="shopping">🛒 Belanja</option>' +
      '<option value="salary">💼 Gaji</option>' +
      '<option value="bonus">🎁 Bonus</option>' +
      '<option value="home">🏠 Rumah</option>' +
      '<option value="education">🎓 Pendidikan</option>' +
      '<option value="entertainment">🎮 Hiburan</option>' +
      '<option value="savings">💰 Tabungan</option>' +
      '<option value="other">📦 Lainnya</option>' +
      '</select>' +
      (type === 'saving' ? '<select id="modalGoal"><option value="">Pilih Target</option>' +
        appData.goals.filter(function(g) { return g.saved < g.target; }).map(function(g) {
          return '<option value="' + g.id + '">' + (g.icon || '🎯') + ' ' + sanitize(g.name) +
          '</option>';
        }).join('') + '</select>' : '') +
      '<input type="text" id="modalDesc" placeholder="Catatan (opsional)" maxlength="100" />' +
      '<div style="color:#88a0b8;margin-bottom:12px;font-size:0.85rem;">📅 ' + formatDateTime(
        getCurrentDateTime()) + '</div>' +
      '<button class="neon-btn full" onclick="confirmTransaction(\'' + type + '\')">Simpan Transaksi</button>' +
      '<button class="neon-btn small" style="margin-top:8px;width:100%;" onclick="closeModal(\'transactionModal\')">Batal</button>' +
      '</div>';

    document.body.appendChild(modal);
    setTimeout(function() {
      var el = document.getElementById('modalAmount');
      if (el) el.focus();
    }, 100);
  }

  function confirmTransaction(type) {
    var amount = parseInt(document.getElementById('modalAmount').value);
    var category = document.getElementById('modalCategory').value;
    var desc = document.getElementById('modalDesc').value.trim();
    var goalId = document.getElementById('modalGoal')?.value || '';

    if (!amount || amount <= 0) {
      showToast('Nominal harus lebih dari 0', 'error');
      return;
    }

    var tx = {
      id: generateId(),
      type: type,
      amount: amount,
      category: category,
      desc: desc || (type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Tabungan'),
      date: getCurrentDateTime(),
      goalId: type === 'saving' ? goalId : ''
    };

    appData.transactions.push(tx);

    if (type === 'saving' && goalId) {
      var goal = appData.goals.find(function(g) { return g.id === goalId; });
      if (goal) goal.saved += amount;
    }

    saveData(appData);
    closeModal('transactionModal');

    transactionToUndo = tx;
    showToast(
      (type === 'income' ? '➕' : type === 'expense' ? '➖' : '💰') + ' Transaksi berhasil: ' + formatCurrency(amount),
      'success',
      function() { undoTransaction(); }
    );

    renderCurrentPage();
  }

  function undoTransaction() {
    if (!transactionToUndo) return;
    var tx = transactionToUndo;
    var idx = appData.transactions.findIndex(function(t) { return t.id === tx.id; });

    if (idx !== -1) {
      appData.transactions.splice(idx, 1);

      if (tx.type === 'saving' && tx.goalId) {
        var goal = appData.goals.find(function(g) { return g.id === tx.goalId; });
        if (goal) goal.saved -= tx.amount;
      }

      saveData(appData);
      transactionToUndo = null;
      showToast('Transaksi dibatalkan', 'warning');
      renderCurrentPage();
    }
  }

  // ============================================================
  // 8. GOAL FUNCTIONS
  // ============================================================

  function openGoalModal(goalId) {
    var isEdit = !!goalId;
    var goal = isEdit ? appData.goals.find(function(g) { return g.id === goalId; }) : null;

    var modal = document.createElement('div');
    modal.className = 'popup-overlay active';
    modal.id = 'goalModal';
    modal.innerHTML =
      '<div class="popup-glass">' +
      '<button class="modal-close" onclick="closeModal(\'goalModal\')">✕</button>' +
      '<div class="popup-title">' + (isEdit ? '✏️ Edit Target' : '🎯 Target Baru') + '</div>' +
      '<input type="text" id="goalName" placeholder="Nama Target" value="' + (goal ? sanitize(goal.name) : '') +
      '" maxlength="50" />' +
      '<input type="number" id="goalTarget" placeholder="Target Nominal" value="' + (goal ? goal.target : '') +
      '" min="1" step="1" />' +
      '<input type="date" id="goalDeadline" value="' + (goal ? goal.deadline || '' : '') + '" />' +
      '<input type="text" id="goalNote" placeholder="Catatan (opsional)" value="' + (goal ? sanitize(goal.note) :
        '') + '" maxlength="100" />' +
      '<div style="margin:8px 0 12px;text-align:left;">' +
      '<label style="color:#88a0b8;font-size:0.85rem;display:block;margin-bottom:6px;">Warna Target</label>' +
      '<div class="color-options">' +
      ['#00e5ff', '#7c4dff', '#00ff88', '#ff6b6b', '#ffd93d', '#6bcbff', '#ff8a5c', '#a8e6cf'].map(function(c) {
        return '<button class="color-opt' + (goal && goal.color === c ? ' active' : '') +
          '" data-color="' + c + '" style="background:' + c + ';" onclick="selectColor(this)"></button>';
      }).join('') +
      '</div>' +
      '</div>' +
      '<button class="neon-btn full" onclick="confirmGoal(\'' + (goalId || '') + '\')">' + (isEdit ?
        'Update Target' : 'Simpan Target') + '</button>' +
      '<button class="neon-btn small" style="margin-top:8px;width:100%;" onclick="closeModal(\'goalModal\')">Batal</button>' +
      '</div>';

    document.body.appendChild(modal);
    setTimeout(function() {
      var el = document.getElementById('goalName');
      if (el) el.focus();
    }, 100);
  }

  function selectColor(el) {
    document.querySelectorAll('.color-opt').forEach(function(b) {
      b.classList.remove('active');
    });
    el.classList.add('active');
    selectedColor = el.dataset.color;
  }

  function confirmGoal(goalId) {
    var name = document.getElementById('goalName').value.trim();
    var target = parseInt(document.getElementById('goalTarget').value);
    var deadline = document.getElementById('goalDeadline').value;
    var note = document.getElementById('goalNote').value.trim();

    if (!name) {
      showToast('Masukkan nama target', 'error');
      return;
    }
    if (!target || target <= 0) {
      showToast('Target nominal harus lebih dari 0', 'error');
      return;
    }

    if (goalId) {
      var goal = appData.goals.find(function(g) { return g.id === goalId; });
      if (goal) {
        goal.name = name;
        goal.target = target;
        goal.deadline = deadline;
        goal.note = note;
        goal.color = selectedColor;
        goal.updatedAt = getCurrentDateTime();
        showToast('✅ Target diupdate', 'success');
      }
    } else {
      appData.goals.push({
        id: generateId(),
        name: name,
        target: target,
        saved: 0,
        deadline: deadline,
        note: note,
        color: selectedColor,
        icon: '🎯',
        createdAt: getCurrentDateTime(),
        updatedAt: getCurrentDateTime()
      });
      showToast('🎯 Target dibuat!', 'success');
    }

    saveData(appData);
    closeModal('goalModal');
    renderCurrentPage();
  }

  function deleteGoal(goalId) {
    if (!confirm('Yakin ingin menghapus target ini?')) return;
    appData.goals = appData.goals.filter(function(g) { return g.id !== goalId; });
    saveData(appData);
    showToast('🗑️ Target dihapus', 'warning');
    renderCurrentPage();
  }

  function openGoalAddModal(goalId) {
    var goal = appData.goals.find(function(g) { return g.id === goalId; });
    if (!goal) return;

    var modal = document.createElement('div');
    modal.className = 'popup-overlay active';
    modal.id = 'goalAddModal';
    modal.innerHTML =
      '<div class="popup-glass">' +
      '<button class="modal-close" onclick="closeModal(\'goalAddModal\')">✕</button>' +
      '<div class="popup-title">💰 Tambah Tabungan</div>' +
      '<p style="color:#b0c4de;margin-bottom:12px;font-weight:600;">Target: ' + (goal.icon || '🎯') + ' ' +
      sanitize(goal.name) + '</p>' +
      '<input type="number" id="goalAddAmount" placeholder="Nominal tambahan" min="1" step="1" />' +
      '<input type="text" id="goalAddNote" placeholder="Catatan (opsional)" maxlength="100" />' +
      '<button class="neon-btn full" onclick="confirmGoalAdd(\'' + goalId + '\')">Tambahkan</button>' +
      '<button class="neon-btn small" style="margin-top:8px;width:100%;" onclick="closeModal(\'goalAddModal\')">Batal</button>' +
      '</div>';

    document.body.appendChild(modal);
    setTimeout(function() {
      var el = document.getElementById('goalAddAmount');
      if (el) el.focus();
    }, 100);
  }

  function confirmGoalAdd(goalId) {
    var amount = parseInt(document.getElementById('goalAddAmount').value);
    var note = document.getElementById('goalAddNote').value.trim();

    if (!amount || amount <= 0) {
      showToast('Nominal harus lebih dari 0', 'error');
      return;
    }

    var goal = appData.goals.find(function(g) { return g.id === goalId; });
    if (!goal) {
      showToast('Target tidak ditemukan', 'error');
      return;
    }

    goal.saved += amount;
    goal.updatedAt = getCurrentDateTime();

    appData.transactions.push({
      id: generateId(),
      type: 'saving',
      amount: amount,
      category: 'savings',
      desc: note || 'Tabungan ' + goal.name,
      date: getCurrentDateTime(),
      goalId: goal.id
    });

    saveData(appData);
    closeModal('goalAddModal');
    showToast('💰 ' + formatCurrency(amount) + ' ditambahkan ke ' + goal.name, 'success');
    renderCurrentPage();
  }

  // ============================================================
  // 9. RENDER FUNCTIONS
  // ============================================================

  function renderDashboard() {
    var data = appData;
    var txs = data.transactions || [];
    var goals = data.goals || [];
    var totalInc = getTotalIncome(txs);
    var totalExp = getTotalExpense(txs);
    var totalSav = getTotalSaving(txs);
    var balance = getTotalBalance(txs);
    var goalSavings = getTotalGoalSavings(goals);
    var recentTxs = txs.slice().sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    }).slice(0, 5);
    var activeGoals = getActiveGoals(goals).slice(0, 3);

    var html = '';

    // Balance Card
    html += '<div class="balance-card">';
    html += '<div class="balance-label">TOTAL SALDO</div>';
    html += '<div class="balance-amount">' + formatCurrency(balance) + '</div>';
    html += '<div class="balance-stats">';
    html += '<div class="balance-stat"><div class="stat-label">Pemasukan</div><div class="stat-value income">' +
      formatCurrency(totalInc) + '</div></div>';
    html += '<div class="balance-stat"><div class="stat-label">Pengeluaran</div><div class="stat-value expense">' +
      formatCurrency(totalExp) + '</div></div>';
    html += '<div class="balance-stat"><div class="stat-label">Tabungan</div><div class="stat-value savings">' +
      formatCurrency(totalSav + goalSavings) + '</div></div>';
    html += '</div>';
    html += '<div class="balance-actions">';
    html += '<button class="neon-btn primary" onclick="openTransactionModal(\'income\')">+ Tambah Uang</button>';
    html += '<button class="neon-btn danger" onclick="openTransactionModal(\'expense\')">− Ambil Uang</button>';
    html += '<button class="neon-btn" onclick="openTransactionModal(\'saving\')">💰 Menabung</button>';
    html += '</div>';
    html += '</div>';

    // Quick Stats
    html += '<div class="quick-stats">';
    html += '<div class="quick-stat glass"><div class="stat-number">' + txs.length +
      '</div><div class="stat-label">Transaksi</div></div>';
    html += '<div class="quick-stat glass"><div class="stat-number">' + goals.length +
      '</div><div class="stat-label">Target</div></div>';
    html += '<div class="quick-stat glass"><div class="stat-number">' + getCompletedGoals(goals).length +
      '</div><div class="stat-label">Tercapai</div></div>';
    html += '<div class="quick-stat glass"><div class="stat-number">' + getActiveGoals(goals).length +
      '</div><div class="stat-label">Aktif</div></div>';
    html += '</div>';

    // Goals Section
    html += '<div class="glass">';
    html += '<div class="section-header"><div class="section-title">🎯 Target Tabungan</div>' +
      '<button class="section-link" onclick="showGoals()">Lihat Semua →</button></div>';

    if (activeGoals.length > 0) {
      activeGoals.forEach(function(g) {
        var progress = calculateProgress(g);
        var isCompleted = g.saved >= g.target;
        html += '<div class="goal-item" onclick="showGoals()" style="border-color:' + (g.color ||
          '#00e5ff') + ';">';
        html += '<div class="goal-header"><span class="goal-name">' + (g.icon || '🎯') + ' ' + sanitize(g
          .name) + '</span><span class="goal-amount">' + formatCurrency(g.saved) + ' / ' + formatCurrency(
          g.target) + '</span></div>';
        html += '<div class="goal-progress"><div class="goal-fill" style="width:' + progress +
          '%;background:' + (g.color || '#00e5ff') + ';"></div></div>';
        html += '<div class="goal-footer"><span>' + Math.round(progress) +
          '%</span><span class="goal-status ' + (isCompleted ? 'completed' : '') + '">' + (isCompleted ?
            '✅ Tercapai' : 'Sisa ' + formatCurrency(g.target - g.saved)) + '</span></div>';
        html += '</div>';
      });
    } else {
      html += '<div class="empty-state"><div class="empty-icon">🎯</div>' +
        '<div class="empty-title">Belum ada target tabungan</div>' +
        '<div class="empty-desc">Mulai buat target pertamamu dan pantau progresnya.</div>' +
        '<button class="neon-btn primary" onclick="openGoalModal()">+ Buat Target</button></div>';
    }
    html += '</div>';

    // Recent Transactions
    html += '<div class="glass">';
    html += '<div class="section-header"><div class="section-title">📊 Transaksi Terbaru</div>' +
      '<button class="section-link" onclick="showTransactions()">Lihat Semua →</button></div>';

    if (recentTxs.length > 0) {
      recentTxs.forEach(function(t) {
        var isIncome = t.type === 'income';
        var isExpense = t.type === 'expense';
        var isSaving = t.type === 'saving';
        var icon = getCategoryIcon(t.category);
        var catName = getCategoryName(t.category);
        var cls = isIncome ? 'income' : (isExpense ? 'expense' : 'saving');
        var sign = isIncome ? '+' : (isExpense ? '-' : '');
        html += '<div class="transaction-item">';
        html += '<span class="tx-icon">' + icon + '</span>';
        html += '<div class="tx-info"><div class="tx-title">' + sanitize(t.desc || catName) +
          '</div><div class="tx-meta">' + formatDate(t.date) + ' · ' + catName + '</div></div>';
        html += '<div class="tx-amount ' + cls + '">' + sign + ' ' + formatCurrency(t.amount) +
          '</div>';
        html += '</div>';
      });
    } else {
      html += '<div class="empty-state"><div class="empty-icon">📊</div>' +
        '<div class="empty-title">Belum ada transaksi</div>' +
        '<div class="empty-desc">Catat pemasukan atau pengeluaran pertamamu.</div>' +
        '<button class="neon-btn primary" onclick="openTransactionModal(\'income\')">+ Tambah Transaksi</button></div>';
    }
    html += '</div>';

    mainContent.innerHTML = html;
  }

  function showGoals() {
    currentPage = 'goals';
    var data = appData;
    var goals = data.goals || [];

    var html = '';
    html += '<div class="glass" style="margin-bottom:16px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">';
    html += '<div class="section-title" style="font-size:1.2rem;">🎯 Target Tabungan</div>';
    html += '<button class="neon-btn primary small" onclick="openGoalModal()">+ Buat Target</button>';
    html += '</div>';
    html += '</div>';

    if (goals.length === 0) {
      html += '<div class="glass empty-state"><div class="empty-icon">🎯</div>' +
        '<div class="empty-title">Belum ada target tabungan</div>' +
        '<div class="empty-desc">Mulai buat target pertamamu dan pantau progresnya.</div>' +
        '<button class="neon-btn primary" onclick="openGoalModal()">+ Buat Target</button></div>';
    } else {
      html += '<div class="goals-grid">';
      goals.forEach(function(g) {
        var progress = calculateProgress(g);
        var isCompleted = g.saved >= g.target;
        var remaining = Math.max(0, g.target - g.saved);
        html += '<div class="goal-card ' + (isCompleted ? 'completed' : '') +
          '" style="border-color:' + (isCompleted ? 'rgba(0,255,136,0.2)' : (g.color || '#00e5ff') +
          '44') + ';">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
        html += '<div><div style="font-size:1.5rem;">' + (g.icon || '🎯') +
          '</div><div class="goal-card-name">' + sanitize(g.name) + '</div></div>';
        html += '<span style="font-size:0.7rem;color:#88a0b8;">' + (isCompleted ? '✅ Selesai' :
          '🔄 Aktif') + '</span>';
        html += '</div>';
        html += '<div class="goal-card-amount">' + formatCurrency(g.saved) + ' / ' + formatCurrency(g
          .target) + '</div>';
        html += '<div class="goal-card-progress"><div class="goal-fill" style="width:' + progress +
          '%;background:' + (g.color || '#00e5ff') + ';"></div></div>';
        html += '<div class="goal-card-footer">';
        html += '<span>' + Math.round(progress) + '%</span>';
        if (g.deadline) {
          var days = Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24));
          html += '<span>' + (days > 0 ? days + ' hari lagi' : 'Lewat deadline') + '</span>';
        } else {
          html += '<span>Tanpa deadline</span>';
        }
        if (!isCompleted) html += '<span>Sisa ' + formatCurrency(remaining) + '</span>';
        html += '</div>';
        if (g.note) html += '<div style="font-size:0.7rem;color:#88a0b8;margin-top:6px;">📝 ' +
          sanitize(g.note) + '</div>';
        html += '<div class="goal-card-actions">';
        html += '<button class="neon-btn primary small" onclick="openGoalAddModal(\'' + g.id +
          '\')">💰 Tambah</button>';
        html += '<button class="neon-btn small" onclick="openGoalModal(\'' + g.id +
          '\')">✏️ Edit</button>';
        html += '<button class="neon-btn danger small" onclick="deleteGoal(\'' + g.id +
          '\')">🗑️</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    mainContent.innerHTML = html;
  }

  function showTransactions() {
    currentPage = 'transactions';
    var data = appData;
    var txs = data.transactions || [];
    var sorted = txs.slice().sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var html = '';
    html += '<div class="glass" style="margin-bottom:16px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">';
    html += '<div class="section-title" style="font-size:1.2rem;">📊 Riwayat Transaksi</div>';
    html += '<button class="neon-btn primary small" onclick="openTransactionModal(\'income\')">+ Tambah</button>';
    html += '</div>';
    html += '<div style="margin-top:12px;">';
    html +=
      '<input type="text" id="txSearch" placeholder="Cari transaksi..." oninput="filterTransactions()" style="width:100%;padding:10px 16px;border-radius:40px;background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,255,0.15);color:inherit;outline:none;font-family:Rajdhani,sans-serif;font-size:0.9rem;" />';
    html += '</div>';
    html += '</div>';

    if (sorted.length === 0) {
      html += '<div class="glass empty-state"><div class="empty-icon">📊</div>' +
        '<div class="empty-title">Belum ada transaksi</div>' +
        '<div class="empty-desc">Catat pemasukan atau pengeluaran pertamamu.</div>' +
        '<button class="neon-btn primary" onclick="openTransactionModal(\'income\')">+ Tambah Transaksi</button></div>';
    } else {
      html += '<div id="txList">';
      sorted.forEach(function(t) {
        var isIncome = t.type === 'income';
        var isExpense = t.type === 'expense';
        var isSaving = t.type === 'saving';
        var icon = getCategoryIcon(t.category);
        var catName = getCategoryName(t.category);
        var cls = isIncome ? 'income' : (isExpense ? 'expense' : 'saving');
        var sign = isIncome ? '+' : (isExpense ? '-' : '');
        html += '<div class="transaction-item" style="padding:12px 16px;">';
        html += '<span class="tx-icon">' + icon + '</span>';
        html += '<div class="tx-info"><div class="tx-title">' + sanitize(t.desc || catName) +
          '</div><div class="tx-meta">' + catName + ' · ' + formatDateTime(t.date) + '</div></div>';
        html += '<div class="tx-amount ' + cls + '">' + sign + ' ' + formatCurrency(t.amount) +
          '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    mainContent.innerHTML = html;
  }

  function filterTransactions() {
    var query = document.getElementById('txSearch')?.value?.toLowerCase() || '';
    var items = document.querySelectorAll('#txList .transaction-item');
    items.forEach(function(item) {
      var text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? 'flex' : 'none';
    });
  }

  function renderCurrentPage() {
    switch (currentPage) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'goals':
        showGoals();
        break;
      case 'transactions':
        showTransactions();
        break;
      default:
        renderDashboard();
    }
  }

  // ============================================================
  // 10. SETTINGS FUNCTIONS
  // ============================================================

  function openSettings() {
    var modal = document.createElement('div');
    modal.className = 'popup-overlay active';
    modal.id = 'settingsModal';
    modal.innerHTML =
      '<div class="popup-glass" style="text-align:left;">' +
      '<button class="modal-close" onclick="closeModal(\'settingsModal\')">✕</button>' +
      '<div class="popup-title" style="text-align:center;">⚙️ Pengaturan</div>' +
      '<div style="margin:16px 0;">' +
      '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tampilan</h4>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button class="neon-btn small" onclick="setTheme(\'dark\')">🌙 Dark</button>' +
      '<button class="neon-btn small" onclick="setTheme(\'light\')">☀️ Light</button>' +
      '<button class="neon-btn small" onclick="setTheme(\'system\')">🖥️ System</button>' +
      '</div>' +
      '</div>' +
      '<div style="margin:16px 0;">' +
      '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Data</h4>' +
      '<button class="neon-btn small" onclick="downloadBackup()" style="width:100%;margin-bottom:8px;">📥 Download Backup</button>' +
      '<button class="neon-btn small" onclick="document.getElementById(\'restoreInput\').click()" style="width:100%;margin-bottom:8px;">📤 Restore Backup</button>' +
      '<input type="file" id="restoreInput" accept=".json" style="display:none" onchange="restoreBackup(this)" />' +
      '<button class="neon-btn danger small" onclick="openResetModal()" style="width:100%;">🗑️ Reset Semua Data</button>' +
      '</div>' +
      '<div style="margin:16px 0;">' +
      '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tentang</h4>' +
      '<p style="color:#e0f0ff;font-weight:600;">NEONVAULT v2.0.0</p>' +
      '<p style="color:#88a0b8;font-size:0.85rem;">Personal Savings Manager</p>' +
      '<p style="color:#88a0b8;font-size:0.75rem;margin-top:4px;">🔒 Data tersimpan secara lokal</p>' +
      '<p style="color:#88a0b8;font-size:0.7rem;margin-top:2px;">⚠️ Hapus data browser dapat menghapus data tabungan</p>' +
      '</div>' +
      '<button class="neon-btn small" style="width:100%;margin-top:8px;" onclick="closeModal(\'settingsModal\')">Tutup</button>' +
      '</div>';

    document.body.appendChild(modal);
  }

  function setTheme(theme) {
    appData.settings.theme = theme;
    saveData(appData);
    applyTheme(theme);
    showToast('Tema: ' + theme, 'success');
    closeModal('settingsModal');
  }

  function applyTheme(theme) {
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia(
    '(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('light-mode', !isDark);
  }

  function downloadBackup() {
    try {
      var data = exportData();
      if (!data) {
        showToast('Gagal membuat backup', 'error');
        return;
      }
      var blob = new Blob([data], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'neonvault_backup_' + getToday() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('📥 Backup berhasil', 'success');
    } catch (e) {
      showToast('Gagal backup', 'error');
    }
  }

  function restoreBackup(input) {
    var file = input.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var success = importData(e.target.result);
        if (success) {
          appData = loadData();
          renderCurrentPage();
          showToast('📤 Backup berhasil dipulihkan', 'success');
        } else {
          showToast('Format backup tidak valid', 'error');
        }
      } catch (err) {
        showToast('Gagal restore', 'error');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  function openResetModal() {
    var modal = document.createElement('div');
    modal.className = 'popup-overlay active';
    modal.id = 'resetModal';
    modal.innerHTML =
      '<div class="popup-glass">' +
      '<button class="modal-close" onclick="closeModal(\'resetModal\')">✕</button>' +
      '<div class="popup-title">⚠️ RESET NEONVAULT</div>' +
      '<p style="color:#ff6b6b;font-weight:500;margin:8px 0;">Semua transaksi, saldo dan target akan dihapus.</p>' +
      '<p style="margin:12px 0 8px;color:#b0c4de;">Ketik <strong>HAPUS</strong> untuk konfirmasi:</p>' +
      '<input type="text" id="resetConfirm" placeholder="Ketik HAPUS" maxlength="10" style="text-transform:uppercase;" oninput="document.getElementById(\'resetBtn\').disabled = this.value !== \'HAPUS\'" />' +
      '<button id="resetBtn" class="neon-btn danger full" disabled onclick="confirmReset()">Hapus Semua Data</button>' +
      '<button class="neon-btn small" style="margin-top:8px;width:100%;" onclick="closeModal(\'resetModal\')">Batal</button>' +
      '</div>';

    document.body.appendChild(modal);
    setTimeout(function() {
      var el = document.getElementById('resetConfirm');
      if (el) el.focus();
    }, 100);
  }

  function confirmReset() {
    // Create backup before reset
    downloadBackup();

    var newData = resetAllData();
    if (newData) {
      appData = newData;
      renderCurrentPage();
      closeModal('resetModal');
      showToast('🗑️ Semua data telah direset', 'warning');
    } else {
      showToast('Gagal reset data', 'error');
    }
  }

  function updateClock() {
    try {
      var now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch (e) {}
  }

  // ============================================================
  // 11. EXPOSE GLOBALLY
  // ============================================================

  window.openTransactionModal = openTransactionModal;
  window.confirmTransaction = confirmTransaction;
  window.undoTransaction = undoTransaction;
  window.openGoalModal = openGoalModal;
  window.confirmGoal = confirmGoal;
  window.deleteGoal = deleteGoal;
  window.openGoalAddModal = openGoalAddModal;
  window.confirmGoalAdd = confirmGoalAdd;
  window.closeModal = closeModal;
  window.showToast = showToast;
  window.showGoals = showGoals;
  window.showTransactions = showTransactions;
  window.filterTransactions = filterTransactions;
  window.selectColor = selectColor;
  window.setTheme = setTheme;
  window.downloadBackup = downloadBackup;
  window.restoreBackup = restoreBackup;
  window.openResetModal = openResetModal;
  window.confirmReset = confirmReset;
  window.openSettings = openSettings;

  // ============================================================
  // 12. INITIALIZATION
  // ============================================================

  function init() {
    try {
      // Load data
      appData = loadData();

      // Apply theme
      applyTheme(appData.settings.theme || 'dark');

      // Check onboarding
      if (!appData.settings.onboardingComplete) {
        onboarding.classList.add('active');
        loadingScreen.classList.add('hidden');
      } else if (!appData.settings.userName) {
        onboarding.classList.remove('active');
        namePopup.classList.add('active');
        loadingScreen.classList.add('hidden');
        setTimeout(function() {
          if (nameInput) nameInput.focus();
        }, 100);
      } else {
        onboarding.classList.remove('active');
        namePopup.classList.remove('active');
        dashboard.classList.add('active');
        loadingScreen.classList.add('hidden');
        renderDashboard();
      }

      // Onboarding start
      onboardingStart.addEventListener('click', function() {
        appData.settings.onboardingComplete = true;
        saveData(appData);
        onboarding.classList.remove('active');
        namePopup.classList.add('active');
        setTimeout(function() {
          if (nameInput) nameInput.focus();
        }, 100);
      });

      // Name popup start
      startBtn.addEventListener('click', function() {
        var name = nameInput.value.trim();
        if (!name) {
          showToast('Masukkan nama terlebih dahulu', 'error');
          nameInput.focus();
          return;
        }
        appData.settings.userName = name;
        saveData(appData);
        namePopup.classList.remove('active');
        dashboard.classList.add('active');
        renderDashboard();
        showToast('Selamat datang, ' + name + '! ✦', 'success');
      });

      nameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          startBtn.click();
        }
      });

      // Settings toggle
      settingsToggle.addEventListener('click', openSettings);

      // Clock
      updateClock();
      setInterval(updateClock, 1000);

      console.log('🚀 NEONVAULT V2 initialized successfully!');

    } catch (e) {
      console.error('Init error:', e);
      loadingScreen.classList.add('hidden');
      onboarding.classList.add('active');
    }
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();