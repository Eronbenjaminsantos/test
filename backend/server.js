require('dotenv').config(); // Load API key from .env

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow frontend to call backend

// API Key Endpoint
app.get('/api/get-api-key', (req, res) => {
    res.json({ apiKey: process.env.API_KEY });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
