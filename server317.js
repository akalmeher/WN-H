var express = require('express');
var app = express();
var path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');
const crypto = require('crypto');


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

const generatePasswordResetToken = () => {
    return crypto.randomBytes(20).toString('hex');
};

const setPasswordResetToken = (email, token) => {
    const expirationTime = new Date(Date.now() + 3600000); // 1 hour from now
    const sql = 'UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?';

    return new Promise((resolve, reject) => {
        db.query(sql, [token, expirationTime.toISOString().slice(0, 19).replace('T', ' '), email], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

app.post('/verify-user', async (req, res) => {
    const { email, username } = req.body;
    const token = generatePasswordResetToken(email);
    await setPasswordResetToken(email, token); 

    try {
        // SQL query to find user by email and username
        const sql = 'SELECT * FROM users WHERE email = ? AND username = ?';
        db.query(sql, [email, username], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server error');
            }

            if (result.length === 0) {
                // No matching user found
                return res.status(404).send('No account found with that email and username.');
            } else {
                // User found
                res.send('User verified. Redirecting to password reset.');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Reset Password endpoint
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    try {
        // Check if token is valid and not expired
        const sql = 'SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()';
        db.query(sql, [token], async (err, users) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server error');
            }

            if (users.length === 0) {
                return res.status(400).send('Invalid or expired token');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 8);

            // Update the user's password and clear reset token fields
            const updateSql = 'UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?';
            db.query(updateSql, [hashedPassword, users[0].id], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).send('Error updating password');
                }
                res.send('Password reset successfully');
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



// Chat interface requests
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
    // Placeholder
    return "Echo: " + message;
}

app.post('/chatbot', async (req, res) => {
    const { message } = req.body;

    try {
        const botResponse = await queryOpenAI(message);
        res.json({ response: botResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


var port = 3000;
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
});

var message = 'CSC-317 startup template\n'
             + 'This template uses nodeJS, express, and express.static\n';
console.log(message);
