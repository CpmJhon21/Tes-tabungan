/* ============================================================
   app.js – Main Application Controller
   NEONVAULT V2
   ============================================================ */

// ============================================================
// APP CONTROLLER
// ============================================================
const App = {
    data: null,
    currentPage: 'dashboard',
    filterType: 'all',
    filterCategory: 'all',
    filterSort: 'newest',
    transactionToUndo: null,
    chartPeriod: 6,
    
    // ============================================================
    // INIT
    // ============================================================
    init() {
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
        setInterval(() => this.updateClock(), 1000);
        
        // Reminders
        if (this.data.settings.reminders) {
            this.checkReminders();
            setInterval(() => this.checkReminders(), 60000);
        }
        
        // Background
        this.initBackground();
        
        // Mouse glow
        if (!('ontouchstart' in window)) {
            document.addEventListener('mousemove', (e) => {
                const glow = document.getElementById('mouseGlow');
                if (glow) {
                    glow.style.left = e.clientX + 'px';
                    glow.style.top = e.clientY + 'px';
                }
            });
        }
        
        // Close modals on outside click
        document.querySelectorAll('.modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el) {
                    el.classList.add('hidden');
                }
            });
        });
        
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                if (modal) modal.classList.add('hidden');
            });
        });
        
        // Ripple effect
        document.querySelectorAll('.neon-btn').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                btn.style.setProperty('--x', x + '%');
                btn.style.setProperty('--y', y + '%');
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
                    m.classList.add('hidden');
                });
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.openTransactionModal('income');
            }
        });
        
        console.log('NEONVAULT V2 initialized!');
    },
    
    // ============================================================
    // LOAD DATA
    // ============================================================
    loadData() {
        let saved = StorageManager.getData();
        if (!saved) {
            saved = getDefaultData();
            StorageManager.saveData(saved);
        }
        this.data = saved;
        return this.data;
    },
    
    // ============================================================
    // SAVE DATA
    // ============================================================
    saveData() {
        if (!this.data) return false;
        return StorageManager.saveData(this.data);
    },
    
    // ============================================================
    // SHOW ONBOARDING
    // ============================================================
    showOnboarding() {
        const onboarding = document.getElementById('onboarding');
        if (!onboarding) return;
        onboarding.classList.remove('hidden');
        
        document.getElementById('onboardingStart').addEventListener('click', () => {
            onboarding.classList.add('hidden');
            this.data.settings.onboardingComplete = true;
            this.saveData();
            this.showNamePopup();
        });
    },
    
    // ============================================================
    // SHOW NAME POPUP
    // ============================================================
    showNamePopup() {
        const popup = document.getElementById('namePopup');
        if (!popup) return;
        popup.classList.remove('hidden');
        
        const input = document.getElementById('nameInput');
        const btn = document.getElementById('startBtn');
        
        const start = () => {
            const name = input.value.trim();
            if (!name) {
                UIRenderer.showToast('Masukkan nama terlebih dahulu', 'error');
                input.focus();
                return;
            }
            this.data.settings.userName = name;
            this.saveData();
            popup.classList.add('hidden');
            this.startApp();
            UIRenderer.showToast('Selamat datang, ' + name + '! ✦', 'success');
        };
        
        btn.onclick = start;
        input.onkeydown = (e) => { if (e.key === 'Enter') start(); };
        input.focus();
    },
    
    // ============================================================
    // START APP
    // ============================================================
    startApp() {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.add('active');
        this.navigateTo('dashboard');
        
        // Update user name
        const display = document.getElementById('userNameDisplay');
        if (display && this.data.settings.userName) {
            display.textContent = this.data.settings.userName;
        }
    },
    
    // ============================================================
    // NAVIGATE
    // ============================================================
    navigateTo(page) {
        this.currentPage = page;
        
        // Update bottom nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        // Render page
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
    
    // ============================================================
    // OPEN TRANSACTION MODAL
    // ============================================================
    openTransactionModal(type = 'income') {
        const modal = document.getElementById('transactionModal');
        if (!modal) return;
        
        document.getElementById('modalTitle').textContent = 
            type === 'income' ? '➕ Tambah Pemasukan' :
            type === 'expense' ? '➖ Tambah Pengeluaran' :
            '💰 Tambah Tabungan';
        
        document.getElementById('modalType').value = type;
        document.getElementById('modalAmount').value = '';
        document.getElementById('modalDesc').value = '';
        document.getElementById('modalDate').textContent = formatDateTime(getCurrentDateTime());
        
        // Show/hide goal selector for saving
        const goalSelect = document.getElementById('modalGoalSelect');
        if (type === 'saving') {
            goalSelect.classList.remove('hidden');
            const select = document.getElementById('modalGoal');
            select.innerHTML = '<option value="">Pilih Target Tabungan</option>' +
                this.data.goals.filter(g => !isGoalCompleted(g)).map(g => 
                    `<option value="${g.id}">${g.icon || '🎯'} ${g.name}</option>`
                ).join('');
        } else {
            goalSelect.classList.add('hidden');
        }
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('modalAmount').focus(), 100);
    },
    
    // ============================================================
    // CONFIRM TRANSACTION
    // ============================================================
    confirmTransaction() {
        const amount = parseInt(document.getElementById('modalAmount').value);
        const type = document.getElementById('modalType').value;
        const category = document.getElementById('modalCategory').value;
        const desc = document.getElementById('modalDesc').value.trim();
        const goalId = document.getElementById('modalGoal')?.value || '';
        
        if (!amount || amount <= 0) {
            UIRenderer.showToast('Nominal harus lebih dari 0', 'error');
            return;
        }
        
        const transaction = {
            id: generateId(),
            type: type,
            amount: amount,
            category: category,
            desc: desc || (type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Tabungan'),
            date: getCurrentDateTime(),
            goalId: type === 'saving' ? goalId : ''
        };
        
        // Save transaction
        this.data.transactions.push(transaction);
        
        // Update goal if saving
        if (type === 'saving' && goalId) {
            const goal = this.data.goals.find(g => g.id === goalId);
            if (goal) {
                goal.saved += amount;
                goal.updatedAt = getCurrentDateTime();
            }
        }
        
        this.saveData();
        document.getElementById('transactionModal').classList.add('hidden');
        
        // Show toast with undo
        this.transactionToUndo = transaction;
        UIRenderer.showToast(
            `${type === 'income' ? '➕' : type === 'expense' ? '➖' : '💰'} Transaksi berhasil disimpan: ${formatCurrency(amount)}`,
            'success',
            () => this.undoTransaction()
        );
        
        this.refreshCurrentPage();
    },
    
    // ============================================================
    // UNDO TRANSACTION
    // ============================================================
    undoTransaction() {
        if (!this.transactionToUndo) return;
        
        const tx = this.transactionToUndo;
        const index = this.data.transactions.findIndex(t => t.id === tx.id);
        
        if (index !== -1) {
            // Remove transaction
            this.data.transactions.splice(index, 1);
            
            // Revert goal if saving
            if (tx.type === 'saving' && tx.goalId) {
                const goal = this.data.goals.find(g => g.id === tx.goalId);
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
    
    // ============================================================
    // OPEN GOAL MODAL
    // ============================================================
    openGoalModal(goalId = null) {
        const modal = document.getElementById('goalModal');
        if (!modal) return;
        
        const isEdit = !!goalId;
        const goal = isEdit ? this.data.goals.find(g => g.id === goalId) : null;
        
        document.getElementById('goalModalTitle').textContent = isEdit ? '✏️ Edit Target' : '🎯 Target Baru';
        document.getElementById('goalName').value = goal?.name || '';
        document.getElementById('goalTarget').value = goal?.target || '';
        document.getElementById('goalDeadline').value = goal?.deadline || '';
        document.getElementById('goalNote').value = goal?.note || '';
        
        // Set color
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.toggle('active', el.dataset.color === (goal?.color || '#00e5ff'));
        });
        
        // Store goal id for edit
        this.currentGoalId = goalId;
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('goalName').focus(), 100);
    },
    
    // ============================================================
    // CONFIRM GOAL
    // ============================================================
    confirmGoal() {
        const name = document.getElementById('goalName').value.trim();
        const target = parseInt(document.getElementById('goalTarget').value);
        const deadline = document.getElementById('goalDeadline').value;
        const note = document.getElementById('goalNote').value.trim();
        const color = document.querySelector('.color-option.active')?.dataset.color || '#00e5ff';
        const icon = document.querySelector('.color-option.active')?.dataset.icon || '🎯';
        
        if (!name) {
            UIRenderer.showToast('Masukkan nama target', 'error');
            return;
        }
        if (!target || target <= 0) {
            UIRenderer.showToast('Target nominal harus lebih dari 0', 'error');
            return;
        }
        
        const isEdit = !!this.currentGoalId;
        
        if (isEdit) {
            const goal = this.data.goals.find(g => g.id === this.currentGoalId);
            if (goal) {
                goal.name = name;
                goal.target = target;
                goal.deadline = deadline;
                goal.note = note;
                goal.color = color;
                goal.icon = icon;
                goal.updatedAt = getCurrentDateTime();
                UIRenderer.showToast('✅ Target berhasil diupdate', 'success');
            }
        } else {
            const goal = {
                id: generateId(),
                name: name,
                target: target,
                saved: 0,
                deadline: deadline,
                note: note,
                color: color,
                icon: icon,
                createdAt: getCurrentDateTime(),
                updatedAt: getCurrentDateTime()
            };
            this.data.goals.push(goal);
            UIRenderer.showToast('🎯 Target berhasil dibuat!', 'success');
        }
        
        this.saveData();
        document.getElementById('goalModal').classList.add('hidden');
        this.currentGoalId = null;
        this.refreshCurrentPage();
    },
    
    // ============================================================
    // DELETE GOAL
    // ============================================================
    deleteGoal(goalId) {
        if (!confirm('Yakin ingin menghapus target ini?')) return;
        
        this.data.goals = this.data.goals.filter(g => g.id !== goalId);
        this.saveData();
        UIRenderer.showToast('🗑️ Target dihapus', 'warning');
        this.refreshCurrentPage();
    },
    
    // ============================================================
    // OPEN GOAL ADD MODAL
    // ============================================================
    openGoalAddModal(goalId) {
        const modal = document.getElementById('goalAddModal');
        if (!modal) return;
        
        const goal = this.data.goals.find(g => g.id === goalId);
        if (!goal) return;
        
        document.getElementById('goalAddName').textContent = `Target: ${goal.icon || '🎯'} ${goal.name}`;
        document.getElementById('goalAddAmount').value = '';
        document.getElementById('goalAddNote').value = '';
        this.currentGoalId = goalId;
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('goalAddAmount').focus(), 100);
    },
    
    // ============================================================
    // CONFIRM GOAL ADD
    // ============================================================
    confirmGoalAdd() {
        const amount = parseInt(document.getElementById('goalAddAmount').value);
        const note = document.getElementById('goalAddNote').value.trim();
        
        if (!amount || amount <= 0) {
            UIRenderer.showToast('Nominal harus lebih dari 0', 'error');
            return;
        }
        
        const goal = this.data.goals.find(g => g.id === this.currentGoalId);
        if (!goal) {
            UIRenderer.showToast('Target tidak ditemukan', 'error');
            return;
        }
        
        goal.saved += amount;
        goal.updatedAt = getCurrentDateTime();
        
        // Add transaction record
        this.data.transactions.push({
            id: generateId(),
            type: 'saving',
            amount: amount,
            category: 'savings',
            desc: note || `Tabungan ${goal.name}`,
            date: getCurrentDateTime(),
            goalId: goal.id
        });
        
        this.saveData();
        document.getElementById('goalAddModal').classList.add('hidden');
        UIRenderer.showToast(`💰 ${formatCurrency(amount)} ditambahkan ke ${goal.name}`, 'success');
        this.refreshCurrentPage();
    },
    
    // ============================================================
    // FILTER TRANSACTIONS
    // ============================================================
    filterTransactions(type = null) {
        const searchInput = document.getElementById('txSearchInput');
        const categoryFilter = document.getElementById('txCategoryFilter');
        const sortFilter = document.getElementById('txSortFilter');
        
        if (type) {
            this.filterType = type;
            document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === type);
            });
        }
        
        this.filterCategory = categoryFilter?.value || 'all';
        this.filterSort = sortFilter?.value || 'newest';
        const query = searchInput?.value.toLowerCase() || '';
        
        let filtered = this.data.transactions.slice();
        
        // Type filter
        if (this.filterType !== 'all') {
            filtered = filtered.filter(t => t.type === this.filterType);
        }
        
        // Category filter
        if (this.filterCategory !== 'all') {
            filtered = filtered.filter(t => t.category === this.filterCategory);
        }
        
        // Search
        if (query) {
            filtered = filtered.filter(t => {
                const desc = (t.desc || '').toLowerCase();
                const cat = getCategoryName(t.category).toLowerCase();
                return desc.includes(query) || cat.includes(query) || t.amount.toString().includes(query);
            });
        }
        
        // Sort
        switch(this.filterSort) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'highest':
                filtered.sort((a, b) => b.amount - a.amount);
                break;
            case 'lowest':
                filtered.sort((a, b) => a.amount - b.amount);
                break;
        }
        
        const container = document.getElementById('transactionsList');
        if (!container) return;
        
        const currency = this.data.settings.currency || 'IDR';
        const goals = this.data.goals || [];
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state glass" style="padding:30px 20px;">
                    <div class="empty-icon">📊</div>
                    <div class="empty-title">Tidak ada transaksi</div>
                    <div class="empty-desc">Coba ubah filter atau tambahkan transaksi baru.</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filtered.map(t => 
            UIRenderer.renderTransactionFull(t, currency, goals)
        ).join('');
    },
    
    // ============================================================
    // UPDATE CHART PERIOD
    // ============================================================
    updateChartPeriod(type, months) {
        this.chartPeriod = months;
        
        document.querySelectorAll(`[data-chart="${type}"]`).forEach(btn => {
            btn.classList.toggle('active', btn.textContent.includes(months));
        });
        
        // Re-render analytics
        this.navigateTo('analytics');
    },
    
    // ============================================================
    // SET THEME
    // ============================================================
    setTheme(theme) {
        this.data.settings.theme = theme;
        this.saveData();
        this.applyTheme(theme);
        
        document.querySelectorAll('#settingsModal .settings-row .neon-btn, #settingsModal .settings-body .neon-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.includes(theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'));
        });
    },
    
    applyTheme(theme) {
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.body.classList.toggle('light-mode', !isDark);
    },
    
    // ============================================================
    // SET CURRENCY
    // ============================================================
    setCurrency(code) {
        this.data.settings.currency = code;
        this.saveData();
        this.refreshCurrentPage();
        UIRenderer.showToast(`Mata uang diubah ke ${code}`, 'success');
    },
    
    // ============================================================
    // TOGGLE REMINDERS
    // ============================================================
    toggleReminders(enabled) {
        this.data.settings.reminders = enabled;
        this.saveData();
        UIRenderer.showToast(enabled ? '🔔 Pengingat diaktifkan' : '🔕 Pengingat dinonaktifkan', 'success');
    },
    
    // ============================================================
    // CHECK REMINDERS
    // ============================================================
    checkReminders() {
        if (!this.data.settings.reminders) return;
        
        // Check if any goal is close to completion (>80%)
        const activeGoals = getActiveGoals(this.data.goals);
        const closeGoals = activeGoals.filter(g => calculateGoalProgress(g) >= 80);
        
        closeGoals.forEach(goal => {
            const remaining = goal.target - goal.saved;
            UIRenderer.showToast(
                `🎯 Kamu tinggal ${formatCurrency(remaining, this.data.settings.currency)} lagi untuk mencapai target "${goal.name}"`,
                'warning'
            );
        });
        
        // Daily saving reminder (once per day)
        const today = getToday();
        const todayTxs = this.data.transactions.filter(t => t.date.startsWith(today));
        const hasSaving = todayTxs.some(t => t.type === 'saving');
        
        if (!hasSaving && this.data.goals.length > 0) {
            // Check if we already showed today
            const lastReminder = localStorage.getItem('neonvault_last_reminder');
            if (lastReminder !== today) {
                localStorage.setItem('neonvault_last_reminder', today);
                UIRenderer.showToast('💰 Jangan lupa menabung hari ini!', 'info');
            }
        }
    },
    
    // ============================================================
    // DOWNLOAD BACKUP
    // ============================================================
    downloadBackup() {
        const data = StorageManager.exportData();
        if (!data) {
            UIRenderer.showToast('Gagal membuat backup', 'error');
            return;
        }
        
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neonvault_backup_${getToday()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        UIRenderer.showToast('📥 Backup berhasil didownload', 'success');
    },
    
    // ============================================================
    // RESTORE BACKUP
    // ============================================================
    restoreBackup(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = StorageManager.importData(e.target.result);
                if (success) {
                    this.loadData();
                    this.refreshCurrentPage();
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
    
    // ============================================================
    // OPEN RESET MODAL
    // ============================================================
    openResetModal() {
        const modal = document.getElementById('resetModal');
        if (!modal) return;
        
        document.getElementById('resetConfirmInput').value = '';
        document.getElementById('resetConfirmBtn').disabled = true;
        modal.classList.remove('hidden');
        
        const input = document.getElementById('resetConfirmInput');
        input.oninput = () => {
            document.getElementById('resetConfirmBtn').disabled = input.value.toUpperCase() !== 'HAPUS';
        };
        
        document.getElementById('resetConfirmBtn').onclick = () => {
            this.resetAllData();
        };
    },
    
    // ============================================================
    // RESET ALL DATA
    // ============================================================
    resetAllData() {
        // Create backup before reset
        const backup = StorageManager.exportData();
        if (backup) {
            const blob = new Blob([backup], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `neonvault_backup_before_reset_${getToday()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        const success = StorageManager.resetData();
        if (success) {
            this.loadData();
            document.getElementById('resetModal').classList.add('hidden');
            UIRenderer.showToast('🗑️ Semua data telah direset', 'warning');
            this.navigateTo('dashboard');
        } else {
            UIRenderer.showToast('Gagal reset data', 'error');
        }
    },
    
    // ============================================================
    // REFRESH CURRENT PAGE
    // ============================================================
    refreshCurrentPage() {
        this.navigateTo(this.currentPage);
    },
    
    // ============================================================
    // UPDATE CLOCK
    // ============================================================
    updateClock() {
        const now = new Date();
        const clock = document.getElementById('realTimeClock');
        const date = document.getElementById('realTimeDate');
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
    },
    
    // ============================================================
    // INIT BACKGROUND
    // ============================================================
    initBackground() {
        const canvas = document.getElementById('bgCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let w, h;
        
        const resize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
        
        const particles = [];
        const count = Math.min(50, Math.floor(window.innerWidth / 15));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                r: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.3 + 0.05
            });
        }
        
        let frameId = null;
        
        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Grid
            ctx.strokeStyle = 'rgba(0,229,255,0.02)';
            ctx.lineWidth = 0.5;
            const step = 60;
            for (let x = 0; x < w; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 0; y < h; y += step) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
            
            // Particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(0,229,255,${p.alpha})`;
                ctx.fill();
            });
            
            // Glow
            const grd = ctx.createRadialGradient(w * 0.2, h * 0.2, 10, w * 0.2, h * 0.2, w * 0.6);
            grd.addColorStop(0, 'rgba(124,77,255,0.02)');
            grd.addColorStop(0.5, 'rgba(0,229,255,0.01)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, w, h);
            
            frameId = requestAnimationFrame(draw);
        };
        
        draw();
    },
    
    // ============================================================
    // SETUP EVENT LISTENERS
    // ============================================================
    setupEventListeners() {
        // Transaction modal
        document.getElementById('modalConfirmBtn')?.addEventListener('click', () => this.confirmTransaction());
        document.getElementById('modalType')?.addEventListener('change', (e) => {
            const goalSelect = document.getElementById('modalGoalSelect');
            if (e.target.value === 'saving') {
                goalSelect.classList.remove('hidden');
            } else {
                goalSelect.classList.add('hidden');
            }
        });
        
        // Goal modal
        document.getElementById('goalConfirmBtn')?.addEventListener('click', () => this.confirmGoal());
        
        // Goal add modal
        document.getElementById('goalAddConfirmBtn')?.addEventListener('click', () => this.confirmGoalAdd());
        
        // Color options
        document.querySelectorAll('.color-option').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                el.classList.add('active');
            });
        });
        
        // Settings modal toggle
        document.getElementById('settingsToggle')?.addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('hidden');
            // Update settings UI
            const settings = this.data.settings;
            document.querySelectorAll('#settingsModal .settings-row .neon-btn').forEach(btn => {
                btn.classList.toggle('active', 
                    btn.textContent.includes(settings.theme === 'dark' ? 'Dark' : 
                    settings.theme === 'light' ? 'Light' : 'System')
                );
            });
        });
        
        document.querySelectorAll('#settingsModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('settingsModal').classList.add('hidden');
            });
        });
        
        // Currency selector in settings modal
        document.getElementById('currencySelect')?.addEventListener('change', (e) => {
            this.setCurrency(e.target.value);
        });
        
        // Reminder toggle in settings modal
        document.getElementById('reminderToggle')?.addEventListener('change', (e) => {
            this.toggleReminders(e.target.checked);
        });
        
        // Backup/Restore in settings modal
        document.getElementById('backupBtn')?.addEventListener('click', () => this.downloadBackup());
        document.getElementById('restoreBtn')?.addEventListener('click', () => {
            document.getElementById('restoreFileInput').click();
        });
        document.getElementById('restoreFileInput')?.addEventListener('change', function() {
            App.restoreBackup(this);
        });
        document.getElementById('resetBtn')?.addEventListener('click', () => this.openResetModal());
        
        // Currency selector in settings page
        document.getElementById('currencySelectSettings')?.addEventListener('change', (e) => {
            this.setCurrency(e.target.value);
        });
        
        // Reminder toggle in settings page
        document.getElementById('reminderToggleSettings')?.addEventListener('change', (e) => {
            this.toggleReminders(e.target.checked);
        });
        
        // Restore file input in settings page
        document.getElementById('restoreFileInputSettings')?.addEventListener('change', function() {
            App.restoreBackup(this);
        });
    }
};

// ============================================================
// START APP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize data first
    App.init();
});

// ============================================================
// EXPOSE TO GLOBAL
// ============================================================
window.App = App;