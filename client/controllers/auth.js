const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { error } = require("console");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).render('login', {
                message: 'Please provide email and password'
            })
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            console.log(results); // Debugging: Check what results return
        
            // ✅ Fix: Check if results exist before accessing results[0].password
            if (!results || results.length === 0) {
                return res.status(401).render('login', {
                    message: 'Email or password is incorrect'
                });
            }
        
            const isMatch = await bcrypt.compare(password, results[0].password);
            if (!isMatch) {
                return res.status(401).render('login', {
                    message: 'Email or password is incorrect'
                });
            }
        
            const id = results[0].id;
        
            const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            });
            console.log("The token is: " + token);
        
            const cookieOptions = {
                expires: new Date(
                    Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                ),
                httpOnly: true
            };
        
            res.cookie('jwt', token, cookieOptions);
            res.status(200).redirect("/");
        });        

    } catch (error) {
        console.log(error)
    }
}

exports.register = (req, res) => {
    console.log(req.body);

    const { name, email, password, passwordConfirm } = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
        }

        if (results.length > 0) {
            return res.render('register', {
                message: 'that email has been used'
            })
        } else if (password !== passwordConfirm) {
            return res.render('register', {
                message: 'The password do not match!'
            })
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO users SET ? ', { name: name, email: email, password: hashedPassword }, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                console.log(results);
                return res.render('register', {
                    message: 'User registered'
                });
            }
        })


    });
}

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
                if (!result || result.length === 0) {
                    return next();
                }

                // Capitalize the first letter of the name
                let user = result[0];
                user.name = user.name.charAt(0).toUpperCase() + user.name.slice(1).toLowerCase();

                req.user = user;
                return next();
            });
        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
};


exports.logout = async (req, res) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2*1000),
        httpOnly: true
    });

    res.status(200).redirect('/');
}