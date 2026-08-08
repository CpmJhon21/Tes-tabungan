/* ============================================================
   charts.js – Chart Rendering with Canvas API
   NEONVAULT V2
   ============================================================ */

// ============================================================
// CHART RENDERER
// ============================================================
const ChartRenderer = {
    // ============================================================
    // DRAW LINE CHART
    // ============================================================
    drawLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.parentElement?.getBoundingClientRect();
        const W = rect?.width || canvas.clientWidth || 400;
        const H = options.height || 200;
        
        canvas.width = W * (window.devicePixelRatio || 1);
        canvas.height = H * (window.devicePixelRatio || 1);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);
        
        const pad = { top: 20, right: 16, bottom: 28, left: 16 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;
        
        // Clear
        ctx.clearRect(0, 0, W, H);
        
        if (!data || data.length === 0) {
            ctx.fillStyle = '#88a0b8';
            ctx.font = '14px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText('Belum ada data', W/2, H/2);
            return;
        }
        
        const values = data.map(d => d.value);
        const labels = data.map(d => d.label);
        const maxVal = Math.max(1, ...values.map(Math.abs));
        const minVal = Math.min(0, ...values);
        const range = maxVal - minVal || 1;
        
        const isDark = document.body.classList.contains('light-mode') === false;
        const colors = {
            line: isDark ? '#00e5ff' : '#7c4dff',
            fill: isDark ? 'rgba(0,229,255,0.05)' : 'rgba(124,77,255,0.05)',
            grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            text: isDark ? '#88a0b8' : '#6a6a8e',
            point: isDark ? '#00e5ff' : '#7c4dff'
        };
        
        // Grid lines
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }
        
        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2;
        ctx.shadowColor = colors.line + '66';
        ctx.shadowBlur = 10;
        
        for (let i = 0; i < values.length; i++) {
            const x = pad.left + (i / (values.length - 1 || 1)) * chartW;
            const y = pad.top + chartH - ((values[i] - minVal) / range) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Fill area
        ctx.beginPath();
        const firstX = pad.left;
        const firstY = pad.top + chartH - ((values[0] - minVal) / range) * chartH;
        ctx.moveTo(firstX, pad.top + chartH);
        ctx.lineTo(firstX, firstY);
        for (let i = 0; i < values.length; i++) {
            const x = pad.left + (i / (values.length - 1 || 1)) * chartW;
            const y = pad.top + chartH - ((values[i] - minVal) / range) * chartH;
            ctx.lineTo(x, y);
        }
        const lastX = pad.left + chartW;
        ctx.lineTo(lastX, pad.top + chartH);
        ctx.closePath();
        ctx.fillStyle = colors.fill;
        ctx.fill();
        
        // Points & Labels
        for (let i = 0; i < values.length; i++) {
            const x = pad.left + (i / (values.length - 1 || 1)) * chartW;
            const y = pad.top + chartH - ((values[i] - minVal) / range) * chartH;
            
            // Point
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = colors.point;
            ctx.shadowColor = colors.point + '88';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Label
            ctx.fillStyle = colors.text;
            ctx.font = '9px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x, H - 4);
        }
    },
    
    // ============================================================
    // DRAW BAR CHART
    // ============================================================
    drawBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.parentElement?.getBoundingClientRect();
        const W = rect?.width || canvas.clientWidth || 400;
        const H = options.height || 200;
        
        canvas.width = W * (window.devicePixelRatio || 1);
        canvas.height = H * (window.devicePixelRatio || 1);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);
        
        const pad = { top: 20, right: 16, bottom: 28, left: 16 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;
        
        ctx.clearRect(0, 0, W, H);
        
        if (!data || data.length === 0) {
            ctx.fillStyle = '#88a0b8';
            ctx.font = '14px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText('Belum ada data', W/2, H/2);
            return;
        }
        
        const maxVal = Math.max(1, ...data.map(d => Math.abs(d.value)));
        const isDark = document.body.classList.contains('light-mode') === false;
        const colors = {
            bar: isDark ? '#00e5ff' : '#7c4dff',
            grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            text: isDark ? '#88a0b8' : '#6a6a8e'
        };
        
        const barWidth = Math.min(40, (chartW / data.length) * 0.6);
        const gap = (chartW - barWidth * data.length) / (data.length + 1);
        
        // Grid lines
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }
        
        data.forEach((item, i) => {
            const x = pad.left + gap + i * (barWidth + gap);
            const barH = (Math.abs(item.value) / maxVal) * chartH;
            const y = pad.top + chartH - (item.value >= 0 ? barH : 0);
            
            // Bar
            const gradient = ctx.createLinearGradient(x, y, x, pad.top + chartH);
            if (item.value >= 0) {
                gradient.addColorStop(0, colors.bar);
                gradient.addColorStop(1, colors.bar + '44');
            } else {
                gradient.addColorStop(0, '#ff4d6d');
                gradient.addColorStop(1, '#ff4d6d44');
            }
            
            ctx.fillStyle = gradient;
            ctx.shadowColor = (item.value >= 0 ? colors.bar : '#ff4d6d') + '44';
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y, barWidth, barH);
            ctx.shadowBlur = 0;
            
            // Label
            ctx.fillStyle = colors.text;
            ctx.font = '8px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth/2, H - 4);
        });
    },
    
    // ============================================================
    // DRAW PIE/DOUGHNUT CHART
    // ============================================================
    drawDoughnutChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.parentElement?.getBoundingClientRect();
        const size = Math.min(rect?.width || 200, 200);
        const W = size;
        const H = size;
        
        canvas.width = W * (window.devicePixelRatio || 1);
        canvas.height = H * (window.devicePixelRatio || 1);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);
        
        ctx.clearRect(0, 0, W, H);
        
        if (!data || data.length === 0) {
            ctx.fillStyle = '#88a0b8';
            ctx.font = '14px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText('Belum ada data', W/2, H/2);
            return;
        }
        
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) {
            ctx.fillStyle = '#88a0b8';
            ctx.font = '14px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText('Tidak ada data', W/2, H/2);
            return;
        }
        
        const colors = [
            '#00e5ff', '#7c4dff', '#00ff88', '#ff6b6b', '#ffd93d',
            '#6bcbff', '#ff8a5c', '#a8e6cf', '#ff6b9d', '#4ecdc4'
        ];
        
        const cx = W / 2;
        const cy = H / 2;
        const radius = Math.min(W, H) / 2 - 20;
        const innerRadius = radius * 0.6;
        
        let startAngle = -Math.PI / 2;
        
        data.forEach((item, i) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const color = item.color || colors[i % colors.length];
            
            // Draw slice
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            
            // Shadow
            ctx.shadowColor = color + '44';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Draw label if slice is large enough
            if (sliceAngle > 0.2) {
                const midAngle = startAngle + sliceAngle / 2;
                const labelRadius = (radius + innerRadius) / 2;
                const x = cx + Math.cos(midAngle) * labelRadius;
                const y = cy + Math.sin(midAngle) * labelRadius;
                
                ctx.fillStyle = '#fff';
                ctx.font = '10px Rajdhani';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const percent = Math.round((item.value / total) * 100);
                if (percent >= 10) {
                    ctx.fillText(percent + '%', x, y);
                }
            }
            
            startAngle += sliceAngle;
        });
        
        // Center text
        ctx.fillStyle = '#e0f0ff';
        ctx.font = 'bold 18px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Total', cx, cy - 8);
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 14px Rajdhani';
        ctx.fillText(formatCurrency(total), cx, cy + 18);
    },
    
    // ============================================================
    // DRAW BALANCE CHART (Custom for analytics)
    // ============================================================
    drawBalanceChart(canvasId, data, options = {}) {
        if (!data || data.length === 0) {
            this.drawLineChart(canvasId, [{ label: 'Tidak ada data', value: 0 }], options);
            return;
        }
        this.drawLineChart(canvasId, data, options);
    }
};

// ============================================================
// EXPORTS
// ============================================================
window.ChartRenderer = ChartRenderer;