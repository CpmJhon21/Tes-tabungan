/* ============================================================
   app.js – Main Application Controller
   NEONVAULT V2
   ============================================================ */

var App = {
    data: null,
    currentPage: 'dashboard',
    filterType: 'all',
    filterCategory: 'all',
    filterSort: 'newest',
    transactionToUndo: null,
    chartPeriod: 6,
    currentGoalId: null,
    
    init: function() {
        try {
            // Load data
            this.loadData();
            
            // Check onboarding
            if (!this.data.settings.onboardingComplete) {
                this.showOnboarding();
            } else if (!this.data.settings.userName) {
                this.showNamePopup();
            } else {
                this.startApp();
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Clock
            this.updateClock();
            setInterval(function() { App.updateClock(); }, 1000);
            
            // Background
            this.initBackground();
            
            // Mouse glow
            if (!('ontouchstart' in window)) {
                document.addEventListener('mousemove', function(e) {
                    var glow = document.getElementById('mouseGlow');
                    if (glow) {
                        glow.style.left = e.clientX + 'px';
                        glow.style.top = e.clientY + 'px';
                    }
                });
            }
            
            // Close modals on outside click
            document.querySelectorAll('.modal-overlay').forEach(function(el) {
                el.addEventListener('click', function(e) {
                    if (e.target === el) {
                        el.classList.add('hidden');
                    }
                });
            });
            
            // Bottom navigation
            document.querySelectorAll('.nav-item').forEach(function(item) {
                item.addEventListener('click', function() {
                    var page = this.dataset.page;
                    App.navigateTo(page);
                });
            });
            
            // Modal close buttons
            document.querySelectorAll('.modal-close').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var modal = this.closest('.modal-overlay');
                    if (modal) modal.classList.add('hidden');
                });
            });
            
            console.log('NEONVAULT V2 initialized!');
            
        } catch(e) {
            console.error('Init error:', e);
            // Force hide loading
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('onboarding').classList.remove('hidden');
        }
    },
    
    loadData: function() {
        var saved = StorageManager.getData();
        if (!saved) {
            saved = getDefaultData();
            StorageManager.saveData(saved);
        }
        this.data = saved;
        return this.data;
    },
    
    saveData: function() {
        if (!this.data) return false;
        return StorageManager.saveData(this.data);
    },
    
    showOnboarding: function() {
        var onboarding = document.getElementById('onboarding');
        if (!onboarding) return;
        onboarding.classList.remove('hidden');
        
        document.getElementById('onboardingStart').addEventListener('click', function() {
            onboarding.classList.add('hidden');
            App.data.settings.onboardingComplete = true;
            App.saveData();
            App.showNamePopup();
        });
    },
    
    showNamePopup: function() {
        var popup = document.getElementById('namePopup');
        if (!popup) return;
        popup.classList.remove('hidden');
        
        var input = document.getElementById('nameInput');
        var btn = document.getElementById('startBtn');
        
        var start = function() {
            var name = input.value.trim();
            if (!name) {
                UIRenderer.showToast('Masukkan nama terlebih dahulu', 'error');
                input.focus();
                return;
            }
            App.data.settings.userName = name;
            App.saveData();
            popup.classList.add('hidden');
            App.startApp();
            UIRenderer.showToast('Selamat datang, ' + name + '! ✦', 'success');
        };
        
        btn.onclick = start;
        input.onkeydown = function(e) { if (e.key === 'Enter') start(); };
        input.focus();
    },
    
    startApp: function() {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.add('active');
        this.navigateTo('dashboard');
    },
    
    navigateTo: function(page) {
        this.currentPage = page;
        
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        switch(page) {
            case 'dashboard':
                UIRenderer.renderDashboard(this.data);
                break;
            case 'goals':
                UIRenderer.renderGoals(this.data);
                break;
            case 'transactions':
                UIRenderer.renderTransactions(this.data);
                break;
            case 'analytics':
                UIRenderer.renderAnalytics(this.data);
                break;
            case 'settings':
                UIRenderer.renderSettings(this.data);
                break;
        }
    },
    
    openTransactionModal: function(type) {
        type = type || 'income';
        var modal = document.getElementById('transactionModal');
        if (!modal) return;
        
        var titles = {
            income: '➕ Tambah Pemasukan',
            expense: '➖ Tambah Pengeluaran',
            saving: '💰 Tambah Tabungan'
        };
        document.getElementById('modalTitle').textContent = titles[type] || titles.income;
        document.getElementById('modalType').value = type;
        document.getElementById('modalAmount').value = '';
        document.getElementById('modalDesc').value = '';
        document.getElementById('modalDate').textContent = formatDateTime(getCurrentDateTime());
        
        var goalSelect = document.getElementById('modalGoalSelect');
        if (type === 'saving') {
            goalSelect.classList.remove('hidden');
            var select = document.getElementById('modalGoal');
            select.innerHTML = '<option value="">Pilih Target Tabungan</option>' +
                this.data.goals.filter(function(g) { return !isGoalCompleted(g); }).map(function(g) {
                    return '<option value="' + g.id + '">' + (g.icon || '🎯') + ' ' + g.name + '</option>';
                }).join('');
        } else {
            goalSelect.classList.add('hidden');
        }
        
        modal.classList.remove('hidden');
        setTimeout(function() { document.getElementById('modalAmount').focus(); }, 100);
    },
    
    confirmTransaction: function() {
        var amount = parseInt(document.getElementById('modalAmount').value);
        var type = document.getElementById('modalType').value;
        var category = document.getElementById('modalCategory').value;
        var desc = document.getElementById('modalDesc').value.trim();
        var goalId = document.getElementById('modalGoal')?.value || '';
        
        if (!amount || amount <= 0) {
            UIRenderer.showToast('Nominal harus lebih dari 0', 'error');
            return;
        }
        
        var transaction = {
            id: generateId(),
            type: type,
            amount: amount,
            category: category,
            desc: desc || (type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Tabungan'),
            date: getCurrentDateTime(),
            goalId: type === 'saving' ? goalId : ''
        };
        
        this.data.transactions.push(transaction);
        
        if (type === 'saving' && goalId) {
            var goal = this.data.goals.find(function(g) { return g.id === goalId; });
            if (goal) {
                goal.saved += amount;
                goal.updatedAt = getCurrentDateTime();
            }
        }
        
        this.saveData();
        document.getElementById('transactionModal').classList.add('hidden');
        
        this.transactionToUndo = transaction;
        UIRenderer.showToast(
            (type === 'income' ? '➕' : type === 'expense' ? '➖' : '💰') + ' Transaksi berhasil disimpan: ' + formatCurrency(amount),
            'success',
            function() { App.undoTransaction(); }
        );
        
        this.refreshCurrentPage();
    },
    
    undoTransaction: function() {
        if (!this.transactionToUndo) return;
        
        var tx = this.transactionToUndo;
        var index = this.data.transactions.findIndex(function(t) { return t.id === tx.id; });
        
        if (index !== -1) {
            this.data.transactions.splice(index, 1);
            
            if (tx.type === 'saving' && tx.goalId) {
                var goal = this.data.goals.find(function(g) { return g.id === tx.goalId; });
                if (goal) {
                    goal.saved -= tx.amount;
                    goal.updatedAt = getCurrentDateTime();
                }
            }
            
            this.saveData();
            this.transactionToUndo = null;
            UIRenderer.showToast('Transaksi dibatalkan', 'warning');
            this.refreshCurrentPage();
        }
    },
    
    openGoalModal: function(goalId) {
        goalId = goalId || null;
        var modal = document.getElementById('goalModal');
        if (!modal) return;
        
        var isEdit = !!goalId;
        var goal = isEdit ? this.data.goals.find(function(g) { return g.id === goalId; }) : null;
        
        document.getElementById('goalModalTitle').textContent = isEdit ? '✏️ Edit Target' : '🎯 Target Baru';
        document.getElementById('goalName').value = goal?.name || '';
        document.getElementById('goalTarget').value = goal?.target || '';
        document.getElementById('goalDeadline').value = goal?.deadline || '';
        document.getElementById('goalNote').value = goal?.note || '';
        
        document.querySelectorAll('.color-option').forEach(function(el) {
            el.classList.toggle('active', el.dataset.color === (goal?.color || '#00e5ff'));
        });
        
        this.currentGoalId = goalId;
        modal.classList.remove('hidden');
        setTimeout(function() { document.getElementById('goalName').focus(); }, 100);
    },
    
    confirmGoal: function() {
        var name = document.getElementById('goalName').value.trim();
        var target = parseInt(document.getElementById('goalTarget').value);
        var deadline = document.getElementById('goalDeadline').value;
        var note = document.getElementById('goalNote').value.trim();
        var colorEl = document.querySelector('.color-option.active');
        var color = colorEl?.dataset.color || '#00e5ff';
        
        if (!name) {
            UIRenderer.showToast('Masukkan nama target', 'error');
            return;
        }
        if (!target || target <= 0) {
            UIRenderer.showToast('Target nominal harus lebih dari 0', 'error');
            return;
        }
        
        var isEdit = !!this.currentGoalId;
        
        if (isEdit) {
            var goal = this.data.goals.find(function(g) { return g.id === App.currentGoalId; });
            if (goal) {
                goal.name = name;
                goal.target = target;
                goal.deadline = deadline;
                goal.note = note;
                goal.color = color;
                goal.updatedAt = getCurrentDateTime();
                UIRenderer.showToast('✅ Target berhasil diupdate', 'success');
            }
        } else {
            var newGoal = {
                id: generateId(),
                name: name,
                target: target,
                saved: 0,
                deadline: deadline,
                note: note,
                color: color,
                icon: '🎯',
                createdAt: getCurrentDateTime(),
                updatedAt: getCurrentDateTime()
            };
            this.data.goals.push(newGoal);
            UIRenderer.showToast('🎯 Target berhasil dibuat!', 'success');
        }
        
        this.saveData();
        document.getElementById('goalModal').classList.add('hidden');
        this.currentGoalId = null;
        this.refreshCurrentPage();
    },
    
    deleteGoal: function(goalId) {
        if (!confirm('Yakin ingin menghapus target ini?')) return;
        
        this.data.goals = this.data.goals.filter(function(g) { return g.id !== goalId; });
        this.saveData();
        UIRenderer.showToast('🗑️ Target dihapus', 'warning');
        this.refreshCurrentPage();
    },
    
    openGoalAddModal: function(goalId) {
        var modal = document.getElementById('goalAddModal');
        if (!modal) return;
        
        var goal = this.data.goals.find(function(g) { return g.id === goalId; });
        if (!goal) return;
        
        document.getElementById('goalAddName').textContent = 'Target: ' + (goal.icon || '🎯') + ' ' + goal.name;
        document.getElementById('goalAddAmount').value = '';
        document.getElementById('goalAddNote').value = '';
        this.currentGoalId = goalId;
        
        modal.classList.remove('hidden');
        setTimeout(function() { document.getElementById('goalAddAmount').focus(); }, 100);
    },
    
    confirmGoalAdd: function() {
        var amount = parseInt(document.getElementById('goalAddAmount').value);
        var note = document.getElementById('goalAddNote').value.trim();
        
        if (!amount || amount <= 0) {
            UIRenderer.showToast('Nominal harus lebih dari 0', 'error');
            return;
        }
        
        var goal = this.data.goals.find(function(g) { return g.id === App.currentGoalId; });
        if (!goal) {
            UIRenderer.showToast('Target tidak ditemukan', 'error');
            return;
        }
        
        goal.saved += amount;
        goal.updatedAt = getCurrentDateTime();
        
        this.data.transactions.push({
            id: generateId(),
            type: 'saving',
            amount: amount,
            category: 'savings',
            desc: note || 'Tabungan ' + goal.name,
            date: getCurrentDateTime(),
            goalId: goal.id
        });
        
        this.saveData();
        document.getElementById('goalAddModal').classList.add('hidden');
        UIRenderer.showToast('💰 ' + formatCurrency(amount) + ' ditambahkan ke ' + goal.name, 'success');
        this.refreshCurrentPage();
    },
    
    filterTransactions: function(type) {
        var searchInput = document.getElementById('txSearchInput');
        var categoryFilter = document.getElementById('txCategoryFilter');
        var sortFilter = document.getElementById('txSortFilter');
        
        if (type) {
            this.filterType = type;
            document.querySelectorAll('.filter-btn[data-filter]').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.filter === type);
            });
        }
        
        this.filterCategory = categoryFilter?.value || 'all';
        this.filterSort = sortFilter?.value || 'newest';
        var query = searchInput?.value.toLowerCase() || '';
        
        var filtered = this.data.transactions.slice();
        
        if (this.filterType !== 'all') {
            filtered = filtered.filter(function(t) { return t.type === App.filterType; });
        }
        
        if (this.filterCategory !== 'all') {
            filtered = filtered.filter(function(t) { return t.category === App.filterCategory; });
        }
        
        if (query) {
            filtered = filtered.filter(function(t) {
                var desc = (t.desc || '').toLowerCase();
                var cat = getCategoryName(t.category).toLowerCase();
                return desc.includes(query) || cat.includes(query) || t.amount.toString().includes(query);
            });
        }
        
        switch(this.filterSort) {
            case 'newest':
                filtered.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
                break;
            case 'oldest':
                filtered.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
                break;
            case 'highest':
                filtered.sort(function(a, b) { return b.amount - a.amount; });
                break;
            case 'lowest':
                filtered.sort(function(a, b) { return a.amount - b.amount; });
                break;
        }
        
        var container = document.getElementById('transactionsList');
        if (!container) return;
        
        var currency = this.data.settings.currency || 'IDR';
        var goals = this.data.goals || [];
        
        if (filtered.length === 0) {
            container.innerHTML = 
                '<div class="empty-state glass" style="padding:30px 20px;">' +
                    '<div class="empty-icon">📊</div>' +
                    '<div class="empty-title">Tidak ada transaksi</div>' +
                    '<div class="empty-desc">Coba ubah filter atau tambahkan transaksi baru.</div>' +
                '</div>';
            return;
        }
        
        container.innerHTML = filtered.map(function(t) {
            return UIRenderer.renderTransactionFull(t, currency, goals);
        }).join('');
    },
    
    updateChartPeriod: function(type, months) {
        this.chartPeriod = months;
        document.querySelectorAll('[data-chart="' + type + '"]').forEach(function(btn) {
            var text = btn.textContent.trim();
            btn.classList.toggle('active', text.includes(months));
        });
        this.navigateTo('analytics');
    },
    
    setTheme: function(theme) {
        this.data.settings.theme = theme;
        this.saveData();
        this.applyTheme(theme);
        this.refreshCurrentPage();
    },
    
    applyTheme: function(theme) {
        var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.body.classList.toggle('light-mode', !isDark);
    },
    
    setCurrency: function(code) {
        this.data.settings.currency = code;
        this.saveData();
        this.refreshCurrentPage();
        UIRenderer.showToast('Mata uang diubah ke ' + code, 'success');
    },
    
    toggleReminders: function(enabled) {
        this.data.settings.reminders = enabled;
        this.saveData();
        UIRenderer.showToast(enabled ? '🔔 Pengingat diaktifkan' : '🔕 Pengingat dinonaktifkan', 'success');
    },
    
    downloadBackup: function() {
        var data = StorageManager.exportData();
        if (!data) {
            UIRenderer.showToast('Gagal membuat backup', 'error');
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
        
        UIRenderer.showToast('📥 Backup berhasil didownload', 'success');
    },
    
    restoreBackup: function(input) {
        var file = input.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var success = StorageManager.importData(e.target.result);
                if (success) {
                    App.loadData();
                    App.refreshCurrentPage();
                    UIRenderer.showToast('📤 Backup berhasil dipulihkan', 'success');
                } else {
                    UIRenderer.showToast('Format backup tidak valid', 'error');
                }
            } catch (err) {
                UIRenderer.showToast('Gagal restore backup', 'error');
                console.error(err);
            }
        };
        reader.readAsText(file);
        input.value = '';
    },
    
    openResetModal: function() {
        var modal = document.getElementById('resetModal');
        if (!modal) return;
        
        document.getElementById('resetConfirmInput').value = '';
        document.getElementById('resetConfirmBtn').disabled = true;
        modal.classList.remove('hidden');
        
        var input = document.getElementById('resetConfirmInput');
        input.oninput = function() {
            document.getElementById('resetConfirmBtn').disabled = this.value.toUpperCase() !== 'HAPUS';
        };
        
        document.getElementById('resetConfirmBtn').onclick = function() {
            App.resetAllData();
        };
    },
    
    resetAllData: function() {
        var backup = StorageManager.exportData();
        if (backup) {
            var blob = new Blob([backup], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'neonvault_backup_before_reset_' + getToday() + '.json';
            a.click();
            URL.revokeObjectURL(url);
        }
        
        var success = StorageManager.resetData();
        if (success) {
            this.loadData();
            document.getElementById('resetModal').classList.add('hidden');
            UIRenderer.showToast('🗑️ Semua data telah direset', 'warning');
            this.navigateTo('dashboard');
        } else {
            UIRenderer.showToast('Gagal reset data', 'error');
        }
    },
    
    refreshCurrentPage: function() {
        this.navigateTo(this.currentPage);
    },
    
    updateClock: function() {
        try {
            var now = new Date();
            var clock = document.getElementById('realTimeClock');
            var date = document.getElementById('realTimeDate');
            if (clock) {
                clock.textContent = now.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
            if (date) {
                date.textContent = now.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            }
        } catch(e) {}
    },
    
    initBackground: function() {
        var canvas = document.getElementById('bgCanvas');
        if (!canvas) return;
        
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        var w, h;
        var resize = function() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
        
        var particles = [];
        var count = Math.min(40, Math.floor(window.innerWidth / 15));
        for (var i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                r: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.3 + 0.05
            });
        }
        
        var draw = function() {
            ctx.clearRect(0, 0, w, h);
            
            // Grid
            ctx.strokeStyle = 'rgba(0,229,255,0.02)';
            ctx.lineWidth = 0.5;
            var step = 60;
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
            particles.forEach(function(p) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(0,229,255,' + p.alpha + ')';
                ctx.fill();
            });
            
            requestAnimationFrame(draw);
        };
        draw();
    },
    
    setupEventListeners: function() {
        // Transaction modal
        document.getElementById('modalConfirmBtn')?.addEventListener('click', function() { App.confirmTransaction(); });
        document.getElementById('modalType')?.addEventListener('change', function(e) {
            var goalSelect = document.getElementById('modalGoalSelect');
            if (e.target.value === 'saving') {
                goalSelect.classList.remove('hidden');
            } else {
                goalSelect.classList.add('hidden');
            }
        });
        
        // Goal modal
        document.getElementById('goalConfirmBtn')?.addEventListener('click', function() { App.confirmGoal(); });
        document.getElementById('goalAddConfirmBtn')?.addEventListener('click', function() { App.confirmGoalAdd(); });
        
        // Color options
        document.querySelectorAll('.color-option').forEach(function(el) {
            el.addEventListener('click', function() {
                document.querySelectorAll('.color-option').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
            });
        });
        
        // Settings modal
        document.getElementById('settingsToggle')?.addEventListener('click', function() {
            document.getElementById('settingsModal').classList.remove('hidden');
        });
        
        document.querySelectorAll('#settingsModal .modal-close').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.getElementById('settingsModal').classList.add('hidden');
            });
        });
        
        document.getElementById('currencySelect')?.addEventListener('change', function(e) {
            App.setCurrency(e.target.value);
        });
        
        document.getElementById('reminderToggle')?.addEventListener('change', function(e) {
            App.toggleReminders(e.target.checked);
        });
        
        document.getElementById('backupBtn')?.addEventListener('click', function() { App.downloadBackup(); });
        document.getElementById('restoreBtn')?.addEventListener('click', function() {
            document.getElementById('restoreFileInput').click();
        });
        document.getElementById('restoreFileInput')?.addEventListener('change', function() {
            App.restoreBackup(this);
        });
        document.getElementById('resetBtn')?.addEventListener('click', function() { App.openResetModal(); });
    }
};

// ============================================================
// START APP
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});