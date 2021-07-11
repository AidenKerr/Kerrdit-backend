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
        if (err)
            res.sendStatus(500);

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
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    });
});

app.get('/api/users', (req, res) => {
    db.query("SELECT username FROM users", (err, result) => {
        if (err) {
            res.status(500);
        } else {
            res.status(200).json(result);
        }
    });
})

app.get('/api/threads', (req, res) => {
    db.query('SELECT thread.id AS post_id, users.id AS op_id, username, content FROM users INNER JOIN thread ON users.id=thread.user_account_id',
    (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.status(200).json(result);
        }
    })
});

app.post('/api/threads', (req, res) => {

    const content = req.body.content;
    const op_id = req.body.op_id;

    db.query('INSERT INTO thread (content, user_account_id) VALUES (?, ?)',
    [content, op_id],
    (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        } 
    });
});


app.listen(3001, () => {
    console.log("Server listening on port 3001");
})
