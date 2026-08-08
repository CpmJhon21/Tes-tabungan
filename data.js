/* ============================================================
   data.js – Data Structure & Default Configuration
   NEONVAULT V2
   ============================================================ */

// ============================================================
// VERSION & SCHEMA
// ============================================================
const APP_VERSION = '2.0.0';
const STORAGE_KEY = 'neonvault_data_v2';

// ============================================================
// DEFAULT DATA STRUCTURE
// ============================================================
function getDefaultData() {
    return {
        version: 2,
        settings: {
            theme: 'dark', // 'dark' | 'light' | 'system'
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
const CURRENCIES = {
    IDR: { symbol: 'Rp', locale: 'id-ID', decimal: 0 },
    USD: { symbol: '$', locale: 'en-US', decimal: 2 },
    EUR: { symbol: '€', locale: 'de-DE', decimal: 2 },
    JPY: { symbol: '¥', locale: 'ja-JP', decimal: 0 }
};

// ============================================================
// GOAL ICONS
// ============================================================
const GOAL_ICONS = [
    '💻', '📱', '🏍️', '🏠', '✈️', '🎓', '🚗', '🏖️', '🎮', '📚',
    '💎', '🎯', '🌟', '🔥', '⚡', '🌈', '🎨', '🏆', '💪', '🧠'
];

// ============================================================
// DEFAULT GOAL COLORS
// ============================================================
const GOAL_COLORS = [
    '#00e5ff', '#7c4dff', '#00ff88', '#ff6b6b', '#ffd93d',
    '#6bcbff', '#ff8a5c', '#a8e6cf', '#ff6b9d', '#4ecdc4',
    '#45b7d1', '#f9ca24', '#686de0', '#badc58', '#ff7979'
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
}

function getCurrencySymbol(currencyCode) {
    return CURRENCIES[currencyCode]?.symbol || 'Rp';
}

function formatCurrency(amount, currencyCode = 'IDR') {
    const config = CURRENCIES[currencyCode] || CURRENCIES.IDR;
    const formatted = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: config.decimal,
        maximumFractionDigits: config.decimal
    }).format(amount);
    return `${config.symbol} ${formatted}`;
}

function parseCurrency(value) {
    return parseInt(value) || 0;
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentDateTime() {
    return new Date().toISOString();
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTime(dateStr) {
    return formatDate(dateStr) + ' · ' + formatTime(dateStr);
}

function getCategoryIcon(categoryId) {
    const categories = getDefaultData().categories;
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || '📦';
}

function getCategoryName(categoryId) {
    const categories = getDefaultData().categories;
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Lainnya';
}

function getGoalIcon(goalId, goals) {
    const goal = goals.find(g => g.id === goalId);
    return goal?.icon || '🎯';
}

function getGoalName(goalId, goals) {
    const goal = goals.find(g => g.id === goalId);
    return goal?.name || 'Target';
}

function calculateGoalProgress(goal) {
    if (!goal || goal.target <= 0) return 0;
    return Math.min(100, (goal.saved / goal.target) * 100);
}

function isGoalCompleted(goal) {
    return goal && goal.saved >= goal.target;
}

function getTotalBalance(transactions) {
    let balance = 0;
    transactions.forEach(t => {
        if (t.type === 'income') balance += t.amount;
        else if (t.type === 'expense') balance -= t.amount;
        // Saving transactions affect goals but not main balance
    });
    return balance;
}

function getTotalIncome(transactions) {
    return transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
}

function getTotalExpense(transactions) {
    return transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
}

function getTotalSaving(transactions) {
    return transactions
        .filter(t => t.type === 'saving')
        .reduce((sum, t) => sum + t.amount, 0);
}

function getTotalGoalSavings(goals) {
    return goals.reduce((sum, g) => sum + g.saved, 0);
}

function getActiveGoals(goals) {
    return goals.filter(g => !isGoalCompleted(g));
}

function getCompletedGoals(goals) {
    return goals.filter(g => isGoalCompleted(g));
}

function getTransactionsByDate(transactions, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return transactions.filter(t => new Date(t.date) >= cutoff);
}

function getCategorySpending(transactions, categoryId) {
    return transactions
        .filter(t => t.category === categoryId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
}

function getCategoryIncome(transactions, categoryId) {
    return transactions
        .filter(t => t.category === categoryId && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
}

function getDailyAverage(transactions, days = 30) {
    const recent = getTransactionsByDate(transactions, days);
    const total = recent.reduce((sum, t) => {
        if (t.type === 'income') return sum + t.amount;
        if (t.type === 'expense') return sum - t.amount;
        return sum;
    }, 0);
    return days > 0 ? total / days : 0;
}

function getSavingRate(transactions, days = 30) {
    const recent = getTransactionsByDate(transactions, days);
    const income = recent.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = recent.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const saving = recent.filter(t => t.type === 'saving').reduce((sum, t) => sum + t.amount, 0);
    
    if (income === 0) return 0;
    return ((income - expense - saving) / income) * 100;
}

function getMonthlyTrend(transactions, months = 3) {
    const trends = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthTxs = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= month && d < nextMonth;
        });
        
        const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const saving = monthTxs.filter(t => t.type === 'saving').reduce((sum, t) => sum + t.amount, 0);
        
        trends.push({
            month: month.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
            income,
            expense,
            saving,
            balance: income - expense - saving
        });
    }
    
    return trends;
}

function getCategoryBreakdown(transactions, type = 'expense') {
    const breakdown = {};
    const filtered = transactions.filter(t => t.type === type);
    
    filtered.forEach(t => {
        if (!breakdown[t.category]) {
            breakdown[t.category] = 0;
        }
        breakdown[t.category] += t.amount;
    });
    
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(breakdown).map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        icon: getCategoryIcon(category),
        name: getCategoryName(category)
    })).sort((a, b) => b.amount - a.amount);
}

function generateInsights(transactions, goals) {
    const insights = [];
    const totalInc = getTotalIncome(transactions);
    const totalExp = getTotalExpense(transactions);
    const totalSav = getTotalSaving(transactions);
    const monthlyAvg = getDailyAverage(transactions, 30) * 30;
    
    // Spending insights
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length > 0) {
        const topCategory = getCategoryBreakdown(transactions, 'expense')[0];
        if (topCategory && topCategory.percentage > 20) {
            insights.push({
                type: 'spending',
                message: `Pengeluaran terbesar bulan ini berasal dari kategori ${topCategory.name} (${Math.round(topCategory.percentage)}%)`
            });
        }
    }
    
    // Saving insights
    if (totalSav > 0) {
        const savingRate = getSavingRate(transactions, 30);
        if (savingRate > 0) {
            insights.push({
                type: 'saving',
                message: `Tabunganmu meningkat ${Math.round(savingRate)}% dibanding bulan sebelumnya`
            });
        }
    }
    
    // Goal insights
    const active = getActiveGoals(goals);
    if (active.length > 0) {
        const closest = active.reduce((a, b) => {
            const progA = calculateGoalProgress(a);
            const progB = calculateGoalProgress(b);
            return progA > progB ? a : b;
        });
        if (closest && calculateGoalProgress(closest) > 50) {
            insights.push({
                type: 'goal',
                message: `🎯 Kamu tinggal ${formatCurrency(closest.target - closest.saved)} lagi untuk mencapai target "${closest.name}"`
            });
        }
    }
    
    // Balance insight
    if (totalInc > 0 && totalExp > 0) {
        const ratio = totalExp / totalInc;
        if (ratio > 0.7) {
            insights.push({
                type: 'warning',
                message: `Pengeluaran mencapai ${Math.round(ratio * 100)}% dari pemasukan. Perhatikan anggaranmu.`
            });
        } else if (ratio < 0.3) {
            insights.push({
                type: 'positive',
                message: `Kamu berhasil menabung ${Math.round((1 - ratio) * 100)}% dari pemasukan!`
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
// DATA VALIDATION
// ============================================================
function validateTransaction(transaction) {
    if (!transaction) return false;
    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) return false;
    if (!['income', 'expense', 'saving'].includes(transaction.type)) return false;
    if (!transaction.category) return false;
    if (!transaction.date) return false;
    return true;
}

function validateGoal(goal) {
    if (!goal) return false;
    if (!goal.name || goal.name.trim() === '') return false;
    if (typeof goal.target !== 'number' || goal.target <= 0) return false;
    if (typeof goal.saved !== 'number') return false;
    return true;
}

function sanitizeString(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// EXPORTS (Global)
// ============================================================
window.APP_VERSION = APP_VERSION;
window.STORAGE_KEY = STORAGE_KEY;
window.getDefaultData = getDefaultData;
window.CURRENCIES = CURRENCIES;
window.GOAL_ICONS = GOAL_ICONS;
window.GOAL_COLORS = GOAL_COLORS;
window.generateId = generateId;
window.getCurrencySymbol = getCurrencySymbol;
window.formatCurrency = formatCurrency;
window.parseCurrency = parseCurrency;
window.getToday = getToday;
window.getCurrentDateTime = getCurrentDateTime;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.formatDateTime = formatDateTime;
window.getCategoryIcon = getCategoryIcon;
window.getCategoryName = getCategoryName;
window.getGoalIcon = getGoalIcon;
window.getGoalName = getGoalName;
window.calculateGoalProgress = calculateGoalProgress;
window.isGoalCompleted = isGoalCompleted;
window.getTotalBalance = getTotalBalance;
window.getTotalIncome = getTotalIncome;
window.getTotalExpense = getTotalExpense;
window.getTotalSaving = getTotalSaving;
window.getTotalGoalSavings = getTotalGoalSavings;
window.getActiveGoals = getActiveGoals;
window.getCompletedGoals = getCompletedGoals;
window.getTransactionsByDate = getTransactionsByDate;
window.getCategorySpending = getCategorySpending;
window.getCategoryIncome = getCategoryIncome;
window.getDailyAverage = getDailyAverage;
window.getSavingRate = getSavingRate;
window.getMonthlyTrend = getMonthlyTrend;
window.getCategoryBreakdown = getCategoryBreakdown;
window.generateInsights = generateInsights;
window.validateTransaction = validateTransaction;
window.validateGoal = validateGoal;
window.sanitizeString = sanitizeString;