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
    db.query(`SELECT threads.id, users.id AS user_id, subkerrdits.name AS subkerrdit, username, subject
                FROM users
                    INNER JOIN threads ON users.id=threads.user_id
                    INNER JOIN subkerrdits ON threads.sub_id=subkerrdits.id`,
    (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.status(200).json(result);
        }
    })
});

app.post('/api/threads', (req, res) => {

    const subject = req.body.subject;
    const user_id = req.body.user_id; // the thread poster
    const sub_id = req.body.sub_id; // the subkerrdit in which it is posted

    db.query('INSERT INTO threads (subject, user_id, sub_id) VALUES (?, ?, ?)',
    [subject, user_id, sub_id],
    (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.post('/api/subkerrdits', (req, res) => {
    const name = req.body.name;

    db.query('INSERT INTO subkerrdits (name) VALUES (?)', name,
    (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.get('/api/subkerrdits', (req, res) => {
    db.query('SELECT * FROM subkerrdits',
    (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.status(200).json(result);
        }
    });
});

// inserting parent replies to posts
// TODO add functionality for replies
app.post('/api/posts', (req, res) => {

    const thread_id = req.body.thread_id;
    const message = req.body.message;
    const user_id = req.body.user_id;

    db.query('INSERT INTO posts (thread_id, message, user_id) VALUES (?, ?, ?)',
    [thread_id, message, user_id],
    (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.post('/api/posts/upvote', (req, res) => {
    const post_id = req.body.post_id;
    
    db.query('UPDATE posts SET points = points + 1 WHERE id = ?',
    [post_id],
    (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});


// This endpoint returns the sum of the points for each post a user has made.
// While the database queries the posts table, the data is concerning the user, hence the URL
app.get('/api/users/karma', (req, res) => {

    const user_id = req.body.user_id;

    db.query('SELECT SUM(points) AS karma FROM posts WHERE user_id=?', user_id,
    (err, result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.status(200).json(result);
        }
    });
});


// get all posts from a given user
app.get('/api/:username/threads', (req, res) => {

    const username = req.params.username;

    db.query(`SELECT threads.id, users.id AS user_id, subkerrdits.name AS subkerrdit, username, subject
                FROM users
                    INNER JOIN threads ON users.id=threads.user_id
                    INNER JOIN subkerrdits ON threads.sub_id=subkerrdits.id
                WHERE username=?`, username,
    (err, result) => {
        if (err) {
            console.log(err)
            res.sendStatus(500);
        } else {
            res.status(200).json(result);
        }
    });
});

app.listen(3001, () => {
    console.log("Server listening on port 3001");
});
