# NEONVAULT V2

**Your Money. Your Goals. Your Future.**

NEONVAULT adalah aplikasi tabungan personal dengan desain cyberpunk futuristik yang dapat digunakan tanpa login. Data disimpan secara lokal di perangkat Anda.

## ✨ Fitur Utama

### 💰 Dashboard
- Total saldo dengan animasi angka
- Pemasukan, Pengeluaran, dan Tabungan
- Grafik perkembangan saldo
- Target tabungan terkini

### 🎯 Multi Savings Goals
- Buat banyak target tabungan
- Icon dan warna custom
- Progress bar dengan animasi
- Deadline dan catatan
- Status completed dengan celebration

### 📊 Transaksi
- Income, Expense, dan Saving
- Kategori default + custom
- Search dan filter
- Sort (terbaru, terlama, terbesar, terkecil)
- UNDO transaksi

### 📈 Analytics
- Grafik perkembangan saldo (6/3/1 bulan)
- Pemasukan vs Pengeluaran
- Breakdown kategori
- Insight keuangan otomatis

### 🔒 Data
- LocalStorage + IndexedDB
- Auto backup
- Export/Import JSON
- Reset dengan konfirmasi

### 🎨 Desain
- Cyberpunk + Holographic
- Glassmorphism
- Dark/Light/System mode
- Responsive mobile-first
- Animasi halus

## 🚀 Cara Menjalankan

1. Clone repository:
```bash
git clone https://github.com/yourusername/neonvault.git

2. Buka folder:
cd neonvault

3. Jalankan dengan live server atau buka index.html di browser.

📦 Deploy ke Vercel

npm install -g vercel
vercel

🛠️ Teknologi
• HTML5

• CSS3 (Native)

• JavaScript Vanilla

• Canvas API untuk chart

• LocalStorage & IndexedDB

• Service Worker (PWA ready)

📱 Mobile Support
• Bottom navigation

• Touch-friendly

• Responsive dari 360px - 1440px

• PWA ready
```

## 🔧 Konfigurasi
Semua pengaturan disimpan di LocalStorage dengan key neonvault_data_v2.


## manifest.json
```json
{
  "name": "NEONVAULT",
  "short_name": "NeonVault",
  "description": "Personal Savings Manager with Cyberpunk Design",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#050816",
  "theme_color": "#050816",
  "orientation": "any",
  "icons": [
    {
      "src": "assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```
*Made with ✦ by NEONVAULT Team Dev JHON PRODUCTION*


---
