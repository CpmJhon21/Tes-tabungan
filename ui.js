/* ============================================================
   ui.js – UI Rendering & DOM Manipulation
   NEONVAULT V2
   ============================================================ */

var UIRenderer = {
    currentPage: 'dashboard',
    currentGoalId: null,
    
    renderDashboard: function(data) {
        var main = document.getElementById('mainContent');
        if (!main) return;
        
        var transactions = data.transactions || [];
        var goals = data.goals || [];
        var settings = data.settings || {};
        var currency = settings.currency || 'IDR';
        
        var totalInc = getTotalIncome(transactions);
        var totalExp = getTotalExpense(transactions);
        var totalSav = getTotalSaving(transactions);
        var balance = getTotalBalance(transactions);
        var totalGoalSavings = getTotalGoalSavings(goals);
        
        var recentTxs = transactions.slice().sort(function(a, b) {
            return new Date(b.date) - new Date(a.date);
        }).slice(0, 5);
        
        var activeGoals = getActiveGoals(goals).slice(0, 3);
        
        main.innerHTML = 
            '<div class="page-container active" data-page="dashboard">' +
                '<div class="dashboard-grid">' +
                    // Balance Card
                    '<div class="balance-card glass">' +
                        '<div class="balance-label">TOTAL SALDO</div>' +
                        '<div class="balance-amount" id="balanceAmount">' + formatCurrency(balance, currency) + '</div>' +
                        '<div class="balance-stats">' +
                            '<div class="balance-stat">' +
                                '<div class="stat-label">Pemasukan</div>' +
                                '<div class="stat-value income">' + formatCurrency(totalInc, currency) + '</div>' +
                            '</div>' +
                            '<div class="balance-stat">' +
                                '<div class="stat-label">Pengeluaran</div>' +
                                '<div class="stat-value expense">' + formatCurrency(totalExp, currency) + '</div>' +
                            '</div>' +
                            '<div class="balance-stat">' +
                                '<div class="stat-label">Tabungan</div>' +
                                '<div class="stat-value savings">' + formatCurrency(totalSav + totalGoalSavings, currency) + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="balance-actions">' +
                            '<button class="neon-btn primary" onclick="App.openTransactionModal(\'income\')">+ Tambah Uang</button>' +
                            '<button class="neon-btn danger" onclick="App.openTransactionModal(\'expense\')">− Ambil Uang</button>' +
                            '<button class="neon-btn" onclick="App.openTransactionModal(\'saving\')">💰 Menabung</button>' +
                        '</div>' +
                    '</div>' +
                    
                    // Quick Stats
                    '<div class="quick-stats">' +
                        '<div class="quick-stat glass">' +
                            '<div class="stat-number">' + transactions.length + '</div>' +
                            '<div class="stat-label">Total Transaksi</div>' +
                        '</div>' +
                        '<div class="quick-stat glass">' +
                            '<div class="stat-number">' + goals.length + '</div>' +
                            '<div class="stat-label">Total Target</div>' +
                        '</div>' +
                        '<div class="quick-stat glass">' +
                            '<div class="stat-number">' + getCompletedGoals(goals).length + '</div>' +
                            '<div class="stat-label">Target Tercapai</div>' +
                        '</div>' +
                        '<div class="quick-stat glass">' +
                            '<div class="stat-number">' + getActiveGoals(goals).length + '</div>' +
                            '<div class="stat-label">Target Aktif</div>' +
                        '</div>' +
                    '</div>' +
                    
                    // Goals Section
                    '<div class="goals-section glass">' +
                        '<div class="section-header">' +
                            '<div class="section-title">🎯 Target Tabungan</div>' +
                            '<span class="section-link" onclick="App.navigateTo(\'goals\')">Lihat Semua →</span>' +
                        '</div>' +
                        '<div id="miniGoals">' +
                            (activeGoals.length > 0 ? activeGoals.map(function(g) {
                                return UIRenderer.renderMiniGoal(g, currency);
                            }).join('') : 
                            '<div class="empty-state">' +
                                '<div class="empty-icon">🎯</div>' +
                                '<div class="empty-title">Belum ada target tabungan</div>' +
                                '<div class="empty-desc">Mulai buat target pertamamu dan pantau progresnya.</div>' +
                                '<button class="neon-btn primary" onclick="App.openGoalModal()">+ Buat Target</button>' +
                            '</div>') +
                        '</div>' +
                    '</div>' +
                    
                    // Recent Transactions
                    '<div class="transactions-section glass">' +
                        '<div class="section-header">' +
                            '<div class="section-title">📊 Transaksi Terbaru</div>' +
                            '<span class="section-link" onclick="App.navigateTo(\'transactions\')">Lihat Semua →</span>' +
                        '</div>' +
                        '<div id="recentTransactions">' +
                            (recentTxs.length > 0 ? recentTxs.map(function(t) {
                                return UIRenderer.renderTransactionItem(t, currency);
                            }).join('') :
                            '<div class="empty-state">' +
                                '<div class="empty-icon">📊</div>' +
                                '<div class="empty-title">Belum ada transaksi</div>' +
                                '<div class="empty-desc">Catat pemasukan atau pengeluaran pertamamu.</div>' +
                                '<button class="neon-btn primary" onclick="App.openTransactionModal(\'income\')">+ Tambah Transaksi</button>' +
                            '</div>') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    },
    
    renderMiniGoal: function(goal, currency) {
        var progress = calculateGoalProgress(goal);
        var isCompleted = isGoalCompleted(goal);
        var remaining = goal.target - goal.saved;
        
        return '<div class="goal-item" onclick="App.navigateTo(\'goals\')">' +
            '<div class="goal-header">' +
                '<span class="goal-name">' + (goal.icon || '🎯') + ' ' + goal.name + '</span>' +
                '<span class="goal-amount">' + formatCurrency(goal.saved, currency) + ' / ' + formatCurrency(goal.target, currency) + '</span>' +
            '</div>' +
            '<div class="goal-progress">' +
                '<div class="goal-fill" style="width:' + progress + '%;background:' + (goal.color || '#00e5ff') + '"></div>' +
            '</div>' +
            '<div class="goal-footer">' +
                '<span>' + Math.round(progress) + '%</span>' +
                '<span class="goal-status ' + (isCompleted ? 'completed' : '') + '">' +
                    (isCompleted ? '✅ Tercapai' : remaining > 0 ? 'Sisa ' + formatCurrency(remaining, currency) : 'Selesai') +
                '</span>' +
            '</div>' +
        '</div>';
    },
    
    renderTransactionItem: function(t, currency) {
        var isIncome = t.type === 'income';
        var isExpense = t.type === 'expense';
        var isSaving = t.type === 'saving';
        var icon = getCategoryIcon(t.category);
        var categoryName = getCategoryName(t.category);
        var amountClass = isIncome ? 'income' : (isExpense ? 'expense' : 'saving');
        var sign = isIncome ? '+' : (isExpense ? '-' : '');
        
        return '<div class="transaction-item">' +
            '<span class="tx-icon">' + icon + '</span>' +
            '<div class="tx-info">' +
                '<div class="tx-title">' + sanitizeString(t.desc || categoryName) + '</div>' +
                '<div class="tx-meta">' + formatDate(t.date) + ' · ' + categoryName + '</div>' +
            '</div>' +
            '<div class="tx-amount ' + amountClass + '">' + sign + ' ' + formatCurrency(t.amount, currency) + '</div>' +
        '</div>';
    },
    
    renderGoals: function(data) {
        var main = document.getElementById('mainContent');
        if (!main) return;
        
        var goals = data.goals || [];
        var currency = data.settings?.currency || 'IDR';
        var activeGoals = getActiveGoals(goals);
        var completedGoals = getCompletedGoals(goals);
        
        main.innerHTML = 
            '<div class="page-container active" data-page="goals">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
                    '<div class="section-title" style="font-size:1.2rem;">🎯 Target Tabungan</div>' +
                    '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                        '<span style="color:#88a0b8;font-size:0.8rem;">Aktif: ' + activeGoals.length + ' | Selesai: ' + completedGoals.length + '</span>' +
                        '<button class="neon-btn primary small" onclick="App.openGoalModal()">+ Buat Target</button>' +
                    '</div>' +
                '</div>' +
                (goals.length === 0 ? 
                '<div class="empty-state glass" style="padding:40px 20px;">' +
                    '<div class="empty-icon">🎯</div>' +
                    '<div class="empty-title">Belum ada target tabungan</div>' +
                    '<div class="empty-desc">Mulai buat target pertamamu dan pantau progresnya.</div>' +
                    '<button class="neon-btn primary" onclick="App.openGoalModal()">+ Buat Target</button>' +
                '</div>' :
                '<div class="goals-grid">' +
                    goals.map(function(g) { return UIRenderer.renderGoalCard(g, currency); }).join('') +
                '</div>') +
            '</div>';
    },
    
    renderGoalCard: function(goal, currency) {
        var progress = calculateGoalProgress(goal);
        var isCompleted = isGoalCompleted(goal);
        var remaining = Math.max(0, goal.target - goal.saved);
        var daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        
        return '<div class="goal-card ' + (isCompleted ? 'completed' : '') + '" style="border-color:' + (isCompleted ? 'rgba(0,255,136,0.3)' : (goal.color || '#00e5ff') + '44') + ';">' +
            '<div class="goal-card-header">' +
                '<div>' +
                    '<div class="goal-card-icon">' + (goal.icon || '🎯') + '</div>' +
                    '<div class="goal-card-name">' + sanitizeString(goal.name) + '</div>' +
                '</div>' +
                '<span style="font-size:0.7rem;color:#88a0b8;">' + (isCompleted ? '✅ Selesai' : '🔄 Aktif') + '</span>' +
            '</div>' +
            '<div class="goal-card-amount">' +
                formatCurrency(goal.saved, currency) + ' / ' + formatCurrency(goal.target, currency) +
            '</div>' +
            '<div class="goal-card-progress">' +
                '<div class="goal-fill" style="width:' + progress + '%;background:' + (goal.color || '#00e5ff') + '"></div>' +
            '</div>' +
            '<div class="goal-card-footer">' +
                '<span>' + Math.round(progress) + '%</span>' +
                (goal.deadline ? '<span>' + (daysLeft !== null ? (daysLeft > 0 ? daysLeft + ' hari lagi' : 'Lewat deadline') : 'Tanpa deadline') + '</span>' : '<span>Tanpa deadline</span>') +
                (!isCompleted ? '<span>Sisa ' + formatCurrency(remaining, currency) + '</span>' : '') +
            '</div>' +
            (goal.note ? '<div style="font-size:0.7rem;color:#88a0b8;margin-top:6px;">📝 ' + sanitizeString(goal.note) + '</div>' : '') +
            '<div class="goal-card-actions">' +
                '<button class="neon-btn primary small" onclick="App.openGoalAddModal(\'' + goal.id + '\')">💰 Tambah</button>' +
                '<button class="neon-btn small" onclick="App.openGoalModal(\'' + goal.id + '\')">✏️ Edit</button>' +
                '<button class="neon-btn danger small" onclick="App.deleteGoal(\'' + goal.id + '\')">🗑️</button>' +
            '</div>' +
        '</div>';
    },
    
    renderTransactions: function(data) {
        var main = document.getElementById('mainContent');
        if (!main) return;
        
        var transactions = data.transactions || [];
        var currency = data.settings?.currency || 'IDR';
        var categories = data.categories || [];
        var goals = data.goals || [];
        
        var sorted = transactions.slice().sort(function(a, b) {
            return new Date(b.date) - new Date(a.date);
        });
        
        main.innerHTML = 
            '<div class="page-container active" data-page="transactions">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
                    '<div class="section-title" style="font-size:1.2rem;">📊 Riwayat Transaksi</div>' +
                    '<button class="neon-btn primary small" onclick="App.openTransactionModal(\'income\')">+ Tambah</button>' +
                '</div>' +
                '<div class="transactions-toolbar">' +
                    '<div class="search-box" style="position:relative;flex:1;min-width:160px;">' +
                        '<input type="text" id="txSearchInput" placeholder="Cari transaksi..." oninput="App.filterTransactions()" style="width:100%;padding:8px 14px 8px 36px;border-radius:40px;background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,255,0.15);color:#fff;outline:none;font-family:Rajdhani,sans-serif;font-size:0.85rem;" />' +
                        '<span class="search-icon" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:0.4;">🔍</span>' +
                    '</div>' +
                    '<div class="filter-group" style="display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button class="filter-btn active" data-filter="all" onclick="App.filterTransactions(\'all\')" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:#88a0b8;padding:4px 14px;border-radius:40px;cursor:pointer;font-family:Rajdhani,sans-serif;font-size:0.75rem;transition:0.3s;">Semua</button>' +
                        '<button class="filter-btn" data-filter="income" onclick="App.filterTransactions(\'income\')" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:#88a0b8;padding:4px 14px;border-radius:40px;cursor:pointer;font-family:Rajdhani,sans-serif;font-size:0.75rem;transition:0.3s;">Pemasukan</button>' +
                        '<button class="filter-btn" data-filter="expense" onclick="App.filterTransactions(\'expense\')" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:#88a0b8;padding:4px 14px;border-radius:40px;cursor:pointer;font-family:Rajdhani,sans-serif;font-size:0.75rem;transition:0.3s;">Pengeluaran</button>' +
                        '<button class="filter-btn" data-filter="saving" onclick="App.filterTransactions(\'saving\')" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:#88a0b8;padding:4px 14px;border-radius:40px;cursor:pointer;font-family:Rajdhani,sans-serif;font-size:0.75rem;transition:0.3s;">Tabungan</button>' +
                    '</div>' +
                    '<div class="filter-group">' +
                        '<select id="txCategoryFilter" onchange="App.filterTransactions()" style="background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,255,0.1);border-radius:40px;padding:4px 12px;color:#fff;font-family:Rajdhani,sans-serif;">' +
                            '<option value="all">Semua Kategori</option>' +
                            categories.map(function(c) { return '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>'; }).join('') +
                        '</select>' +
                    '</div>' +
                    '<div class="filter-group">' +
                        '<select id="txSortFilter" onchange="App.filterTransactions()" style="background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,255,0.1);border-radius:40px;padding:4px 12px;color:#fff;font-family:Rajdhani,sans-serif;">' +
                            '<option value="newest">Terbaru</option>' +
                            '<option value="oldest">Terlama</option>' +
                            '<option value="highest">Nominal Terbesar</option>' +
                            '<option value="lowest">Nominal Terkecil</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div id="transactionsList" class="transactions-list">' +
                    (sorted.length === 0 ?
                    '<div class="empty-state glass" style="padding:30px 20px;">' +
                        '<div class="empty-icon">📊</div>' +
                        '<div class="empty-title">Belum ada transaksi</div>' +
                        '<div class="empty-desc">Catat pemasukan atau pengeluaran pertamamu.</div>' +
                        '<button class="neon-btn primary" onclick="App.openTransactionModal(\'income\')">+ Tambah Transaksi</button>' +
                    '</div>' :
                    sorted.map(function(t) { return UIRenderer.renderTransactionFull(t, currency, goals); }).join('')) +
                '</div>' +
            '</div>';
    },
    
    renderTransactionFull: function(t, currency, goals) {
        var isIncome = t.type === 'income';
        var isExpense = t.type === 'expense';
        var isSaving = t.type === 'saving';
        var icon = getCategoryIcon(t.category);
        var categoryName = getCategoryName(t.category);
        var amountClass = isIncome ? 'income' : (isExpense ? 'expense' : 'saving');
        var sign = isIncome ? '+' : (isExpense ? '-' : '');
        var goalName = t.goalId ? getGoalName(t.goalId, goals) : '';
        
        return '<div class="transaction-item-full" data-id="' + t.id + '">' +
            '<span class="tx-icon">' + icon + '</span>' +
            '<div class="tx-info">' +
                '<div class="tx-title">' + sanitizeString(t.desc || categoryName) + '</div>' +
                '<div class="tx-category">' + categoryName + (goalName ? ' → ' + goalName : '') + '</div>' +
                '<div class="tx-date">' + formatDateTime(t.date) + '</div>' +
            '</div>' +
            '<div class="tx-amount ' + amountClass + '">' + sign + ' ' + formatCurrency(t.amount, currency) + '</div>' +
        '</div>';
    },
    
    renderAnalytics: function(data) {
        var main = document.getElementById('mainContent');
        if (!main) return;
        
        var transactions = data.transactions || [];
        var goals = data.goals || [];
        var currency = data.settings?.currency || 'IDR';
        
        var totalInc = getTotalIncome(transactions);
        var totalExp = getTotalExpense(transactions);
        var totalSav = getTotalSaving(transactions);
        var totalGoalSavings = getTotalGoalSavings(goals);
        var dailyAvg = getDailyAverage(transactions, 30);
        var monthlyAvg = dailyAvg * 30;
        var insights = generateInsights(transactions, goals);
        
        var monthlyData = getMonthlyTrend(transactions, 6);
        var categoryData = getCategoryBreakdown(transactions, 'expense');
        
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
        
        main.innerHTML = 
            '<div class="page-container active" data-page="analytics">' +
                '<div class="section-title" style="font-size:1.2rem;margin-bottom:16px;">📈 Financial Analytics</div>' +
                '<div class="analytics-insights" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px;">' +
                    '<div class="insight-card glass" style="padding:14px 16px;border:1px solid rgba(255,255,255,0.04);border-radius:14px;">' +
                        '<div class="insight-value" style="font-family:Orbitron,monospace;font-size:1.2rem;font-weight:700;color:#00e5ff;">' + formatCurrency(totalSav + totalGoalSavings, currency) + '</div>' +
                        '<div class="insight-label" style="font-size:0.7rem;color:#88a0b8;margin-top:2px;">Total Tabungan</div>' +
                    '</div>' +
                    '<div class="insight-card glass" style="padding:14px 16px;border:1px solid rgba(255,255,255,0.04);border-radius:14px;">' +
                        '<div class="insight-value" style="font-family:Orbitron,monospace;font-size:1.2rem;font-weight:700;color:#00e5ff;">' + formatCurrency(monthlyAvg, currency) + '</div>' +
                        '<div class="insight-label" style="font-size:0.7rem;color:#88a0b8;margin-top:2px;">Rata-rata / Bulan</div>' +
                    '</div>' +
                    '<div class="insight-card glass" style="padding:14px 16px;border:1px solid rgba(255,255,255,0.04);border-radius:14px;">' +
                        '<div class="insight-value" style="font-family:Orbitron,monospace;font-size:1.2rem;font-weight:700;color:#00e5ff;">' + getActiveGoals(goals).length + '</div>' +
                        '<div class="insight-label" style="font-size:0.7rem;color:#88a0b8;margin-top:2px;">Target Aktif</div>' +
                    '</div>' +
                    '<div class="insight-card glass" style="padding:14px 16px;border:1px solid rgba(255,255,255,0.04);border-radius:14px;">' +
                        '<div class="insight-value" style="font-family:Orbitron,monospace;font-size:1.2rem;font-weight:700;color:#00e5ff;">' + getCompletedGoals(goals).length + '</div>' +
                        '<div class="insight-label" style="font-size:0.7rem;color:#88a0b8;margin-top:2px;">Target Tercapai</div>' +
                    '</div>' +
                '</div>' +
                '<div class="glass" style="margin-bottom:16px;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">' +
                        '<span style="font-weight:600;">📊 Perkembangan Saldo</span>' +
                        '<div style="display:flex;gap:6px;">' +
                            '<button class="filter-btn active" data-chart="balance" onclick="App.updateChartPeriod(\'balance\', 6)" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:#88a0b8;padding:2px 12px;border-radius:20px;cursor:pointer;font-family:Rajdhani,sans-serif;font-size:0.7rem;transition:0.3s;">6 Bulan</button>' +
                            '<button class="filter-btn" data-chart="balance" onclick="App.updateChartPeriod(\'balance\', 3)" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:#88a0b8;padding:2px 12px;border-radius:20px;cursor:pointer;font-family:Rajdhani,sans-serif;font-size:0.7rem;transition:0.3s;">3 Bulan</button>' +
                            '<button class="filter-btn" data-chart="balance" onclick="App.updateChartPeriod(\'balance\', 1)" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:#88a0b8;padding:2px 12px;border-radius:20px;cursor:pointer;font-family:Rajdhani,sans-serif;font-size:0.7rem;transition:0.3s;">1 Bulan</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="analytics-chart" style="height:180px;">' +
                        '<canvas id="balanceChart"></canvas>' +
                    '</div>' +
                '</div>' +
                '<div class="analytics-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +
                    '<div class="glass full-width" style="grid-column:1/3;">' +
                        '<div style="font-weight:600;margin-bottom:8px;">📊 Pemasukan vs Pengeluaran</div>' +
                        '<div class="analytics-chart" style="height:150px;">' +
                            '<canvas id="incomeExpenseChart"></canvas>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="analytics-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
                    '<div class="glass">' +
                        '<div style="font-weight:600;margin-bottom:8px;">📊 Kategori Pengeluaran</div>' +
                        '<div class="analytics-chart" style="height:180px;">' +
                            '<canvas id="categoryChart"></canvas>' +
                        '</div>' +
                    '</div>' +
                    '<div class="glass">' +
                        '<div style="font-weight:600;margin-bottom:8px;">💡 Insight Keuangan</div>' +
                        '<div style="display:flex;flex-direction:column;gap:8px;">' +
                            insights.map(function(i) {
                                return '<div style="padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:12px;border-left:3px solid ' + (i.type === 'warning' ? '#ff4d6d' : i.type === 'positive' ? '#00ff88' : '#00e5ff') + ';">' +
                                    '<span style="font-size:0.85rem;">' + i.message + '</span>' +
                                '</div>';
                            }).join('') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        // Render charts after DOM update
        setTimeout(function() {
            ChartRenderer.drawLineChart('balanceChart', balanceData, { height: 180 });
            
            var combinedData = [];
            incomeData.forEach(function(d) {
                combinedData.push({ label: d.label, value: d.value });
            });
            expenseData.forEach(function(d) {
                combinedData.push({ label: d.label, value: -d.value });
            });
            ChartRenderer.drawBarChart('incomeExpenseChart', combinedData, { height: 150 });
            ChartRenderer.drawDoughnutChart('categoryChart', pieData);
        }, 100);
    },
    
    renderSettings: function(data) {
        var main = document.getElementById('mainContent');
        if (!main) return;
        
        var settings = data.settings || {};
        var currency = settings.currency || 'IDR';
        
        main.innerHTML = 
            '<div class="page-container active" data-page="settings">' +
                '<div class="section-title" style="font-size:1.2rem;margin-bottom:16px;">⚙️ Pengaturan</div>' +
                '<div class="glass" style="margin-bottom:12px;">' +
                    '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tampilan</h4>' +
                    '<div class="settings-row" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
                        '<button class="neon-btn small ' + (settings.theme === 'dark' ? 'active' : '') + '" onclick="App.setTheme(\'dark\')" style="font-size:0.75rem;padding:6px 16px;">🌙 Dark</button>' +
                        '<button class="neon-btn small ' + (settings.theme === 'light' ? 'active' : '') + '" onclick="App.setTheme(\'light\')" style="font-size:0.75rem;padding:6px 16px;">☀️ Light</button>' +
                        '<button class="neon-btn small ' + (settings.theme === 'system' ? 'active' : '') + '" onclick="App.setTheme(\'system\')" style="font-size:0.75rem;padding:6px 16px;">🖥️ System</button>' +
                    '</div>' +
                '</div>' +
                '<div class="glass" style="margin-bottom:12px;">' +
                    '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Mata Uang</h4>' +
                    '<select id="currencySelectSettings" class="modal-select" style="max-width:200px;background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,255,0.1);border-radius:40px;padding:4px 12px;color:#fff;font-family:Rajdhani,sans-serif;" onchange="App.setCurrency(this.value)">' +
                        Object.keys(CURRENCIES).map(function(c) {
                            return '<option value="' + c + '" ' + (c === currency ? 'selected' : '') + '>' + CURRENCIES[c].symbol + ' - ' + c + '</option>';
                        }).join('') +
                    '</select>' +
                '</div>' +
                '<div class="glass" style="margin-bottom:12px;">' +
                    '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Notifikasi</h4>' +
                    '<div class="settings-row" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
                        '<label class="toggle-switch" style="display:flex;align-items:center;cursor:pointer;">' +
                            '<input type="checkbox" id="reminderToggleSettings" ' + (settings.reminders ? 'checked' : '') + ' onchange="App.toggleReminders(this.checked)" style="display:none;" />' +
                            '<span class="toggle-slider" style="width:44px;height:24px;background:rgba(255,255,255,0.1);border-radius:12px;position:relative;transition:0.3s;flex-shrink:0;"></span>' +
                            '<span style="margin-left:10px;">Aktifkan Pengingat</span>' +
                        '</label>' +
                    '</div>' +
                '</div>' +
                '<div class="glass" style="margin-bottom:12px;">' +
                    '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Data</h4>' +
                    '<div class="settings-row" style="display:flex;flex-direction:column;align-items:stretch;gap:8px;">' +
                        '<button class="neon-btn small" onclick="App.downloadBackup()" style="font-size:0.75rem;padding:6px 16px;">📥 Download Backup</button>' +
                        '<button class="neon-btn small" onclick="document.getElementById(\'restoreFileInputSettings\').click()" style="font-size:0.75rem;padding:6px 16px;">📤 Restore Backup</button>' +
                        '<input type="file" id="restoreFileInputSettings" accept=".json" style="display:none" onchange="App.restoreBackup(this)" />' +
                        '<button class="neon-btn danger small" onclick="App.openResetModal()" style="font-size:0.75rem;padding:6px 16px;">🗑️ Reset Semua Data</button>' +
                    '</div>' +
                '</div>' +
                '<div class="glass">' +
                    '<h4 style="color:#88a0b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tentang</h4>' +
                    '<p style="color:#e0f0ff;font-weight:600;">NEONVAULT ' + APP_VERSION + '</p>' +
                    '<p style="color:#88a0b8;font-size:0.85rem;">Personal Savings Manager</p>' +
                    '<p style="color:#88a0b8;font-size:0.75rem;margin-top:4px;">🔒 Data tersimpan secara lokal di perangkat ini</p>' +
                    '<p style="color:#88a0b8;font-size:0.7rem;margin-top:2px;">⚠️ Jika browser atau data situs dihapus, data tabungan dapat ikut terhapus.</p>' +
                '</div>' +
            '</div>';
    },
    
    showToast: function(message, type, undoCallback) {
        type = type || 'success';
        var container = document.getElementById('toastContainer');
        if (!container) return;
        
        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML = '<span>' + message + '</span>' +
            (undoCallback ? '<button class="toast-undo" onclick="this.closest(\'.toast\').remove(); ' + undoCallback + '()" style="color:#00e5ff;background:none;border:none;cursor:pointer;font-weight:600;padding:4px 8px;border-radius:8px;transition:0.3s;">UNDO</button>' : '');
        
        container.appendChild(toast);
        
        setTimeout(function() {
            toast.classList.add('removing');
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }
};