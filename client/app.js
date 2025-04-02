const express = require("express");
const mysql = require("mysql");
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');

dotenv.config(); // Make sure this is only called once

const app = express();

// Database connection
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Set public directory
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(cors()); // Allow frontend to call backend

app.set('view engine', 'hbs');

// Connect to MySQL
db.connect((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("✅ MySQL connected...");
    }
});

app.use(cors({
    origin: 'http://localhost:3000', // or whatever your frontend runs on
    credentials: true
  }));  

// Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

// API Key Endpoint
app.get('/api/get-api-key', (req, res) => {
    res.json({ apiKey: process.env.API_KEY });
});

// Start server on a single port
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
