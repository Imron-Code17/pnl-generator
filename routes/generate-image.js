// routes/generate-image.js
const express = require('express');
const router = express.Router();
const imageGenerator = require('../utils/imageGenerator');
const supabase = require('../utils/supabaseClient');

router.post('/generate-image', async (req, res) => {
    try {
        const {
            symbol,
            position,
            leverage,
            close_price,
            open_price,
            profit_percentage,
            closed_position
        } = req.body;

        // Validasi input
        if (!symbol || !position || !leverage || !close_price || !open_price || !profit_percentage || !closed_position) {
            return res.status(400).json({
                error: 'Missing required fields: symbol, position, leverage, close_price, open_price, profit_percentage, closed_position'
            });
        }

        // Validasi closed_position
        if (!['win', 'loss'].includes(closed_position.toLowerCase())) {
            return res.status(400).json({
                error: 'closed_position must be either "win" or "loss"'
            });
        }

        // Validasi position
        if (!['long', 'short'].includes(position.toLowerCase())) {
            return res.status(400).json({
                error: 'position must be either "long" or "short"'
            });
        }

        // Generate image
        const imageBuffer = await imageGenerator.generateImage({
            symbol: symbol.toUpperCase(),
            position: position.charAt(0).toUpperCase() + position.slice(1).toLowerCase(),
            leverage,
            close_price,
            open_price,
            profit_percentage: profit_percentage.toString(),
            closed_position: closed_position.toLowerCase()
        });

        // Upload ke Supabase Storage
        const fileName = `trading-${symbol}-${closed_position}-${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
            .from('pnl')
            .upload(fileName, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) {
            throw new Error(`Supabase upload error: ${error.message}`);
        }

        // Dapatkan URL public
        const { data: { publicUrl } } = supabase.storage
            .from('pnl')
            .getPublicUrl(fileName);

        res.json({
            success: true,
            image_url: publicUrl,
            filename: fileName,
            details: {
                symbol,
                position,
                leverage,
                closed_position,
                profit_percentage
            }
        });

    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({
            error: 'Failed to generate image',
            details: error.message
        });
    }
});

// Endpoint untuk test
router.get('/test', (req, res) => {
    res.json({
        message: 'Trading Image Generator API is working!',
        example_request: {
            symbol: "XRPUSDT",
            position: "short",
            leverage: "125",
            close_price: "2.2093",
            open_price: "2.2229",
            profit_percentage: "76.47",
            closed_position: "win"
        }
    });
});

module.exports = router;