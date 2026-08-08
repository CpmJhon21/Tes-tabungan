/* ============================================================
   storage.js – LocalStorage Management
   NEONVAULT V2
   ============================================================ */

var StorageManager = {
    getData: function() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            return data;
        } catch (e) {
            console.error('Error loading data:', e);
            return null;
        }
    },
    
    saveData: function(data) {
        try {
            data.version = 2;
            data.lastSaved = getCurrentDateTime();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
        }
    },
    
    exportData: function() {
        try {
            var data = this.getData();
            if (!data) return null;
            var exportData = {
                version: 2,
                exportedAt: getCurrentDateTime(),
                appVersion: APP_VERSION,
                data: data
            };
            return JSON.stringify(exportData, null, 2);
        } catch (e) {
            console.error('Export failed:', e);
            return null;
        }
    },
    
    importData: function(jsonString) {
        try {
            var imported = JSON.parse(jsonString);
            if (imported.data && imported.data.transactions) {
                return this.restoreBackup(imported.data);
            }
            if (imported.transactions && imported.goals) {
                return this.restoreBackup(imported);
            }
            return false;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    },
    
    restoreBackup: function(backupData) {
        try {
            if (!backupData) return false;
            if (!backupData.transactions || !backupData.goals) return false;
            backupData.version = 2;
            return this.saveData(backupData);
        } catch (e) {
            console.error('Restore failed:', e);
            return false;
        }
    },
    
    resetData: function() {
        try {
            var currentData = this.getData();
            if (currentData) {
                var backupKey = STORAGE_KEY + '_backup_reset_' + generateId();
                localStorage.setItem(backupKey, JSON.stringify(currentData));
            }
            var newData = getDefaultData();
            return this.saveData(newData);
        } catch (e) {
            console.error('Reset failed:', e);
            return false;
        }
    }
};