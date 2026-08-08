/**
 * ============================================================
 * app.js – NEONVAULT V2 - Complete
 * Version: 2.0.4
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

  function validateAmount(value) {
    var num = parseInt(value);
    return !isNaN(num) && num > 0 && num < 999999999;
  }

  function validateName(text) {
    return text && text.trim().length > 0 && text.trim().length <= 50;
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

  function getTransactionsByDate(txs, days) {
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return txs.filter(function(t) { return new Date(t.date) >= cutoff; });
  }

  function getSavingRate(txs, days) {
    var recent = getTransactionsByDate(txs, days || 30);
    var income = recent.filter(function(t) { return t.type === 'income'; })
      .reduce(function(s, t) { return s + t.amount; }, 0);
    var expense = recent.filter(function(t) { return t.type === 'expense'; })
      .reduce(function(s, t) { return s + t.amount; }, 0);
    var saving = recent.filter(function(t) { return t.type === 'saving'; })
      .reduce(function(s, t) { return s + t.amount; }, 0);
    if (income === 0) return 0;
    return ((income - expense - saving) / income) * 100;
  }

  function getDailyAverage(txs, days) {
    var recent = getTransactionsByDate(txs, days || 30);
    var total = recent.reduce(function(sum, t) {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense') return sum - t.amount;
      return sum;
    }, 0);
    return days > 0 ? total / days : 0;
  }

  function getMonthlyTrend(txs, months) {
    months = months || 6;
    var trends = [];
    var now = new Date();
    for (var i = months - 1; i >= 0; i--) {
      var month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      var monthTxs = txs.filter(function(t) {
        var d = new Date(t.date);
        return d >= month && d < nextMonth;
      });
      var income = monthTxs.filter(function(t) { return t.type === 'income'; })
        .reduce(function(s, t) { return s + t.amount; }, 0);
      var expense = monthTxs.filter(function(t) { return t.type === 'expense'; })
        .reduce(function(s, t) { return s + t.amount; }, 0);
      var saving = monthTxs.filter(function(t) { return t.type === 'saving'; })
        .reduce(function(s, t) { return s + t.amount; }, 0);
      trends.push({
        month: month.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        income: income,
        expense: expense,
        saving: saving,
        balance: income - expense - saving
      });
    }
    return trends;
  }

  function getCategoryBreakdown(txs, type) {
    type = type || 'expense';
    var breakdown = {};
    var filtered = txs.filter(function(t) { return t.type === type; });
    filtered.forEach(function(t) {
      if (!breakdown[t.category]) breakdown[t.category] = 0;
      breakdown[t.category] += t.amount;
    });
    var total = Object.values(breakdown).reduce(function(s, v) { return s + v; }, 0);
    return Object.keys(breakdown).map(function(cat) {
      return {
        category: cat,
        amount: breakdown[cat],
        percentage: total > 0 ? (breakdown[cat] / total) * 100 : 0,
        icon: getCategoryIcon(cat),
        name: getCategoryName(cat)
      };
    }).sort(function(a, b) { return b.amount - a.amount; });
  }

  function generateInsights(txs, goals) {
    var insights = [];
    var totalInc = getTotalIncome(txs);
    var totalExp = getTotalExpense(txs);
    if (totalInc > 0 && totalExp > 0) {
      var ratio = totalExp / totalInc;
      if (ratio > 0.7) {
        insights.push({
          type: 'warning',
          message: 'Pengeluaran mencapai ' + Math.round(ratio * 100) + '% dari pemasukan. Perhatikan anggaranmu.'
        });
      } else if (ratio < 0.3) {
        insights.push({
          type: 'positive',
          message: 'Kamu berhasil menabung ' + Math.round((1 - ratio) * 100) + '% dari pemasukan!'
        });
      }
    }
    var activeGoals = getActiveGoals(goals);
    if (activeGoals.length > 0) {
      var closest = activeGoals.reduce(function(a, b) {
        return calculateProgress(a) > calculateProgress(b) ? a : b;
      });
      if (closest && calculateProgress(closest) > 50) {
        insights.push({
          type: 'goal',
          message: '🎯 Kamu tinggal ' + formatCurrency(closest.target - closest.saved) +
            ' lagi untuk mencapai target "' + closest.name + '"'
        });
      }
    }
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        message: '📊 Mulai catat transaksimu untuk mendapatkan insight keuangan'
      });
    }
    return insights.slice(0, 4);
  }

  // ============================================================
  // 3. STORAGE MANAGEMENT with Migration
  // ============================================================

  var STORAGE_KEY = 'neonvault_data_v2';
  var NOTIFICATION_KEY = 'neonvault_notifications';

  function getDefaultData() {
    return {
      version: 2,
      settings: {
        theme: 'dark',
        currency: 'IDR',
        reminders: false,
        onboardingComplete: false,
        userName: ''
      },
      goals: [],
      transactions: []
    };
  }

  function migrateData(oldData) {
    console.log('Migrating data from v1 to v2...');
    var newData = getDefaultData();
    if (oldData.settings) {
      newData.settings.theme = oldData.settings.theme || 'dark';
      newData.settings.userName = oldData.settings.userName || '';
      newData.settings.onboardingComplete = oldData.settings.onboardingComplete || false;
      newData.settings.reminders = oldData.settings.reminders || false;
    }
    if (oldData.goals && Array.isArray(oldData.goals)) {
      newData.goals = oldData.goals.map(function(g) {
        return {
          id: g.id || generateId(),
          name: g.name || 'Target',
          icon: g.icon || '🎯',
          color: g.color || '#00e5ff',
          target: g.target || 0,
          saved: g.saved || 0,
          deadline: g.deadline || '',
          note: g.note || '',
          createdAt: g.createdAt || getCurrentDateTime(),
          updatedAt: getCurrentDateTime()
        };
      });
    }
    if (oldData.transactions && Array.isArray(oldData.transactions)) {
      newData.transactions = oldData.transactions.map(function(t) {
        return {
          id: t.id || generateId(),
          type: t.type || 'income',
          amount: t.amount || 0,
          category: t.category || 'other',
          desc: t.desc || t.description || '',
          date: t.date || t.createdAt || getCurrentDateTime(),
          goalId: t.goalId || ''
        };
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    console.log('Migration complete!');
    return newData;
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
      if (data.version !== 2) {
        data = migrateData(data);
      }
      if (!data.settings) data.settings = getDefaultData().settings;
      if (!data.goals) data.goals = [];
      if (!data.transactions) data.transactions = [];
      return data;
    } catch (e) {
      console.error('Load error:', e);
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
  // 4. RESET FUNCTION - FIXED
  // ============================================================

  function resetAllData() {
    try {
      // 1. Hapus semua data dari localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(NOTIFICATION_KEY);
      localStorage.removeItem('neonvault_last_reminder');
      
      // 2. Hapus semua backup terkait
      var keys = Object.keys(localStorage);
      keys.forEach(function(key) {
        if (key.startsWith('neonvault_data_v2_backup_')) {
          localStorage.removeItem(key);
        }
      });

      // 3. Reset state aplikasi di memory
      appData = getDefaultData();
      appData.settings.onboardingComplete = false;
      appData.settings.reminders = false;
      
      // 4. Reset navigation state
      currentPage = 'dashboard';
      currentGoalId = null;
      pageHistory = [];
      transactionToUndo = null;
      
      // 5. Reset notification state
      notificationEnabled = false;
      
      // 6. Reset browser history
      try {
        history.replaceState(
          { view: 'onboarding' },
          'NEONVAULT - Onboarding',
          window.location.pathname + window.location.search
        );
      } catch (e) {
        // Silent fail
      }

      // 7. Simpan default data ke localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

      // 8. Tampilkan onboarding - HIDE NAVBAR
      showOnboardingAfterReset();

      console.log('✅ Reset complete - All data cleared');
      return true;
    } catch (e) {
      console.error('Reset error:', e);
      return false;
    }
  }

  function showOnboardingAfterReset() {
    // Hide dashboard
    if (dashboard) {
      dashboard.classList.remove('active');
    }
    
    // Hide name popup
    if (namePopup) {
      namePopup.classList.remove('active');
    }
    
    // Show onboarding
    if (onboarding) {
      onboarding.classList.add('active');
    }
    
    // Hide loading
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
    
    // Reset current page
    currentPage = 'dashboard';
    
    // Clear main content
    if (mainContent) {
      mainContent.innerHTML = '';
    }
    
    // HIDE BOTTOM NAVIGATION
    if (bottomNav) {
      bottomNav.style.display = 'none';
    }
    
    // Update nav buttons
    updateNavButtons();
    
    showToast('🗑️ Semua data telah direset', 'warning');
  }

  // ============================================================
  // 5. APPLICATION STATE
  // ============================================================

  var appData = null;
  var currentPage = 'dashboard';
  var currentGoalId = null;
  var transactionToUndo = null;
  var selectedColor = '#00e5ff';
  var chartPeriod = 30;
  var reminderInterval = null;
  var pageHistory = [];
  var notificationEnabled = false;

  // ============================================================
  // 6. DOM REFS
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
  var bottomNav = document.getElementById('bottomNav');

  // ============================================================
  // 7. TOAST NOTIFICATION
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
  // 8. NAVIGATION SYSTEM
  // ============================================================

  function goBack() {
    if (pageHistory.length > 0) {
      var last = pageHistory.pop();
      currentPage = last.page;
      currentGoalId = last.params || null;
      try {
        history.back();
      } catch (e) {}
      renderCurrentPage();
      updateNavButtons();
    } else {
      navigateTo('dashboard');
    }
  }

  function navigateTo(page, params) {
    // Jangan navigasi jika onboarding aktif
    if (onboarding && onboarding.classList.contains('active')) {
      return;
    }
    // Jangan navigasi jika popup nama aktif
    if (namePopup && namePopup.classList.contains('active')) {
      return;
    }
    
    if (currentPage && currentPage !== page) {
      pageHistory.push({ page: currentPage, params: currentGoalId });
      if (pageHistory.length > 20) pageHistory.shift();
    }

    currentPage = page;
    if (params !== undefined) {
      currentGoalId = params;
    }

    try {
      var state = { page: page, goalId: currentGoalId };
      var url = '#' + page + (currentGoalId ? '/' + currentGoalId : '');
      history.pushState(state, '', url);
    } catch (e) {}

    renderCurrentPage();
    updateNavButtons();
  }

  function updateNavButtons() {
    document.querySelectorAll('.nav-item').forEach(function(item) {
      item.classList.toggle('active', item.dataset.page === currentPage);
    });
  }

  window.addEventListener('popstate', function(e) {
    if (e.state && e.state.page) {
      currentPage = e.state.page;
      currentGoalId = e.state.goalId || null;
      if (pageHistory.length > 0 && pageHistory[pageHistory.length - 1].page === currentPage) {
        pageHistory.pop();
      }
      renderCurrentPage();
      updateNavButtons();
    } else {
      currentPage = 'dashboard';
      currentGoalId = null;
      pageHistory = [];
      renderCurrentPage();
      updateNavButtons();
    }
  });
  // ============================================================
  // 9. MODAL FUNCTIONS
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
      '<select id="modalType" style="display:none;"><option value="' + type + '">' + type + '</option></select>' +
      '<input type="number" id="modalAmount" placeholder="Nominal" min="1" step="1" aria-label="Nominal" />' +
      '<select id="modalCategory" aria-label="Kategori">' +
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
      (type === 'saving' ? '<select id="modalGoal" aria-label="Target"><option value="">Pilih Target</option>' +
        appData.goals.filter(function(g) { return g.saved < g.target; }).map(function(g) {
          return '<option value="' + g.id + '">' + (g.icon || '🎯') + ' ' + sanitize(g.name) +
          '</option>';
        }).join('') + '</select>' : '') +
      '<input type="text" id="modalDesc" placeholder="Catatan (opsional)" maxlength="100" aria-label="Catatan" />' +
      '<div style="color:#88a0b8;margin-bottom:12px;font-size:0.85rem;">📅 ' + formatDateTime(
        getCurrentDateTime()) + '</div>' +
      '<button class="neon-btn full" onclick="confirmTransaction()">Simpan Transaksi</button>' +
      '<button class="neon-btn small" style="margin-top:8px;width:100%;" onclick="closeModal(\'transactionModal\')">Batal</button>' +
      '</div>';

    document.body.appendChild(modal);
    setTimeout(function() {
      var el = document.getElementById('modalAmount');
      if (el) el.focus();
    }, 100);
  }

  function confirmTransaction() {
    var amount = parseInt(document.getElementById('modalAmount').value);
    var category = document.getElementById('modalCategory').value;
    var desc = document.getElementById('modalDesc').value.trim();
    var goalId = document.getElementById('modalGoal')?.value || '';
    var type = document.getElementById('modalType').value;

    if (!validateAmount(amount)) {
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
  // 10. GOAL FUNCTIONS
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
      '" maxlength="50" aria-label="Nama Target" />' +
      '<input type="number" id="goalTarget" placeholder="Target Nominal" value="' + (goal ? goal.target : '') +
      '" min="1" step="1" aria-label="Target Nominal" />' +
      '<input type="date" id="goalDeadline" value="' + (goal ? goal.deadline || '' : '') +
      '" aria-label="Deadline" />' +
      '<input type="text" id="goalNote" placeholder="Catatan (opsional)" value="' + (goal ? sanitize(goal.note) :
        '') + '" maxlength="100" aria-label="Catatan" />' +
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

    if (!validateName(name)) {
      showToast('Masukkan nama target (1-50 karakter)', 'error');
      return;
    }
    if (!validateAmount(target)) {
      showToast('Target nominal harus lebih dari 0', 'error');
      return;
    }

    var goal;
    if (goalId) {
      goal = appData.goals.find(function(g) { return g.id === goalId; });
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
      goal = {
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
      };
      appData.goals.push(goal);
      showToast('🎯 Target dibuat!', 'success');
    }

    saveData(appData);
    closeModal('goalModal');

    if (goal) {
      navigateTo('goalDetail', goal.id);
    } else {
      navigateTo('goals');
    }
  }

  function deleteGoal(goalId) {
    if (!confirm('Yakin ingin menghapus target ini?')) return;
    appData.goals = appData.goals.filter(function(g) { return g.id !== goalId; });
    saveData(appData);
    showToast('🗑️ Target dihapus', 'warning');
    if (currentGoalId === goalId) {
      currentGoalId = null;
      navigateTo('goals');
    } else {
      renderCurrentPage();
    }
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
      '<input type="number" id="goalAddAmount" placeholder="Nominal tambahan" min="1" step="1" aria-label="Nominal" />' +
      '<input type="text" id="goalAddNote" placeholder="Catatan (opsional)" maxlength="100" aria-label="Catatan" />' +
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

    if (!validateAmount(amount)) {
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
  // 11. RENDER FUNCTIONS
  // ============================================================

  function renderBackButton() {
    return '<button class="back-button" onclick="window.goBack && window.goBack()">← Kembali</button>';
  }

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

    // Data Warning
    html += '<div class="data-warning">';
    html += '<span class="warning-icon">🔒</span>';
    html +=
      '<span>Data tersimpan secara lokal di perangkat ini. Jika browser atau data situs dihapus, data tabungan dapat ikut terhapus. <strong>Download backup</strong> secara rutin.</span>';
    html += '</div>';

    // Goals Section
    html += '<div class="glass">';
    html += '<div class="section-header"><div class="section-title">🎯 Target Tabungan</div>' +
      '<button class="section-link" onclick="navigateTo(\'goals\')">Lihat Semua →</button></div>';

    if (activeGoals.length > 0) {
      activeGoals.forEach(function(g) {
        var progress = calculateProgress(g);
        var isCompleted = g.saved >= g.target;
        html += '<div class="goal-item" onclick="navigateTo(\'goalDetail\', \'' + g.id + '\')" style="border-color:' + (g.color ||
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
      '<button class="section-link" onclick="navigateTo(\'transactions\')">Lihat Semua →</button></div>';

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
          '</div><div class="tx-meta">' + catName + ' · ' + formatDate(t.date) + '</div></div>';
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

  function renderGoalDetail() {
    var goal = appData.goals.find(function(g) { return g.id === currentGoalId; });
    if (!goal) {
      showToast('Target tidak ditemukan', 'error');
      navigateTo('goals');
      return;
    }

    var progress = calculateProgress(goal);
    var isCompleted = goal.saved >= goal.target;
    var remaining = Math.max(0, goal.target - goal.saved);
    var daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    var html = '';
    
    html += '<div style="margin-bottom:12px;">';
    html += renderBackButton();
    html += '</div>';

    html += '<div class="glass" style="border-color:' + (isCompleted ? 'rgba(0,255,136,0.3)' : (goal.color || '#00e5ff') + '44') + ';">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">';
    html += '<div><div style="font-size:2.5rem;">' + (goal.icon || '🎯') + '</div>';
    html += '<div style="font-size:1.4rem;font-weight:700;margin:4px 0;">' + sanitize(goal.name) + '</div>';
    html += '<div style="color:#88a0b8;font-size:1rem;">' + formatCurrency(goal.saved) + ' / ' + formatCurrency(goal.target) + '</div>';
    html += '</div>';
    html += '<span class="goal-status ' + (isCompleted ? 'completed' : '') + '" style="font-size:0.85rem;padding:4px 16px;">' + 
      (isCompleted ? '✅ Selesai' : '🔄 Aktif') + '</span>';
    html += '</div>';

    html += '<div class="goal-card-progress" style="height:10px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;margin:12px 0;">';
    html += '<div class="goal-fill" style="width:' + progress + '%;background:' + (goal.color || '#00e5ff') + ';height:100%;border-radius:4px;transition:width 0.6s ease;"></div>';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:12px 0;">';
    html += '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;text-align:center;">';
    html += '<div style="font-size:0.7rem;color:#88a0b8;">Progress</div>';
    html += '<div style="font-size:1.2rem;font-weight:700;color:' + (goal.color || '#00e5ff') + ';">' + Math.round(progress) + '%</div>';
    html += '</div>';
    
    if (!isCompleted) {
      html += '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;text-align:center;">';
      html += '<div style="font-size:0.7rem;color:#88a0b8;">Sisa</div>';
      html += '<div style="font-size:1.2rem;font-weight:700;color:#ffd93d;">' + formatCurrency(remaining) + '</div>';
      html += '</div>';
    }
    
    if (goal.deadline) {
      html += '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;text-align:center;">';
      html += '<div style="font-size:0.7rem;color:#88a0b8;">Deadline</div>';
      html += '<div style="font-size:1.1rem;font-weight:600;color:' + (daysLeft !== null && daysLeft < 0 ? '#ff4d6d' : '#6bcbff') + ';">' + 
        (daysLeft !== null ? (daysLeft > 0 ? daysLeft + ' hari lagi' : 'Lewat deadline') : 'Tanpa deadline') + '</div>';
      html += '</div>';
    }
    html += '</div>';

    if (goal.note) {
      html += '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;margin:8px 0;font-size:0.9rem;color:#b0c4de;">';
      html += '📝 ' + sanitize(goal.note);
      html += '</div>';
    }

    html += '<div class="goal-card-actions" style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">';
    html += '<button class="neon-btn primary" onclick="openGoalAddModal(\'' + goal.id + '\')" style="flex:1;min-width:100px;">💰 Tambah Tabungan</button>';
    html += '<button class="neon-btn" onclick="openGoalModal(\'' + goal.id + '\')" style="flex:1;min-width:80px;">✏️ Edit</button>';
    html += '<button class="neon-btn danger" onclick="deleteGoal(\'' + goal.id + '\')" style="flex:1;min-width:80px;">🗑️ Hapus</button>';
    html += '</div>';
    html += '</div>';

    var relatedTxs = appData.transactions.filter(function(t) { return t.goalId === goal.id; });
    if (relatedTxs.length > 0) {
      html += '<div class="glass" style="margin-top:16px;">';
      html += '<div style="font-weight:600;margin-bottom:12px;">📊 Riwayat Tabungan</div>';
      relatedTxs.sort(function(a, b) { return new Date(b.date) - new Date(a.date); }).forEach(function(t) {
        html += '<div class="transaction-item" style="padding:8px 12px;">';
        html += '<span class="tx-icon">💰</span>';
        html += '<div class="tx-info"><div class="tx-title">' + sanitize(t.desc || 'Tabungan') + '</div>';
        html += '<div class="tx-meta">' + formatDateTime(t.date) + '</div></div>';
        html += '<div class="tx-amount saving">+ ' + formatCurrency(t.amount) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    mainContent.innerHTML = html;
  }

  function renderGoals() {
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
          '44') + ';cursor:pointer;" onclick="navigateTo(\'goalDetail\', \'' + g.id + '\')">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
        html += '<div><div style="font-size:1.8rem;">' + (g.icon || '🎯') +
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
        html += '<div class="goal-card-actions" onclick="event.stopPropagation();">';
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

  function renderTransactions() {
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
      '<input type="text" id="txSearch" placeholder="Cari transaksi..." oninput="filterTransactions()" style="width:100%;padding:10px 16px;border-radius:40px;background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,255,0.15);color:inherit;outline:none;font-family:Rajdhani,sans-serif;font-size:0.9rem;" aria-label="Cari transaksi" />';
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
        var goalName = t.goalId ? (appData.goals.find(function(g) { return g.id === t.goalId; })?.name || '') :
        '';
        html += '<div class="transaction-item" style="padding:12px 16px;">';
        html += '<span class="tx-icon">' + icon + '</span>';
        html += '<div class="tx-info"><div class="tx-title">' + sanitize(t.desc || catName) +
          '</div><div class="tx-meta">' + catName + (goalName ? ' → ' + goalName : '') + ' · ' + formatDateTime(
          t.date) + '</div></div>';
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

  function renderAnalytics() {
    currentPage = 'analytics';
    var data = appData;
    var txs = data.transactions || [];
    var goals = data.goals || [];

    var totalInc = getTotalIncome(txs);
    var totalExp = getTotalExpense(txs);
    var totalSav = getTotalSaving(txs);
    var totalGoalSavings = getTotalGoalSavings(goals);
    var dailyAvg = getDailyAverage(txs, 30);
    var monthlyAvg = dailyAvg * 30;
    var insights = generateInsights(txs, goals);

    var months = Math.max(1, Math.round(chartPeriod / 30));
    var monthlyData = getMonthlyTrend(txs, Math.min(months, 12));
    var categoryData = getCategoryBreakdown(txs, 'expense');

    if (monthlyData.length === 0) {
      monthlyData = [{ month: 'Saat ini', income: 0, expense: 0, saving: 0, balance: 0 }];
    }

    var balanceData = monthlyData.map(function(d) {
      return { label: d.month, value: d.balance };
    });
    
    var incomeData = monthlyData.map(function(d) {
      return { label: d.month, value: d.income };
    });
    
    var expenseData = monthlyData.map(function(d) {
      return { label: d.month, value: d.expense };
    });
    
    var pieData = categoryData.map(function(d) {
      return { label: d.name, value: d.amount, color: d.percentage > 10 ? '#00e5ff' : '#7c4dff' };
    });

    if (pieData.length === 0) {
      pieData = [{ label: 'Belum ada data', value: 1, color: '#88a0b8' }];
    }

    var periodOptions = [
      { label: '7 Hari', days: 7 },
      { label: '30 Hari', days: 30 },
      { label: '90 Hari', days: 90 },
      { label: '365 Hari', days: 365 }
    ];

    var html = '';
    html += '<div class="page-container active">';
    html += '<div class="section-title" style="font-size:1.2rem;margin-bottom:16px;">📈 Financial Analytics</div>';

    html +=
      '<div class="analytics-insights" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px;">';
    html += '<div class="insight-card glass"><div class="insight-value">' + formatCurrency(totalSav +
      totalGoalSavings) + '</div><div class="insight-label">Total Tabungan</div></div>';
    html += '<div class="insight-card glass"><div class="insight-value">' + formatCurrency(monthlyAvg) +
      '</div><div class="insight-label">Rata-rata / Bulan</div></div>';
    html += '<div class="insight-card glass"><div class="insight-value">' + getActiveGoals(goals).length +
      '</div><div class="insight-label">Target Aktif</div></div>';
    html += '<div class="insight-card glass"><div class="insight-value">' + getCompletedGoals(goals).length +
      '</div><div class="insight-label">Target Tercapai</div></div>';
    html += '</div>';

    html += '<div class="glass" style="margin-bottom:16px;">';
    html +=
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
    html += '<span style="font-weight:600;">📊 Perkembangan Saldo</span>';
    html += '<div class="period-filters">';
    periodOptions.forEach(function(p) {
      html += '<button class="period-btn ' + (p.days === chartPeriod ? 'active' : '') +
        '" onclick="setChartPeriod(' + p.days + ')">' + p.label + '</button>';
    });
    html += '</div></div>';
    html += '<div class="analytics-chart" style="height:200px;width:100%;"><canvas id="balanceChart"></canvas></div>';
    html += '</div>';

    html += '<div class="analytics-grid" style="margin-bottom:16px;">';
    html += '<div class="glass full-width">';
    html += '<div style="font-weight:600;margin-bottom:8px;">📊 Pemasukan vs Pengeluaran</div>';
    html += '<div class="analytics-chart" style="height:160px;width:100%;"><canvas id="incomeExpenseChart"></canvas></div>';
    html += '</div></div>';

    html += '<div class="analytics-grid">';
    html += '<div class="glass"><div style="font-weight:600;margin-bottom:8px;">📊 Kategori Pengeluaran</div>';
    html += '<div class="analytics-chart" style="height:200px;width:100%;"><canvas id="categoryChart"></canvas></div></div>';
    html += '<div class="glass"><div style="font-weight:600;margin-bottom:8px;">💡 Insight Keuangan</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;">';
    
    if (insights.length === 0) {
      html += '<div style="padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:12px;color:#88a0b8;">';
      html += '📊 Mulai catat transaksimu untuk mendapatkan insight keuangan';
      html += '</div>';
    } else {
      insights.forEach(function(i) {
        html += '<div style="padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:12px;border-left:3px solid ' +
          (i.type === 'warning' ? '#ff4d6d' : i.type === 'positive' ? '#00ff88' : '#00e5ff') + ';">';
        html += '<span style="font-size:0.85rem;">' + i.message + '</span></div>';
      });
    }
    html += '</div></div></div>';
    html += '</div>';

    mainContent.innerHTML = html;

    setTimeout(function() {
      try {
        drawLineChart('balanceChart', balanceData);
        drawBarChart('incomeExpenseChart', incomeData, expenseData);
        drawDoughnutChart('categoryChart', pieData);
      } catch (e) {
        console.warn('Chart rendering error:', e);
      }
    }, 200);
  }

  function setChartPeriod(days) {
    chartPeriod = days;
    renderAnalytics();
  }
  // ============================================================
  // 12. CHART FUNCTIONS
  // ============================================================

  function drawLineChart(canvasId, data) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn('Canvas not found:', canvasId);
      return;
    }
    
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available:', canvasId);
      return;
    }

    var parent = canvas.parentElement;
    var parentWidth = parent ? parent.clientWidth : 400;
    var parentHeight = parent ? parent.clientHeight : 200;
    
    var W = Math.max(parentWidth, 200);
    var H = Math.max(parentHeight, 100);
    
    var dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    
    ctx.scale(dpr, dpr);

    var pad = { top: 20, right: 16, bottom: 28, left: 16 };
    var chartW = W - pad.left - pad.right;
    var chartH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    if (!data || data.length === 0 || data.every(function(d) { return d.value === 0; })) {
      ctx.fillStyle = '#88a0b8';
      ctx.font = '14px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Belum ada data', W / 2, H / 2);
      return;
    }

    var validData = data.filter(function(d) { return d.value !== undefined && d.value !== null; });
    if (validData.length === 0) {
      ctx.fillStyle = '#88a0b8';
      ctx.font = '14px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Belum ada data', W / 2, H / 2);
      return;
    }

    var values = validData.map(function(d) { return d.value; });
    var labels = validData.map(function(d) { return d.label || ''; });
    
    var maxVal = Math.max(1, Math.max.apply(null, values.map(Math.abs)));
    var minVal = Math.min(0, Math.min.apply(null, values));
    var range = maxVal - minVal || 1;

    var isDark = !document.body.classList.contains('light-mode');
    var colors = {
      line: isDark ? '#00e5ff' : '#7c4dff',
      fill: isDark ? 'rgba(0,229,255,0.08)' : 'rgba(124,77,255,0.08)',
      grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      text: isDark ? '#88a0b8' : '#6a6a8e',
      point: isDark ? '#00e5ff' : '#7c4dff'
    };

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (var g = 0; g <= 4; g++) {
      var y = pad.top + (chartH / 4) * g;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
    }

    if (values.length === 1) {
      var px = pad.left + chartW / 2;
      var py = pad.top + chartH - ((values[0] - minVal) / range) * chartH;
      
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fillStyle = colors.point;
      ctx.shadowColor = colors.point + '88';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = colors.text;
      ctx.font = '9px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText(labels[0] || '', px, H - 4);
      return;
    }

    ctx.beginPath();
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = colors.line + '66';
    ctx.shadowBlur = 12;
    
    for (var i = 0; i < values.length; i++) {
      var x = pad.left + (i / (values.length - 1)) * chartW;
      var y = pad.top + chartH - ((values[i] - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    var firstX = pad.left;
    var firstY = pad.top + chartH - ((values[0] - minVal) / range) * chartH;
    ctx.moveTo(firstX, pad.top + chartH);
    ctx.lineTo(firstX, firstY);
    for (var a = 0; a < values.length; a++) {
      var ax = pad.left + (a / (values.length - 1)) * chartW;
      var ay = pad.top + chartH - ((values[a] - minVal) / range) * chartH;
      ctx.lineTo(ax, ay);
    }
    var lastX = pad.left + chartW;
    ctx.lineTo(lastX, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = colors.fill;
    ctx.fill();

    for (var p = 0; p < values.length; p++) {
      var px = pad.left + (p / (values.length - 1)) * chartW;
      var py = pad.top + chartH - ((values[p] - minVal) / range) * chartH;

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = colors.point;
      ctx.shadowColor = colors.point + '88';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = colors.text;
      ctx.font = '8px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (labels[p]) {
        ctx.fillText(labels[p], px, H - 20);
      }
    }
  }

  function drawBarChart(canvasId, incomeData, expenseData) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn('Canvas not found:', canvasId);
      return;
    }
    
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available:', canvasId);
      return;
    }

    var parent = canvas.parentElement;
    var parentWidth = parent ? parent.clientWidth : 400;
    var parentHeight = parent ? parent.clientHeight : 150;
    
    var W = Math.max(parentWidth, 200);
    var H = Math.max(parentHeight, 100);
    
    var dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    
    ctx.scale(dpr, dpr);

    var pad = { top: 20, right: 16, bottom: 28, left: 16 };
    var chartW = W - pad.left - pad.right;
    var chartH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    if (!incomeData || incomeData.length === 0) {
      ctx.fillStyle = '#88a0b8';
      ctx.font = '14px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Belum ada data', W / 2, H / 2);
      return;
    }

    var validIncome = incomeData.filter(function(d) { return d.value !== undefined && d.value !== null; });
    if (validIncome.length === 0) {
      ctx.fillStyle = '#88a0b8';
      ctx.font = '14px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Belum ada data', W / 2, H / 2);
      return;
    }

    var allValues = validIncome.map(function(d) { return Math.abs(d.value) || 0; });
    if (expenseData && expenseData.length > 0) {
      var validExpense = expenseData.filter(function(d) { return d.value !== undefined && d.value !== null; });
      allValues = allValues.concat(validExpense.map(function(d) { return Math.abs(d.value) || 0; }));
    }
    var maxVal = Math.max(1, Math.max.apply(null, allValues));

    var isDark = !document.body.classList.contains('light-mode');
    var colors = {
      income: isDark ? '#00ff88' : '#00a86b',
      expense: isDark ? '#ff4d6d' : '#e74c3c',
      grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      text: isDark ? '#88a0b8' : '#6a6a8e'
    };

    var barCount = validIncome.length;
    var barWidth = Math.min(25, (chartW / barCount) * 0.3);
    var gap = (chartW - barWidth * 2 * barCount) / (barCount + 1);

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (var g = 0; g <= 4; g++) {
      var y = pad.top + (chartH / 4) * g;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
    }

    validIncome.forEach(function(d, i) {
      var x1 = pad.left + gap + i * (barWidth * 2 + gap);
      var value1 = Math.abs(d.value) || 0;
      var h1 = (value1 / maxVal) * chartH;
      var y1 = pad.top + chartH - h1;

      ctx.fillStyle = colors.income;
      ctx.shadowColor = colors.income + '44';
      ctx.shadowBlur = 8;
      ctx.fillRect(x1, y1, barWidth, h1);
      ctx.shadowBlur = 0;

      var x2 = x1 + barWidth;
      var value2 = (expenseData && expenseData[i]) ? Math.abs(expenseData[i].value) || 0 : 0;
      var h2 = (value2 / maxVal) * chartH;
      var y2 = pad.top + chartH - h2;

      ctx.fillStyle = colors.expense;
      ctx.shadowColor = colors.expense + '44';
      ctx.shadowBlur = 8;
      ctx.fillRect(x2, y2, barWidth, h2);
      ctx.shadowBlur = 0;

      ctx.fillStyle = colors.text;
      ctx.font = '7px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (d.label) {
        ctx.fillText(d.label, x1 + barWidth, H - 20);
      }
    });
  }

  function drawDoughnutChart(canvasId, data) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn('Canvas not found:', canvasId);
      return;
    }
    
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available:', canvasId);
      return;
    }

    var parent = canvas.parentElement;
    var parentWidth = parent ? parent.clientWidth : 200;
    var size = Math.min(Math.max(parentWidth, 150), 200);
    var W = size;
    var H = size;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    if (!data || data.length === 0) {
      ctx.fillStyle = '#88a0b8';
      ctx.font = '14px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Belum ada data', W / 2, H / 2);
      return;
    }

    var validData = data.filter(function(d) { return d.value > 0; });
    if (validData.length === 0) {
      ctx.fillStyle = '#88a0b8';
      ctx.font = '14px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tidak ada data', W / 2, H / 2);
      return;
    }

    var total = validData.reduce(function(s, d) { return s + d.value; }, 0);
    if (total === 0) {
      ctx.fillStyle = '#88a0b8';
      ctx.font = '14px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tidak ada data', W / 2, H / 2);
      return;
    }

    var colors = ['#00e5ff', '#7c4dff', '#00ff88', '#ff6b6b', '#ffd93d', '#6bcbff', '#ff8a5c', '#a8e6cf', '#ff6b9d', '#4ecdc4'];
    var cx = W / 2;
    var cy = H / 2;
    var radius = Math.min(W, H) / 2 - 20;
    var innerRadius = radius * 0.55;
    var startAngle = -Math.PI / 2;

    validData.forEach(function(item, i) {
      var sliceAngle = (item.value / total) * 2 * Math.PI;
      var color = item.color || colors[i % colors.length];

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.shadowColor = color + '44';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (sliceAngle > 0.3) {
        var midAngle = startAngle + sliceAngle / 2;
        var labelRadius = (radius + innerRadius) / 2;
        var lx = cx + Math.cos(midAngle) * labelRadius;
        var ly = cy + Math.sin(midAngle) * labelRadius;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Rajdhani';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var percent = Math.round((item.value / total) * 100);
        if (percent >= 8) {
          ctx.fillText(percent + '%', lx, ly);
        }
      }

      startAngle += sliceAngle;
    });

    ctx.fillStyle = '#e0f0ff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Total', cx, cy - 10);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 11px Orbitron';
    ctx.fillText(formatCurrency(total), cx, cy + 14);
  }
  // ============================================================
  // 13. SETTINGS FUNCTIONS
  // ============================================================

  function renderSettings() {
    currentPage = 'settings';
    var settings = appData.settings || {};

    var hasNotificationSupport = 'Notification' in window;
    var permission = hasNotificationSupport ? Notification.permission : 'denied';
    var isPermissionGranted = permission === 'granted';
    var isPermissionDenied = permission === 'denied';

    var notificationState = localStorage.getItem(NOTIFICATION_KEY);
    var isNotificationOn = notificationState === 'enabled' && isPermissionGranted;

    var html = '';
    html += '<div class="page-container active">';
    html += '<div class="section-title" style="font-size:1.2rem;margin-bottom:16px;">⚙️ Pengaturan</div>';

    // Theme
    html += '<div class="glass" style="margin-bottom:12px;">';
    html +=
      '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tampilan</h4>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    html += '<button class="neon-btn small ' + (settings.theme === 'dark' ? 'active' : '') +
      '" onclick="setTheme(\'dark\')">🌙 Dark</button>';
    html += '<button class="neon-btn small ' + (settings.theme === 'light' ? 'active' : '') +
      '" onclick="setTheme(\'light\')">☀️ Light</button>';
    html += '<button class="neon-btn small ' + (settings.theme === 'system' ? 'active' : '') +
      '" onclick="setTheme(\'system\')">🖥️ System</button>';
    html += '</div></div>';

    // Notification
    html += '<div class="glass" style="margin-bottom:12px;">';
    html +=
      '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🔔 Pengingat Menabung</h4>';
    
    if (isPermissionDenied) {
      html += '<div class="notification-permission-denied">';
      html += '<span class="denied-icon">❌</span>';
      html += '<span>Notifikasi diblokir oleh browser. Silakan aktifkan izin notifikasi di pengaturan browser.</span>';
      html += '</div>';
    } else {
      html += '<div class="notification-toggle-wrapper">';
      html += '<div class="notification-toggle-info">';
      html += '<div class="toggle-label">';
      html += isNotificationOn ? '✓' : '🔔';
      html += ' <span>' + (isNotificationOn ? 'Pengingat Menabung Aktif' : 'Aktifkan Pengingat Menabung') + '</span>';
      html += '</div>';
      html += '<div class="toggle-desc">' + 
        (isNotificationOn ? 'Kamu akan mendapatkan pengingat untuk tetap konsisten menabung.' : 
        'Dapatkan pengingat untuk tetap konsisten menabung.') +
      '</div>';
      html += '</div>';
      
      html += '<div class="notification-toggle-status">';
      html += '<div class="toggle-switch-modern' + (isNotificationOn ? ' is-active' : '') + 
        '" onclick="toggleNotification()" role="button" aria-pressed="' + (isNotificationOn ? 'true' : 'false') + 
        '" aria-label="' + (isNotificationOn ? 'Nonaktifkan' : 'Aktifkan') + ' Pengingat Menabung" tabindex="0">';
      html += '<div class="toggle-track"></div>';
      html += '<div class="toggle-thumb"></div>';
      html += '</div>';
      html += '<span class="toggle-status-text ' + (isNotificationOn ? 'on' : 'off') + '">' + 
        (isNotificationOn ? 'ON' : 'OFF') + '</span>';
      html += '</div>';
      html += '</div>';
      
      if (hasNotificationSupport && permission === 'default') {
        html += '<div style="margin-top:8px;font-size:0.7rem;color:#88a0b8;">';
        html += '💡 Klik toggle untuk meminta izin notifikasi browser.';
        html += '</div>';
      }
    }
    html += '</div>';

    // Data
    html += '<div class="glass" style="margin-bottom:12px;">';
    html +=
      '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Data</h4>';
    html +=
      '<div style="display:flex;flex-direction:column;gap:8px;">';
    html +=
      '<button class="neon-btn small" onclick="downloadBackup()" style="width:100%;text-align:center;">📥 Download Backup</button>';
    html +=
      '<button class="neon-btn small" onclick="document.getElementById(\'restoreInput\').click()" style="width:100%;text-align:center;">📤 Restore Backup</button>';
    html +=
      '<input type="file" id="restoreInput" accept=".json" style="display:none" onchange="restoreBackup(this)" />';
    html +=
      '<button class="neon-btn danger small" onclick="openResetModal()" style="width:100%;text-align:center;">🗑️ Reset Semua Data</button>';
    html += '</div></div>';

    // Data Warning
    html += '<div class="data-warning" style="margin-bottom:12px;">';
    html += '<span class="warning-icon">🔒</span>';
    html +=
      '<span>Data tersimpan secara lokal di perangkat ini. <strong>Download backup</strong> secara rutin untuk menghindari kehilangan data.</span>';
    html += '</div>';

    // About
    html += '<div class="glass" style="margin-bottom:12px;">';
    html +=
      '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tentang</h4>';
    html += '<p style="color:#e0f0ff;font-weight:600;">NEONVAULT v2.0.4</p>';
    html += '<p style="color:#88a0b8;font-size:0.85rem;">Personal Savings Manager</p>';
    html += '<p style="color:#88a0b8;font-size:0.75rem;margin-top:4px;">🔒 Data tersimpan secara lokal</p>';
    html +=
      '<p style="color:#88a0b8;font-size:0.7rem;margin-top:2px;">⚠️ Hapus data browser dapat menghapus data tabungan</p>';
    html += '</div>';

    // JHON FORUM ACCESS
    html += '<div class="jhon-forum-card">';
    html += '<div class="jhon-forum-title">JHON FORUM ACCESS</div>';
    html += '<div class="jhon-forum-divider"></div>';
    html +=
      '<p class="jhon-forum-desc">Bergabunglah dengan saluran komunikasi kami untuk pembaruan sistem & pelaporan bug.</p>';
    html +=
      '<a href="https://whatsapp.com/channel/0029VaLiUSS5q08hPj5mcH0m" target="_blank" rel="noopener noreferrer" class="jhon-forum-btn">Join Saluran</a>';
    html += '</div>';

    mainContent.innerHTML = html;
  }

  // ============================================================
  // 14. THEME FUNCTIONS
  // ============================================================

  function setTheme(theme) {
    appData.settings.theme = theme;
    saveData(appData);
    applyTheme(theme);
    showToast('Tema: ' + theme, 'success');
    renderCurrentPage();
  }

  function applyTheme(theme) {
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia(
    '(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('light-mode', !isDark);
  }

  // ============================================================
  // 15. NOTIFICATION FUNCTIONS
  // ============================================================

  function toggleNotification() {
    if (!('Notification' in window)) {
      showToast('Browser tidak mendukung notifikasi', 'error');
      return;
    }

    var permission = Notification.permission;
    var currentState = localStorage.getItem(NOTIFICATION_KEY) === 'enabled';

    if (permission === 'denied') {
      showToast('❌ Notifikasi diblokir oleh browser. Aktifkan di pengaturan browser.', 'error');
      renderSettings();
      return;
    }

    if (permission === 'default') {
      requestNotificationPermission();
      return;
    }

    if (currentState) {
      localStorage.removeItem(NOTIFICATION_KEY);
      notificationEnabled = false;
      if (reminderInterval) {
        stopReminders();
      }
      showToast('🔕 Pengingat menabung dinonaktifkan', 'warning');
      renderSettings();
    } else {
      localStorage.setItem(NOTIFICATION_KEY, 'enabled');
      notificationEnabled = true;
      startReminders();
      showToast('✓ Pengingat menabung berhasil diaktifkan', 'success');
      renderSettings();
    }
  }

  function requestNotificationPermission() {
    if (!('Notification' in window)) {
      showToast('Browser tidak mendukung notifikasi', 'error');
      return;
    }

    Notification.requestPermission().then(function(permission) {
      if (permission === 'granted') {
        localStorage.setItem(NOTIFICATION_KEY, 'enabled');
        notificationEnabled = true;
        startReminders();
        showToast('✓ Pengingat menabung berhasil diaktifkan', 'success');
        renderSettings();
      } else if (permission === 'denied') {
        showToast('❌ Izin notifikasi ditolak. Aktifkan di pengaturan browser.', 'error');
        renderSettings();
      } else {
        showToast('Izin notifikasi tidak diberikan', 'error');
      }
    }).catch(function(err) {
      console.error('Notification permission error:', err);
      showToast('Gagal meminta izin notifikasi', 'error');
    });
  }

  function startReminders() {
    stopReminders();
    if (!notificationEnabled) {
      var savedState = localStorage.getItem(NOTIFICATION_KEY);
      if (savedState === 'enabled' && Notification.permission === 'granted') {
        notificationEnabled = true;
      } else {
        return;
      }
    }
    reminderInterval = setInterval(function() {
      checkReminders();
    }, 60000);
    checkReminders();
  }

  function stopReminders() {
    if (reminderInterval) {
      clearInterval(reminderInterval);
      reminderInterval = null;
    }
  }

  function checkReminders() {
    if (!notificationEnabled) return;
    if (Notification.permission !== 'granted') return;
    
    var activeGoals = getActiveGoals(appData.goals);
    var closeGoals = activeGoals.filter(function(g) { return calculateProgress(g) >= 80; });
    
    closeGoals.forEach(function(goal) {
      showToast('🎯 Kamu tinggal ' + formatCurrency(goal.target - goal.saved) +
        ' lagi untuk mencapai target "' + goal.name + '"', 'warning');
    });
    
    var today = getToday();
    var todayTxs = appData.transactions.filter(function(t) { return t.date.startsWith(today); });
    var hasSaving = todayTxs.some(function(t) { return t.type === 'saving'; });
    
    if (!hasSaving && appData.goals.length > 0) {
      var lastReminder = localStorage.getItem('neonvault_last_reminder');
      if (lastReminder !== today) {
        localStorage.setItem('neonvault_last_reminder', today);
        showToast('💰 Jangan lupa menabung hari ini!', 'info');
      }
    }
  }

  // ============================================================
  // 16. BACKUP / RESTORE FUNCTIONS
  // ============================================================

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

  // ============================================================
  // 17. RESET MODAL FUNCTIONS
  // ============================================================

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
      '<input type="text" id="resetConfirm" placeholder="Ketik HAPUS" maxlength="10" style="text-transform:uppercase;" oninput="document.getElementById(\'resetBtn\').disabled = this.value !== \'HAPUS\'" aria-label="Konfirmasi reset" />' +
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
    downloadBackup();
    var success = resetAllData();
    if (success) {
      closeModal('resetModal');
      showToast('🗑️ Semua data telah direset', 'warning');
    } else {
      showToast('Gagal reset data', 'error');
    }
  }
  // ============================================================
  // 18. RENDER CURRENT PAGE
  // ============================================================

  function renderCurrentPage() {
    if (onboarding && onboarding.classList.contains('active')) {
      if (bottomNav) {
        bottomNav.style.display = 'none';
      }
      return;
    }
    
    if (namePopup && namePopup.classList.contains('active')) {
      if (bottomNav) {
        bottomNav.style.display = 'none';
      }
      return;
    }
    
    if (dashboard && dashboard.classList.contains('active')) {
      if (bottomNav) {
        bottomNav.style.display = 'flex';
      }
    }
    
    switch (currentPage) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'goals':
        renderGoals();
        break;
      case 'goalDetail':
        renderGoalDetail();
        break;
      case 'transactions':
        renderTransactions();
        break;
      case 'analytics':
        renderAnalytics();
        break;
      case 'settings':
        renderSettings();
        break;
      default:
        renderDashboard();
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
  // 19. NAVIGATION SETUP
  // ============================================================

  function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(function(item) {
      item.addEventListener('click', function() {
        if (onboarding && onboarding.classList.contains('active')) {
          return;
        }
        if (namePopup && namePopup.classList.contains('active')) {
          return;
        }
        var page = this.dataset.page;
        currentGoalId = null;
        navigateTo(page);
      });
    });

    window.navigateTo = navigateTo;
    window.goBack = goBack;
    window.toggleNotification = toggleNotification;
  }

  // ============================================================
  // 20. EXPOSE GLOBALLY
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
  window.filterTransactions = filterTransactions;
  window.selectColor = selectColor;
  window.setTheme = setTheme;
  window.downloadBackup = downloadBackup;
  window.restoreBackup = restoreBackup;
  window.openResetModal = openResetModal;
  window.confirmReset = confirmReset;
  window.navigateTo = navigateTo;
  window.goBack = goBack;
  window.toggleNotification = toggleNotification;
  window.setChartPeriod = setChartPeriod;

  // ============================================================
  // 21. INITIALIZATION
  // ============================================================

  function init() {
    try {
      var savedNotification = localStorage.getItem(NOTIFICATION_KEY);
      notificationEnabled = savedNotification === 'enabled';

      appData = loadData();
      applyTheme(appData.settings.theme || 'dark');

      if (!appData.settings.onboardingComplete) {
        onboarding.classList.add('active');
        loadingScreen.classList.add('hidden');
        if (bottomNav) {
          bottomNav.style.display = 'none';
        }
      } else if (!appData.settings.userName) {
        onboarding.classList.remove('active');
        namePopup.classList.add('active');
        loadingScreen.classList.add('hidden');
        if (bottomNav) {
          bottomNav.style.display = 'none';
        }
        setTimeout(function() {
          if (nameInput) nameInput.focus();
        }, 100);
      } else {
        onboarding.classList.remove('active');
        namePopup.classList.remove('active');
        dashboard.classList.add('active');
        loadingScreen.classList.add('hidden');
        if (bottomNav) {
          bottomNav.style.display = 'flex';
        }
        renderDashboard();
        if (notificationEnabled && Notification.permission === 'granted') {
          startReminders();
        }
      }

      onboardingStart.addEventListener('click', function() {
        appData.settings.onboardingComplete = true;
        saveData(appData);
        onboarding.classList.remove('active');
        namePopup.classList.add('active');
        if (bottomNav) {
          bottomNav.style.display = 'none';
        }
        setTimeout(function() {
          if (nameInput) nameInput.focus();
        }, 100);
      });

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
        loadingScreen.classList.add('hidden');
        if (bottomNav) {
          bottomNav.style.display = 'flex';
        }
        renderDashboard();
        if (notificationEnabled && Notification.permission === 'granted') {
          startReminders();
        }
        showToast('Selamat datang, ' + name + '! ✦', 'success');
      });

      nameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          startBtn.click();
        }
      });

      settingsToggle.addEventListener('click', function() {
        currentGoalId = null;
        navigateTo('settings');
      });

      updateClock();
      setInterval(updateClock, 1000);

      setupNavigation();

      var hash = window.location.hash;
      if (hash) {
        var parts = hash.replace('#', '').split('/');
        if (parts[0] === 'goalDetail' && parts[1]) {
          currentGoalId = parts[1];
          navigateTo('goalDetail', currentGoalId);
        } else if (parts[0]) {
          navigateTo(parts[0]);
        }
      }

      console.log('🚀 NEONVAULT V2.0.4 initialized successfully!');

    } catch (e) {
      console.error('Init error:', e);
      loadingScreen.classList.add('hidden');
      onboarding.classList.add('active');
      if (bottomNav) {
        bottomNav.style.display = 'none';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();