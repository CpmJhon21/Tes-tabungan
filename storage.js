/* ============================================================
   storage.js – LocalStorage Management with Backup & Migration
   NEONVAULT V2
   ============================================================ */

// ============================================================
// STORAGE MANAGER
// ============================================================
const StorageManager = {
    // ============================================================
    // GET DATA
    // ============================================================
    getData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            
            const data = JSON.parse(raw);
            
            // Migrate if needed
            if (data.version !== 2) {
                return this.migrateData(data);
            }
            
            return data;
        } catch (e) {
            console.error('Error loading data:', e);
            return null;
        }
    },
    
    // ============================================================
    // SAVE DATA
    // ============================================================
    saveData(data) {
        try {
            // Auto-backup before save
            this.createAutoBackup(data);
            
            // Update version
            data.version = 2;
            data.lastSaved = getCurrentDateTime();
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
        }
    },
    
    // ============================================================
    // MIGRATE FROM V1
    // ============================================================
    migrateData(oldData) {
        console.log('Migrating data from v1 to v2...');
        
        // If old data is already v2, return as is
        if (oldData.version === 2) return oldData;
        
        // Create new structure
        const newData = getDefaultData();
        
        // Migrate settings
        if (oldData.settings) {
            newData.settings.theme = oldData.settings.theme || 'dark';
            newData.settings.currency = oldData.settings.currency || 'IDR';
            newData.settings.userName = oldData.settings.userName || '';
            newData.settings.onboardingComplete = oldData.settings.onboardingComplete || false;
        }
        
        // Migrate balance
        newData.balance = oldData.balance || 0;
        
        // Migrate goals
        if (oldData.goals && Array.isArray(oldData.goals)) {
            newData.goals = oldData.goals.map(g => ({
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
            }));
        }
        
        // Migrate transactions
        if (oldData.transactions && Array.isArray(oldData.transactions)) {
            newData.transactions = oldData.transactions.map(t => ({
                id: t.id || generateId(),
                type: t.type || 'income',
                amount: t.amount || 0,
                category: t.category || 'other',
                desc: t.desc || t.description || '',
                date: t.date || t.createdAt || getCurrentDateTime(),
                goalId: t.goalId || ''
            }));
        }
        
        // Save migrated data
        this.saveData(newData);
        console.log('Migration complete!');
        
        return newData;
    },
    
    // ============================================================
    // AUTO BACKUP
    // ============================================================
    createAutoBackup(data) {
        try {
            const backups = data.backupHistory || [];
            const backup = {
                id: generateId(),
                date: getCurrentDateTime(),
                type: 'auto',
                size: JSON.stringify(data).length
            };
            
            // Keep only last 10 backups
            backups.unshift(backup);
            if (backups.length > 10) backups.pop();
            
            data.backupHistory = backups;
            
            // Store backup in separate key
            try {
                const backupKey = `${STORAGE_KEY}_backup_${backup.id}`;
                localStorage.setItem(backupKey, JSON.stringify(data));
            } catch (e) {
                console.warn('Auto backup failed:', e);
            }
            
            return backup;
        } catch (e) {
            console.warn('Auto backup failed:', e);
            return null;
        }
    },
    
    // ============================================================
    // RESTORE BACKUP
    // ============================================================
    restoreBackup(backupData) {
        try {
            if (!backupData) return false;
            
            // Validate structure
            if (!backupData.transactions || !backupData.goals) {
                return false;
            }
            
            // Save restored data
            backupData.version = 2;
            this.saveData(backupData);
            return true;
        } catch (e) {
            console.error('Restore failed:', e);
            return false;
        }
    },
    
    // ============================================================
    // EXPORT DATA
    // ============================================================
    exportData() {
        const data = this.getData();
        if (!data) return null;
        
        const exportData = {
            version: 2,
            exportedAt: getCurrentDateTime(),
            appVersion: APP_VERSION,
            data: data
        };
        
        return JSON.stringify(exportData, null, 2);
    },
    
    // ============================================================
    // IMPORT DATA
    // ============================================================
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            
            // Check if it's a full export
            if (imported.data && imported.data.transactions) {
                return this.restoreBackup(imported.data);
            }
            
            // Check if it's raw data
            if (imported.transactions && imported.goals) {
                return this.restoreBackup(imported);
            }
            
            return false;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    },
    
    // ============================================================
    // RESET DATA
    // ============================================================
    resetData() {
        try {
            // Create backup before reset
            const currentData = this.getData();
            if (currentData) {
                const backupKey = `${STORAGE_KEY}_backup_reset_${generateId()}`;
                localStorage.setItem(backupKey, JSON.stringify(currentData));
            }
            
            // Clear all related storage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(STORAGE_KEY)) {
                    localStorage.removeItem(key);
                }
            });
            
            // Save fresh default data
            const newData = getDefaultData();
            this.saveData(newData);
            
            return true;
        } catch (e) {
            console.error('Reset failed:', e);
            return false;
        }
    },
    
    // ============================================================
    // DATA VALIDATION
    // ============================================================
    validateData(data) {
        if (!data) return false;
        if (data.version !== 2) return false;
        if (!data.transactions || !Array.isArray(data.transactions)) return false;
        if (!data.goals || !Array.isArray(data.goals)) return false;
        return true;
    },
    
    // ============================================================
    // GET STORAGE INFO
    // ============================================================
    getStorageInfo() {
        try {
            const data = this.getData();
            if (!data) return null;
            
            const json = JSON.stringify(data);
            return {
                size: json.length,
                sizeKB: Math.round(json.length / 1024),
                transactions: data.transactions?.length || 0,
                goals: data.goals?.length || 0,
                lastSaved: data.lastSaved || 'Never'
            };
        } catch (e) {
            return null;
        }
    },
    
    // ============================================================
    // CLEAN OLD BACKUPS
    // ============================================================
    cleanOldBackups() {
        try {
            const keys = Object.keys(localStorage);
            const backupKeys = keys.filter(k => k.startsWith(`${STORAGE_KEY}_backup_`));
            
            // Keep only last 5 backups
            backupKeys.sort((a, b) => {
                const aTime = parseInt(a.split('_').pop()) || 0;
                const bTime = parseInt(b.split('_').pop()) || 0;
                return bTime - aTime;
            });
            
            backupKeys.slice(5).forEach(key => {
                localStorage.removeItem(key);
            });
            
            return backupKeys.length;
        } catch (e) {
            console.warn('Clean backups failed:', e);
            return 0;
        }
    }
};

// ============================================================
// EXPORTS
// ============================================================
window.StorageManager = StorageManager;