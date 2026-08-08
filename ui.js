/* ============================================================
   ui.js – UI Rendering & DOM Manipulation
   NEONVAULT V2
   ============================================================ */

// ============================================================
// UI RENDERER
// ============================================================
const UIRenderer = {
    currentPage: 'dashboard',
    currentGoalId: null,
    
    // ============================================================
    // RENDER DASHBOARD
    // ============================================================
    renderDashboard(data) {
        const main = document.getElementById('mainContent');
        if (!main) return;
        
        const transactions = data.transactions || [];
        const goals = data.goals || [];
        const settings = data.settings || {};
        const currency = settings.currency || 'IDR';
        
        const totalInc = getTotalIncome(transactions);
        const totalExp = getTotalExpense(transactions);
        const totalSav = getTotalSaving(transactions);
        const balance = getTotalBalance(transactions);
        const totalGoalSavings = getTotalGoalSavings(goals);
        
        // Calculate change
        const lastMonth = getTransactionsByDate(transactions, 30);
        const prevMonth = getTransactionsByDate(transactions, 60);
        const lastBalance = getTotalBalance(lastMonth);
        const prevBalance = getTotalBalance(prevMonth);
        const change = prevBalance > 0 ? ((lastBalance - prevBalance) / prevBalance) * 100 : 0;
        
        const recentTxs = transactions.slice().sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        ).slice(0, 5);
        
        const activeGoals = getActiveGoals(goals).slice(0, 3);
        
        main.innerHTML = `
            <div class="page-container active" data-page="dashboard">
                <div class="dashboard-grid">
                    <!-- Balance Card -->
                    <div class="balance-card glass">
                        <div class="balance-label">TOTAL SALDO</div>
                        <div class="balance-amount" id="balanceAmount">${formatCurrency(balance, currency)}</div>
                        <div class="balance-change ${change >= 0 ? '' : 'negative'}">
                            ${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}% bulan ini
                        </div>
                        <div class="balance-stats">
                            <div class="balance-stat">
                                <div class="stat-label">Pemasukan</div>
                                <div class="stat-value income">${formatCurrency(totalInc, currency)}</div>
                            </div>
                            <div class="balance-stat">
                                <div class="stat-label">Pengeluaran</div>
                                <div class="stat-value expense">${formatCurrency(totalExp, currency)}</div>
                            </div>
                            <div class="balance-stat">
                                <div class="stat-label">Tabungan</div>
                                <div class="stat-value savings">${formatCurrency(totalSav + totalGoalSavings, currency)}</div>
                            </div>
                        </div>
                        <div class="balance-actions">
                            <button class="neon-btn primary" onclick="App.openTransactionModal('income')">+ Tambah Uang</button>
                            <button class="neon-btn danger" onclick="App.openTransactionModal('expense')">− Ambil Uang</button>
                            <button class="neon-btn" onclick="App.openTransactionModal('saving')">💰 Menabung</button>
                        </div>
                    </div>
                    
                    <!-- Quick Stats -->
                    <div class="quick-stats">
                        <div class="quick-stat glass">
                            <div class="stat-number">${transactions.length}</div>
                            <div class="stat-label">Total Transaksi</div>
                        </div>
                        <div class="quick-stat glass">
                            <div class="stat-number">${goals.length}</div>
                            <div class="stat-label">Total Target</div>
                        </div>
                        <div class="quick-stat glass">
                            <div class="stat-number">${getCompletedGoals(goals).length}</div>
                            <div class="stat-label">Target Tercapai</div>
                        </div>
                        <div class="quick-stat glass">
                            <div class="stat-number">${getActiveGoals(goals).length}</div>
                            <div class="stat-label">Target Aktif</div>
                        </div>
                    </div>
                    
                    <!-- Goals Section -->
                    <div class="goals-section glass">
                        <div class="section-header">
                            <div class="section-title">🎯 Target Tabungan</div>
                            <span class="section-link" onclick="App.navigateTo('goals')">Lihat Semua →</span>
                        </div>
                        <div id="miniGoals">
                            ${activeGoals.length > 0 ? activeGoals.map(g => this.renderMiniGoal(g, currency)).join('') : `
                                <div class="empty-state">
                                    <div class="empty-icon">🎯</div>
                                    <div class="empty-title">Belum ada target tabungan</div>
                                    <div class="empty-desc">Mulai buat target pertamamu dan pantau progresnya.</div>
                                    <button class="neon-btn primary" onclick="App.openGoalModal()">+ Buat Target</button>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Recent Transactions -->
                    <div class="transactions-section glass">
                        <div class="section-header">
                            <div class="section-title">📊 Transaksi Terbaru</div>
                            <span class="section-link" onclick="App.navigateTo('transactions')">Lihat Semua →</span>
                        </div>
                        <div id="recentTransactions">
                            ${recentTxs.length > 0 ? recentTxs.map(t => this.renderTransactionItem(t, currency)).join('') : `
                                <div class="empty-state">
                                    <div class="empty-icon">📊</div>
                                    <div class="empty-title">Belum ada transaksi</div>
                                    <div class="empty-desc">Catat pemasukan atau pengeluaran pertamamu.</div>
                                    <button class="neon-btn primary" onclick="App.openTransactionModal('income')">+ Tambah Transaksi</button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ============================================================
    // RENDER MINI GOAL
    // ============================================================
    renderMiniGoal(goal, currency) {
        const progress = calculateGoalProgress(goal);
        const isCompleted = isGoalCompleted(goal);
        const remaining = goal.target - goal.saved;
        
        return `
            <div class="goal-item" onclick="App.navigateTo('goals')">
                <div class="goal-header">
                    <span class="goal-name">${goal.icon || '🎯'} ${goal.name}</span>
                    <span class="goal-amount">${formatCurrency(goal.saved, currency)} / ${formatCurrency(goal.target, currency)}</span>
                </div>
                <div class="goal-progress">
                    <div class="goal-fill" style="width:${progress}%;background:${goal.color || '#00e5ff'}"></div>
                </div>
                <div class="goal-footer">
                    <span>${Math.round(progress)}%</span>
                    <span class="goal-status ${isCompleted ? 'completed' : ''}">
                        ${isCompleted ? '✅ Tercapai' : remaining > 0 ? `Sisa ${formatCurrency(remaining, currency)}` : 'Selesai'}
                    </span>
                </div>
            </div>
        `;
    },
    
    // ============================================================
    // RENDER TRANSACTION ITEM
    // ============================================================
    renderTransactionItem(t, currency) {
        const isIncome = t.type === 'income';
        const isExpense = t.type === 'expense';
        const isSaving = t.type === 'saving';
        const icon = getCategoryIcon(t.category);
        const categoryName = getCategoryName(t.category);
        const amountClass = isIncome ? 'income' : (isExpense ? 'expense' : 'saving');
        const sign = isIncome ? '+' : (isExpense ? '-' : '');
        
        return `
            <div class="transaction-item">
                <span class="tx-icon">${icon}</span>
                <div class="tx-info">
                    <div class="tx-title">${sanitizeString(t.desc || categoryName)}</div>
                    <div class="tx-meta">${formatDate(t.date)} · ${categoryName}</div>
                </div>
                <div class="tx-amount ${amountClass}">${sign} ${formatCurrency(t.amount, currency)}</div>
            </div>
        `;
    },
    
    // ============================================================
    // RENDER GOALS PAGE
    // ============================================================
    renderGoals(data) {
        const main = document.getElementById('mainContent');
        if (!main) return;
        
        const goals = data.goals || [];
        const currency = data.settings?.currency || 'IDR';
        const activeGoals = getActiveGoals(goals);
        const completedGoals = getCompletedGoals(goals);
        
        main.innerHTML = `
            <div class="page-container active" data-page="goals">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
                    <div class="section-title" style="font-size:1.2rem;">🎯 Target Tabungan</div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                        <span style="color:#88a0b8;font-size:0.8rem;">Aktif: ${activeGoals.length} | Selesai: ${completedGoals.length}</span>
                        <button class="neon-btn primary small" onclick="App.openGoalModal()">+ Buat Target</button>
                    </div>
                </div>
                
                ${goals.length === 0 ? `
                    <div class="empty-state glass" style="padding:40px 20px;">
                        <div class="empty-icon">🎯</div>
                        <div class="empty-title">Belum ada target tabungan</div>
                        <div class="empty-desc">Mulai buat target pertamamu dan pantau progresnya.</div>
                        <button class="neon-btn primary" onclick="App.openGoalModal()">+ Buat Target</button>
                    </div>
                ` : `
                    <div class="goals-grid">
                        ${goals.map(g => this.renderGoalCard(g, currency)).join('')}
                    </div>
                `}
            </div>
        `;
    },
    
    // ============================================================
    // RENDER GOAL CARD
    // ============================================================
    renderGoalCard(goal, currency) {
        const progress = calculateGoalProgress(goal);
        const isCompleted = isGoalCompleted(goal);
        const remaining = Math.max(0, goal.target - goal.saved);
        const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        
        return `
            <div class="goal-card ${isCompleted ? 'completed' : ''}" style="border-color:${isCompleted ? 'rgba(0,255,136,0.3)' : goal.color || '#00e5ff'}44;">
                <div class="goal-card-header">
                    <div>
                        <div class="goal-card-icon">${goal.icon || '🎯'}</div>
                        <div class="goal-card-name">${sanitizeString(goal.name)}</div>
                    </div>
                    <span style="font-size:0.7rem;color:#88a0b8;">${isCompleted ? '✅ Selesai' : '🔄 Aktif'}</span>
                </div>
                <div class="goal-card-amount">
                    ${formatCurrency(goal.saved, currency)} / ${formatCurrency(goal.target, currency)}
                </div>
                <div class="goal-card-progress">
                    <div class="goal-fill" style="width:${progress}%;background:${goal.color || '#00e5ff'}"></div>
                </div>
                <div class="goal-card-footer">
                    <span>${Math.round(progress)}%</span>
                    ${goal.deadline ? `<span>${daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} hari lagi` : 'Lewat deadline') : 'Tanpa deadline'}</span>` : '<span>Tanpa deadline</span>'}
                    ${!isCompleted ? `<span>Sisa ${formatCurrency(remaining, currency)}</span>` : ''}
                </div>
                ${goal.note ? `<div style="font-size:0.7rem;color:#88a0b8;margin-top:6px;">📝 ${sanitizeString(goal.note)}</div>` : ''}
                <div class="goal-card-actions">
                    <button class="neon-btn primary small" onclick="App.openGoalAddModal('${goal.id}')">💰 Tambah</button>
                    <button class="neon-btn small" onclick="App.openGoalModal('${goal.id}')">✏️ Edit</button>
                    <button class="neon-btn danger small" onclick="App.deleteGoal('${goal.id}')">🗑️</button>
                </div>
            </div>
        `;
    },
    
    // ============================================================
    // RENDER TRANSACTIONS PAGE
    // ============================================================
    renderTransactions(data) {
        const main = document.getElementById('mainContent');
        if (!main) return;
        
        const transactions = data.transactions || [];
        const currency = data.settings?.currency || 'IDR';
        const categories = data.categories || [];
        const goals = data.goals || [];
        
        const sorted = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        
        main.innerHTML = `
            <div class="page-container active" data-page="transactions">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
                    <div class="section-title" style="font-size:1.2rem;">📊 Riwayat Transaksi</div>
                    <button class="neon-btn primary small" onclick="App.openTransactionModal('income')">+ Tambah</button>
                </div>
                
                <div class="transactions-toolbar">
                    <div class="search-box" style="position:relative;">
                        <input type="text" id="txSearchInput" placeholder="Cari transaksi..." oninput="App.filterTransactions()" />
                        <span class="search-icon" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:0.4;">🔍</span>
                    </div>
                    <div class="filter-group">
                        <button class="filter-btn active" data-filter="all" onclick="App.filterTransactions('all')">Semua</button>
                        <button class="filter-btn" data-filter="income" onclick="App.filterTransactions('income')">Pemasukan</button>
                        <button class="filter-btn" data-filter="expense" onclick="App.filterTransactions('expense')">Pengeluaran</button>
                        <button class="filter-btn" data-filter="saving" onclick="App.filterTransactions('saving')">Tabungan</button>
                    </div>
                    <div class="filter-group">
                        <select id="txCategoryFilter" onchange="App.filterTransactions()" style="background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,255,0.1);border-radius:40px;padding:4px 12px;color:#fff;font-family:'Rajdhani',sans-serif;">
                            <option value="all">Semua Kategori</option>
                            ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <select id="txSortFilter" onchange="App.filterTransactions()" style="background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,255,0.1);border-radius:40px;padding:4px 12px;color:#fff;font-family:'Rajdhani',sans-serif;">
                            <option value="newest">Terbaru</option>
                            <option value="oldest">Terlama</option>
                            <option value="highest">Nominal Terbesar</option>
                            <option value="lowest">Nominal Terkecil</option>
                        </select>
                    </div>
                </div>
                
                <div id="transactionsList" class="transactions-list">
                    ${sorted.length === 0 ? `
                        <div class="empty-state glass" style="padding:30px 20px;">
                            <div class="empty-icon">📊</div>
                            <div class="empty-title">Belum ada transaksi</div>
                            <div class="empty-desc">Catat pemasukan atau pengeluaran pertamamu.</div>
                            <button class="neon-btn primary" onclick="App.openTransactionModal('income')">+ Tambah Transaksi</button>
                        </div>
                    ` : sorted.map(t => this.renderTransactionFull(t, currency, goals)).join('')}
                </div>
            </div>
        `;
    },
    
    // ============================================================
    // RENDER TRANSACTION FULL
    // ============================================================
    renderTransactionFull(t, currency, goals) {
        const isIncome = t.type === 'income';
        const isExpense = t.type === 'expense';
        const isSaving = t.type === 'saving';
        const icon = getCategoryIcon(t.category);
        const categoryName = getCategoryName(t.category);
        const amountClass = isIncome ? 'income' : (isExpense ? 'expense' : 'saving');
        const sign = isIncome ? '+' : (isExpense ? '-' : '');
        const goalName = t.goalId ? getGoalName(t.goalId, goals) : '';
        
        return `
            <div class="transaction-item-full" data-id="${t.id}">
                <span class="tx-icon">${icon}</span>
                <div class="tx-info">
                    <div class="tx-title">${sanitizeString(t.desc || categoryName)}</div>
                    <div class="tx-category">${categoryName}${goalName ? ` → ${goalName}` : ''}</div>
                    <div class="tx-date">${formatDateTime(t.date)}</div>
                </div>
                <div class="tx-amount ${amountClass}">${sign} ${formatCurrency(t.amount, currency)}</div>
            </div>
        `;
    },
    
    // ============================================================
    // RENDER ANALYTICS PAGE
    // ============================================================
    renderAnalytics(data) {
        const main = document.getElementById('mainContent');
        if (!main) return;
        
        const transactions = data.transactions || [];
        const goals = data.goals || [];
        const currency = data.settings?.currency || 'IDR';
        
        const totalInc = getTotalIncome(transactions);
        const totalExp = getTotalExpense(transactions);
        const totalSav = getTotalSaving(transactions);
        const balance = getTotalBalance(transactions);
        const totalGoalSavings = getTotalGoalSavings(goals);
        
        const dailyAvg = getDailyAverage(transactions, 30);
        const monthlyAvg = dailyAvg * 30;
        const savingRate = getSavingRate(transactions, 30);
        const insights = generateInsights(transactions, goals);
        
        const monthlyData = getMonthlyTrend(transactions, 6);
        const categoryData = getCategoryBreakdown(transactions, 'expense');
        
        // Prepare chart data
        const balanceData = monthlyData.map(d => ({
            label: d.month,
            value: d.balance
        }));
        
        const incomeData = monthlyData.map(d => ({
            label: d.month,
            value: d.income
        }));
        
        const expenseData = monthlyData.map(d => ({
            label: d.month,
            value: d.expense
        }));
        
        const pieData = categoryData.map(d => ({
            label: d.name,
            value: d.amount,
            color: d.percentage > 10 ? '#00e5ff' : '#7c4dff'
        }));
        
        main.innerHTML = `
            <div class="page-container active" data-page="analytics">
                <div class="section-title" style="font-size:1.2rem;margin-bottom:16px;">📈 Financial Analytics</div>
                
                <!-- Stats -->
                <div class="analytics-insights" style="margin-bottom:16px;">
                    <div class="insight-card glass">
                        <div class="insight-value">${formatCurrency(totalSav + totalGoalSavings, currency)}</div>
                        <div class="insight-label">Total Tabungan</div>
                    </div>
                    <div class="insight-card glass">
                        <div class="insight-value">${formatCurrency(monthlyAvg, currency)}</div>
                        <div class="insight-label">Rata-rata / Bulan</div>
                    </div>
                    <div class="insight-card glass">
                        <div class="insight-value">${getActiveGoals(goals).length}</div>
                        <div class="insight-label">Target Aktif</div>
                    </div>
                    <div class="insight-card glass">
                        <div class="insight-value">${getCompletedGoals(goals).length}</div>
                        <div class="insight-label">Target Tercapai</div>
                    </div>
                </div>
                
                <!-- Balance Chart -->
                <div class="glass" style="margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                        <span style="font-weight:600;">📊 Perkembangan Saldo</span>
                        <div style="display:flex;gap:6px;">
                            <button class="filter-btn active" data-chart="balance" onclick="App.updateChartPeriod('balance', 6)">6 Bulan</button>
                            <button class="filter-btn" data-chart="balance" onclick="App.updateChartPeriod('balance', 3)">3 Bulan</button>
                            <button class="filter-btn" data-chart="balance" onclick="App.updateChartPeriod('balance', 1)">1 Bulan</button>
                        </div>
                    </div>
                    <div class="analytics-chart">
                        <canvas id="balanceChart"></canvas>
                    </div>
                </div>
                
                <!-- Income vs Expense -->
                <div class="analytics-grid" style="margin-bottom:16px;">
                    <div class="glass full-width">
                        <div style="font-weight:600;margin-bottom:8px;">📊 Pemasukan vs Pengeluaran</div>
                        <div class="analytics-chart" style="height:150px;">
                            <canvas id="incomeExpenseChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Category Breakdown -->
                <div class="analytics-grid">
                    <div class="glass">
                        <div style="font-weight:600;margin-bottom:8px;">📊 Kategori Pengeluaran</div>
                        <div class="analytics-chart" style="height:180px;">
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                    <div class="glass">
                        <div style="font-weight:600;margin-bottom:8px;">💡 Insight Keuangan</div>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            ${insights.map(i => `
                                <div style="padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:12px;border-left:3px solid ${i.type === 'warning' ? '#ff4d6d' : i.type === 'positive' ? '#00ff88' : '#00e5ff'};">
                                    <span style="font-size:0.85rem;">${i.message}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Render charts after DOM update
        setTimeout(() => {
            ChartRenderer.drawLineChart('balanceChart', balanceData, { height: 200 });
            ChartRenderer.drawBarChart('incomeExpenseChart', [
                ...incomeData.map(d => ({ label: d.label, value: d.value })),
                ...expenseData.map(d => ({ label: d.label, value: -d.value }))
            ], { height: 150 });
            ChartRenderer.drawDoughnutChart('categoryChart', pieData);
        }, 100);
    },
    
    // ============================================================
    // RENDER SETTINGS
    // ============================================================
    renderSettings(data) {
        const main = document.getElementById('mainContent');
        if (!main) return;
        
        const settings = data.settings || {};
        const currency = settings.currency || 'IDR';
        
        main.innerHTML = `
            <div class="page-container active" data-page="settings">
                <div class="section-title" style="font-size:1.2rem;margin-bottom:16px;">⚙️ Pengaturan</div>
                
                <div class="glass" style="margin-bottom:12px;">
                    <h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tampilan</h4>
                    <div class="settings-row">
                        <button class="neon-btn small ${settings.theme === 'dark' ? 'active' : ''}" onclick="App.setTheme('dark')">🌙 Dark</button>
                        <button class="neon-btn small ${settings.theme === 'light' ? 'active' : ''}" onclick="App.setTheme('light')">☀️ Light</button>
                        <button class="neon-btn small ${settings.theme === 'system' ? 'active' : ''}" onclick="App.setTheme('system')">🖥️ System</button>
                    </div>
                </div>
                
                <div class="glass" style="margin-bottom:12px;">
                    <h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Mata Uang</h4>
                    <select id="currencySelectSettings" class="modal-select" style="max-width:200px;" onchange="App.setCurrency(this.value)">
                        ${Object.keys(CURRENCIES).map(c => `
                            <option value="${c}" ${c === currency ? 'selected' : ''}>${CURRENCIES[c].symbol} - ${c}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="glass" style="margin-bottom:12px;">
                    <h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Notifikasi</h4>
                    <div class="settings-row">
                        <label class="toggle-switch">
                            <input type="checkbox" id="reminderToggleSettings" ${settings.reminders ? 'checked' : ''} onchange="App.toggleReminders(this.checked)" />
                            <span class="toggle-slider"></span>
                            <span style="margin-left:10px;">Aktifkan Pengingat</span>
                        </label>
                    </div>
                </div>
                
                <div class="glass" style="margin-bottom:12px;">
                    <h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Data</h4>
                    <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px;">
                        <button class="neon-btn small" onclick="App.downloadBackup()">📥 Download Backup</button>
                        <button class="neon-btn small" onclick="document.getElementById('restoreFileInputSettings').click()">📤 Restore Backup</button>
                        <input type="file" id="restoreFileInputSettings" accept=".json" style="display:none" onchange="App.restoreBackup(this)" />
                        <button class="neon-btn danger small" onclick="App.openResetModal()">🗑️ Reset Semua Data</button>
                    </div>
                </div>
                
                <div class="glass">
                    <h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tentang</h4>
                    <p style="color:#e0f0ff;font-weight:600;">NEONVAULT ${APP_VERSION}</p>
                    <p style="color:#88a0b8;font-size:0.85rem;">Personal Savings Manager</p>
                    <p style="color:#88a0b8;font-size:0.75rem;margin-top:4px;">🔒 Data tersimpan secara lokal di perangkat ini</p>
                    <p style="color:#88a0b8;font-size:0.7rem;margin-top:2px;">⚠️ Jika browser atau data situs dihapus, data tabungan dapat ikut terhapus.</p>
                </div>
            </div>
        `;
    },
    
    // ============================================================
    // SHOW TOAST
    // ============================================================
    showToast(message, type = 'success', undoCallback = null) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            ${undoCallback ? `<button class="toast-undo" onclick="this.closest('.toast').remove(); ${undoCallback}()">UNDO</button>` : ''}
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// ============================================================
// EXPORTS
// ============================================================
window.UIRenderer = UIRenderer;