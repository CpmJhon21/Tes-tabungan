/* ============================================================
   charts.js – Chart Rendering with Canvas API
   NEONVAULT V2
   ============================================================ */

var ChartRenderer = {
    drawLineChart: function(canvasId, data, options) {
        options = options || {};
        var canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        var rect = canvas.parentElement?.getBoundingClientRect();
        var W = rect?.width || canvas.clientWidth || 400;
        var H = options.height || 200;
        
        canvas.width = W;
        canvas.height = H;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        
        var pad = { top: 20, right: 16, bottom: 28, left: 16 };
        var chartW = W - pad.left - pad.right;
        var chartH = H - pad.top - pad.bottom;
        
        ctx.clearRect(0, 0, W, H);
        
        if (!data || data.length === 0) {
            ctx.fillStyle = '#88a0b8';
            ctx.font = '14px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText('Belum ada data', W/2, H/2);
            return;
        }
        
        var values = data.map(function(d) { return d.value; });
        var labels = data.map(function(d) { return d.label; });
        var maxVal = Math.max(1, Math.max.apply(null, values.map(Math.abs)));
        var minVal = Math.min(0, Math.min.apply(null, values));
        var range = maxVal - minVal || 1;
        
        var isDark = !document.body.classList.contains('light-mode');
        var colors = {
            line: isDark ? '#00e5ff' : '#7c4dff',
            fill: isDark ? 'rgba(0,229,255,0.05)' : 'rgba(124,77,255,0.05)',
            grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            text: isDark ? '#88a0b8' : '#6a6a8e',
            point: isDark ? '#00e5ff' : '#7c4dff'
        };
        
        // Grid
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 0.5;
        for (var g = 0; g <= 4; g++) {
            var y = pad.top + (chartH / 4) * g;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }
        
        // Line
        ctx.beginPath();
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2;
        ctx.shadowColor = colors.line + '66';
        ctx.shadowBlur = 10;
        
        for (var i = 0; i < values.length; i++) {
            var x = pad.left + (i / (values.length - 1 || 1)) * chartW;
            var y = pad.top + chartH - ((values[i] - minVal) / range) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Points
        for (var p = 0; p < values.length; p++) {
            var px = pad.left + (p / (values.length - 1 || 1)) * chartW;
            var py = pad.top + chartH - ((values[p] - minVal) / range) * chartH;
            
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, 2 * Math.PI);
            ctx.fillStyle = colors.point;
            ctx.shadowColor = colors.point + '88';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = colors.text;
            ctx.font = '9px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText(labels[p], px, H - 4);
        }
    },
    
    drawBarChart: function(canvasId, data, options) {
        options = options || {};
        var canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        var rect = canvas.parentElement?.getBoundingClientRect();
        var W = rect?.width || canvas.clientWidth || 400;
        var H = options.height || 200;
        
        canvas.width = W;
        canvas.height = H;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        
        var pad = { top: 20, right: 16, bottom: 28, left: 16 };
        var chartW = W - pad.left - pad.right;
        var chartH = H - pad.top - pad.bottom;
        
        ctx.clearRect(0, 0, W, H);
        
        if (!data || data.length === 0) {
            ctx.fillStyle = '#88a0b8';
            ctx.font = '14px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText('Belum ada data', W/2, H/2);
            return;
        }
        
        var maxVal = Math.max(1, Math.max.apply(null, data.map(function(d) { return Math.abs(d.value); })));
        var isDark = !document.body.classList.contains('light-mode');
        var colors = {
            bar: isDark ? '#00e5ff' : '#7c4dff',
            grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            text: isDark ? '#88a0b8' : '#6a6a8e'
        };
        
        var barWidth = Math.min(40, (chartW / data.length) * 0.6);
        var gap = (chartW - barWidth * data.length) / (data.length + 1);
        
        // Grid
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 0.5;
        for (var g = 0; g <= 4; g++) {
            var y = pad.top + (chartH / 4) * g;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }
        
        data.forEach(function(item, i) {
            var x = pad.left + gap + i * (barWidth + gap);
            var barH = (Math.abs(item.value) / maxVal) * chartH;
            var y = pad.top + chartH - (item.value >= 0 ? barH : 0);
            
            ctx.fillStyle = item.value >= 0 ? colors.bar : '#ff4d6d';
            ctx.shadowColor = (item.value >= 0 ? colors.bar : '#ff4d6d') + '44';
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y, barWidth, barH);
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = colors.text;
            ctx.font = '8px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth/2, H - 4);
        });
    },
    
    drawDoughnutChart: function(canvasId, data, options) {
        options = options || {};
        var canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        var rect = canvas.parentElement?.getBoundingClientRect();
        var size = Math.min(rect?.width || 200, 200);
        var W = size;
        var H = size;
        
        canvas.width = W;
        canvas.height = H;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        
        ctx.clearRect(0, 0, W, H);
        
        if (!data || data.length === 0) {
            ctx.fillStyle = '#88a0b8';
            ctx.font = '14px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText('Belum ada data', W/2, H/2);
            return;
        }
        
        var total = data.reduce(function(sum, d) { return sum + d.value; }, 0);
        if (total === 0) {
            ctx.fillStyle = '#88a0b8';
            ctx.font = '14px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText('Tidak ada data', W/2, H/2);
            return;
        }
        
        var colors = ['#00e5ff', '#7c4dff', '#00ff88', '#ff6b6b', '#ffd93d', '#6bcbff', '#ff8a5c', '#a8e6cf', '#ff6b9d', '#4ecdc4'];
        var cx = W / 2;
        var cy = H / 2;
        var radius = Math.min(W, H) / 2 - 20;
        var innerRadius = radius * 0.6;
        var startAngle = -Math.PI / 2;
        
        data.forEach(function(item, i) {
            var sliceAngle = (item.value / total) * 2 * Math.PI;
            var color = item.color || colors[i % colors.length];
            
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.shadowColor = color + '44';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            if (sliceAngle > 0.2) {
                var midAngle = startAngle + sliceAngle / 2;
                var labelRadius = (radius + innerRadius) / 2;
                var lx = cx + Math.cos(midAngle) * labelRadius;
                var ly = cy + Math.sin(midAngle) * labelRadius;
                ctx.fillStyle = '#fff';
                ctx.font = '10px Rajdhani';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                var percent = Math.round((item.value / total) * 100);
                if (percent >= 10) {
                    ctx.fillText(percent + '%', lx, ly);
                }
            }
            
            startAngle += sliceAngle;
        });
        
        ctx.fillStyle = '#e0f0ff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Total', cx, cy - 8);
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 12px Rajdhani';
        ctx.fillText(formatCurrency(total), cx, cy + 18);
    }
};