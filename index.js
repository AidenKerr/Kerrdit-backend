const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const mysql = require("mysql");

// initialize
dotenv.config();
const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: process.env.DB_PASSWORD,
    database: "kerrdit"
});
const app = express();
app.use(cors());
app.use(express.json());
const saltRounds = 10;

app.get('/', (req, res) => {
    res.send("Kerrdit Backend");
})

app.post('/api/login', (req, res) => {
    
    const username = req.body.username;
    const password = req.body.password;

    const errorMessage = "Log In Error";

    db.query('SELECT password FROM users WHERE username = ?;', username, (err, result) => {
        if (err) throw err;

        if (! result[0]) {
            res.status(401).send(errorMessage);
            return;
        }

        const hash = result[0].password;

        bcrypt.compare(password, hash, (error, result) => {
            if (error) throw error;
            
            if (result) {
                // login success
                res.status(200).json({
                    result: username
                });
            } else {
                // login fail
                res.status(401).send(errorMessage);
            }
    
        });
    });
});

app.post('/api/signup', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    
    bcrypt.hash(password, saltRounds, (err, hash) => {
        db.query('INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hash],
        (err, result) => {
            if (err) {
                res.sendStatus(400);
            } else {
                res.sendStatus(200);
            }
        })
    });
});

app.get('/api/users', (req, res) => {
    db.query("SELECT username FROM users", (err, result) => {
        if (err) {
            res.status(400).json(err);
        } else {
            res.status(200).json(result);
        }
    });
})

app.listen(3001, () => {
    console.log("Server listening on port 3001");
})