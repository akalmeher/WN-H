var express = require('express');
var app = express();
var path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'student',
    password: 'student',
    database: 'AICHAT'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Serve static files from the "public" directory
var StaticDirectory = path.join(__dirname, 'public');
app.use(express.static(StaticDirectory));

// Middleware to parse JSON data
app.use(express.json());

// Registration endpoint
app.post('/register', (req, res) => {
    console.log("Received data:", req.body); // Log the received data
    const { username, email, password } = req.body;

    if (!password) {
        return res.status(400).send('Password is required');
    }

    bcrypt.hash(password, 8, (err, hash) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }

        const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(sql, [username, email, hash], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error registering new user');
            }
            res.send('User registered successfully');
        });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (err, users) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }

        if (users.length === 0) {
            return res.status(401).send('Incorrect username or password');
        }

        bcrypt.compare(password, users[0].password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server error');
            }
            if (isMatch) {
                res.send('Logged in successfully');
            } else {
                res.status(401).send('Incorrect username or password');
            }
        });
    });
});

app.post('/chatbot', async (req, res) => {
    const userMessage = req.body.message;
    
    try {
        const botResponse = await processChatMessage(userMessage);
        res.json({ response: botResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function processChatMessage(message) {
    // Process the message
    // This is a placeholder - the actual implementation will depend on your requirements
    return "Echo: " + message; // For example, a simple echo response
}

var port = 3000;
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
});

var message = 'CSC-317 startup template\n'
             + 'This template uses nodeJS, express, and express.static\n';
console.log(message);
