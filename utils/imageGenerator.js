// utils/imageGenerator.js
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

class TradingImageGenerator {
    constructor() {
        // Konfigurasi layout - SESUAIKAN NILAI INI
        this.layout = {
            width: 1080,    // Lebar canvas
            height: 1080,   // Tinggi canvas
            margins: {
                top: 50,
                left: 56,
                right: 50,
                bottom: 50
            }
        };

        // Konfigurasi font sizes - SESUAIKAN NILAI INI
        this.fontSizes = {
            title: 44,     // Ukuran font untuk judul utama
            subtitle: 34,  // Ukuran font untuk subjudul
            normal: 18,    // Ukuran font untuk teks normal
            small: 14      // Ukuran font untuk teks kecil
        };

        // Konfigurasi colors - SESUAIKAN NILAI INI
        this.colors = {
            text: '#FFFFFF',
            profit: '#01fe9c',
            loss: '#fe006a',
            long: '#01fe9c',
            short: '#fe006a',
            grey: '#888888',
            background: {
                win: '#1E3A28',  // Hijau gelap untuk win
                loss: '#3A1E1E'  // Merah gelap untuk loss
            }
        };
    }

    drawHeader(ctx, symbol, position, leverage, startX, startY) {
        let currentX = startX;

        const styles = [
            { text: symbol, font: `bold ${this.fontSizes.title}px Arial`, color: this.colors.text },
            { text: '   |   ', font: `normal 34px Arial`, color: '#423F3E' },
            {
                text: position.toLowerCase() === 'long' ? 'Long' : 'Short',
                font: `bold ${this.fontSizes.title}px Arial`,
                color: position.toLowerCase() === 'long' ? this.colors.long : this.colors.short
            },
            { text: '   |   ', font: `normal 34px Arial`, color: '#423F3E' },
            { text: `${leverage}X`, font: `bold ${this.fontSizes.title}px Arial`, color: this.colors.text }
        ];

        styles.forEach(style => {
            ctx.font = style.font;
            ctx.fillStyle = style.color;
            ctx.textAlign = 'left';
            ctx.fillText(style.text, currentX, startY);
            currentX += ctx.measureText(style.text).width;
        });

        return currentX;
    }


    getCurrentJakartaTime() {
        const now = new Date();

        // Method simple: langsung tambah 7 jam
        const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));

        // Format: MM/DD HH:mm
        const month = (jakartaTime.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = jakartaTime.getUTCDate().toString().padStart(2, '0');
        const hours = jakartaTime.getUTCHours().toString().padStart(2, '0');
        const minutes = jakartaTime.getUTCMinutes().toString().padStart(2, '0');

        return `${month}/${day} ${hours}:${minutes}`;
    }


    async generateImage(data) {
        const {
            symbol,
            position,
            leverage,
            close_price,
            open_price,
            profit_percentage,
            closed_position
        } = data;

        // Tentukan background
        const backgroundName = closed_position.toLowerCase() === 'win' ? 'background-win.jpg' : 'background-loss.jpg';
        const backgroundPath = path.join(__dirname, '../public/', backgroundName);

        let background;
        try {
            background = await loadImage(backgroundPath);
        } catch (error) {
            console.log('Background image not found, using solid color');
            background = null;
        }

        // Create canvas
        const canvas = createCanvas(this.layout.width, this.layout.height);
        const ctx = canvas.getContext('2d');

        // Draw background
        if (background) {
            ctx.drawImage(background, 0, 0, this.layout.width, this.layout.height);
        } else {
            // Fallback: solid color background
            const bgColor = closed_position.toLowerCase() === 'win' ? this.colors.background.win : this.colors.background.loss;
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, this.layout.width, this.layout.height);
        }

        // Tentukan warna berdasarkan position dan closed_position
        const positionColor = position.toLowerCase() === 'long' ? this.colors.long : this.colors.short;
        const profitColor = closed_position.toLowerCase() === 'win' ? this.colors.profit : this.colors.loss;

        // ==================== BAGIAN 1: HEADER ====================
        this.drawHeader(
            ctx,
            symbol,
            position,
            leverage,
            this.layout.margins.left,
            this.layout.margins.top + 340
        );

        // ctx.fillText(`${profit_percentage}`, this.layout.margins.left, this.layout.margins.top + 500);
        // ctx.font = `72px Arial`;

        // ==================== BAGIAN 2: PROFIT/LOSS ====================

        // // 2.2 Profit Percentage (Besar, di tengah)
        let formattedProfit = profit_percentage;
        if (closed_position.toLowerCase() === 'win' && !profit_percentage.startsWith('+')) {
            formattedProfit = '+' + profit_percentage;
        } else if (closed_position.toLowerCase() === 'loss' && !profit_percentage.startsWith('-')) {
            formattedProfit = '-' + profit_percentage;
        }
        formattedProfit = formattedProfit.replace('%', '') + '%';

        ctx.font = `112px Arial`;
        ctx.fillStyle = profitColor;
        ctx.fillText(
            formattedProfit,
            56,
            this.layout.margins.top + 500
        );

        // // ==================== BAGIAN 3: PRICE INFO ====================
        // // 3.1 Last Price dan Avg Open Price
        ctx.font = `bold ${this.fontSizes.subtitle}px Arial`;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';

        const priceStartY = this.layout.margins.top + 620;
        ctx.fillText(`${close_price}`, this.layout.margins.left + 220, priceStartY);
        ctx.fillText(`${open_price}`, this.layout.margins.left + 300, priceStartY + 64);

        // // ==================== BAGIAN 4: TIMESTAMP ====================
        ctx.font = `${this.fontSizes.subtitle}px Arial`;
        ctx.fillStyle = this.colors.grey;
        ctx.textAlign = 'left';

        const timestamp = this.getCurrentJakartaTime();

        ctx.fillText(`${timestamp}`, this.layout.margins.left + 110, this.layout.margins.top + 962);

        return canvas.toBuffer('image/jpeg', { quality: 0.95 });
    }
}

module.exports = new TradingImageGenerator();