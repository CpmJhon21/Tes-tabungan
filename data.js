/* ============================================================
   data.js – Data Structure & Default Configuration
   NEONVAULT V2
   ============================================================ */

// ============================================================
// VERSION & STORAGE KEY
// ============================================================
var APP_VERSION = '2.0.0';
var STORAGE_KEY = 'neonvault_data_v2';

// ============================================================
// DEFAULT DATA STRUCTURE
// ============================================================
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
        balance: 0,
        goals: [],
        transactions: [],
        categories: [
            { id: 'food', name: 'Makanan', icon: '🍔', type: 'expense' },
            { id: 'transport', name: 'Transportasi', icon: '🚗', type: 'expense' },
            { id: 'shopping', name: 'Belanja', icon: '🛒', type: 'expense' },
            { id: 'salary', name: 'Gaji', icon: '💼', type: 'income' },
            { id: 'bonus', name: 'Bonus', icon: '🎁', type: 'income' },
            { id: 'home', name: 'Rumah', icon: '🏠', type: 'expense' },
            { id: 'education', name: 'Pendidikan', icon: '🎓', type: 'expense' },
            { id: 'entertainment', name: 'Hiburan', icon: '🎮', type: 'expense' },
            { id: 'savings', name: 'Tabungan', icon: '💰', type: 'saving' },
            { id: 'other', name: 'Lainnya', icon: '📦', type: 'other' }
        ],
        reminders: [],
        backupHistory: []
    };
}

// ============================================================
// CURRENCY CONFIG
// ============================================================
var CURRENCIES = {
    IDR: { symbol: 'Rp', locale: 'id-ID', decimal: 0 },
    USD: { symbol: '$', locale: 'en-US', decimal: 2 },
    EUR: { symbol: '€', locale: 'de-DE', decimal: 2 },
    JPY: { symbol: '¥', locale: 'ja-JP', decimal: 0 }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
}

function getCurrencySymbol(currencyCode) {
    return CURRENCIES[currencyCode]?.symbol || 'Rp';
}

function formatCurrency(amount, currencyCode) {
    currencyCode = currencyCode || 'IDR';
    var config = CURRENCIES[currencyCode] || CURRENCIES.IDR;
    var formatted = Number(amount).toLocaleString(config.locale, {
        minimumFractionDigits: config.decimal,
        maximumFractionDigits: config.decimal
    });
    return config.symbol + ' ' + formatted;
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
    } catch(e) {
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
    } catch(e) {
        return '';
    }
}

function formatDateTime(dateStr) {
    return formatDate(dateStr) + ' · ' + formatTime(dateStr);
}

function getCategoryIcon(categoryId) {
    var categories = getDefaultData().categories;
    var cat = categories.find(function(c) { return c.id === categoryId; });
    return cat?.icon || '📦';
}

function getCategoryName(categoryId) {
    var categories = getDefaultData().categories;
    var cat = categories.find(function(c) { return c.id === categoryId; });
    return cat?.name || 'Lainnya';
}

function calculateGoalProgress(goal) {
    if (!goal || goal.target <= 0) return 0;
    return Math.min(100, (goal.saved / goal.target) * 100);
}

function isGoalCompleted(goal) {
    return goal && goal.saved >= goal.target;
}

function getTotalIncome(transactions) {
    return transactions
        .filter(function(t) { return t.type === 'income'; })
        .reduce(function(sum, t) { return sum + t.amount; }, 0);
}

function getTotalExpense(transactions) {
    return transactions
        .filter(function(t) { return t.type === 'expense'; })
        .reduce(function(sum, t) { return sum + t.amount; }, 0);
}

function getTotalSaving(transactions) {
    return transactions
        .filter(function(t) { return t.type === 'saving'; })
        .reduce(function(sum, t) { return sum + t.amount; }, 0);
}

function getTotalBalance(transactions) {
    var balance = 0;
    transactions.forEach(function(t) {
        if (t.type === 'income') balance += t.amount;
        else if (t.type === 'expense') balance -= t.amount;
    });
    return balance;
}

function getTotalGoalSavings(goals) {
    return goals.reduce(function(sum, g) { return sum + g.saved; }, 0);
}

function getActiveGoals(goals) {
    return goals.filter(function(g) { return !isGoalCompleted(g); });
}

function getCompletedGoals(goals) {
    return goals.filter(function(g) { return isGoalCompleted(g); });
}

function getTransactionsByDate(transactions, days) {
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return transactions.filter(function(t) { return new Date(t.date) >= cutoff; });
}

function getSavingRate(transactions, days) {
    days = days || 30;
    var recent = getTransactionsByDate(transactions, days);
    var income = recent.filter(function(t) { return t.type === 'income'; }).reduce(function(sum, t) { return sum + t.amount; }, 0);
    var expense = recent.filter(function(t) { return t.type === 'expense'; }).reduce(function(sum, t) { return sum + t.amount; }, 0);
    var saving = recent.filter(function(t) { return t.type === 'saving'; }).reduce(function(sum, t) { return sum + t.amount; }, 0);
    
    if (income === 0) return 0;
    return ((income - expense - saving) / income) * 100;
}

function getDailyAverage(transactions, days) {
    days = days || 30;
    var recent = getTransactionsByDate(transactions, days);
    var total = recent.reduce(function(sum, t) {
        if (t.type === 'income') return sum + t.amount;
        if (t.type === 'expense') return sum - t.amount;
        return sum;
    }, 0);
    return days > 0 ? total / days : 0;
}

function getMonthlyTrend(transactions, months) {
    months = months || 6;
    var trends = [];
    var now = new Date();
    
    for (var i = months - 1; i >= 0; i--) {
        var month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        var nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        var monthTxs = transactions.filter(function(t) {
            var d = new Date(t.date);
            return d >= month && d < nextMonth;
        });
        
        var income = monthTxs.filter(function(t) { return t.type === 'income'; }).reduce(function(sum, t) { return sum + t.amount; }, 0);
        var expense = monthTxs.filter(function(t) { return t.type === 'expense'; }).reduce(function(sum, t) { return sum + t.amount; }, 0);
        var saving = monthTxs.filter(function(t) { return t.type === 'saving'; }).reduce(function(sum, t) { return sum + t.amount; }, 0);
        
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

function getCategoryBreakdown(transactions, type) {
    type = type || 'expense';
    var breakdown = {};
    var filtered = transactions.filter(function(t) { return t.type === type; });
    
    filtered.forEach(function(t) {
        if (!breakdown[t.category]) {
            breakdown[t.category] = 0;
        }
        breakdown[t.category] += t.amount;
    });
    
    var total = Object.values(breakdown).reduce(function(sum, val) { return sum + val; }, 0);
    
    return Object.keys(breakdown).map(function(category) {
        return {
            category: category,
            amount: breakdown[category],
            percentage: total > 0 ? (breakdown[category] / total) * 100 : 0,
            icon: getCategoryIcon(category),
            name: getCategoryName(category)
        };
    }).sort(function(a, b) { return b.amount - a.amount; });
}

function generateInsights(transactions, goals) {
    var insights = [];
    var totalInc = getTotalIncome(transactions);
    var totalExp = getTotalExpense(transactions);
    
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
            var progA = calculateGoalProgress(a);
            var progB = calculateGoalProgress(b);
            return progA > progB ? a : b;
        });
        if (closest && calculateGoalProgress(closest) > 50) {
            var remaining = closest.target - closest.saved;
            insights.push({
                type: 'goal',
                message: '🎯 Kamu tinggal ' + formatCurrency(remaining) + ' lagi untuk mencapai target "' + closest.name + '"'
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

function sanitizeString(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}