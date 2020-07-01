const path = require('path');
const express = require('express');
const Handlebars = require("handlebars");   
const bodyParser = require('body-parser');
const expbs = require('express-handlebars');
const expressValidator = require("express-validator");
const data = require('./users');
const app = express();

const PORT = process.env.PORT || 3000;

let activeUser = '';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('.hbs', expbs({ 
    defaultLayout: 'main', 
    extname: '.hbs'
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');
app.use(express.static(path.join(__dirname, 'public')));

const users = data.readData();

Handlebars.registerHelper('createAccountNumber', function () {
    return Math.floor(Math.random() * 10000000); // generate random account number 
});

app.use(expressValidator());

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/balance', (req, res) => {
    res.render('balance');
});

app.post('/register', (req, res) => {

    req.check("email", "Invalid email address").isEmail();							 
	req.check("password", "Password must contain 8 or more characters").isLength({min: 8});
    req.check("password", "Mismatched Password and Confirm Password").equals(req.body.passwordConfirmation);

    var errorArray = req.validationErrors();

    let found = users.find((user) => user.email === req.body.email);
    console.log(`${req.body.email} ${req.body.password} ${req.body.passwordConfirmation}`);
    if (!found) { // failure
        if (errorArray) {
            res.render('register' , { errors: errorArray });
        } else {
            users.push({ email: req.body.email, password: req.body.password});
            res.render('index', { didRegistered: true });
        }
    } else {
        res.render('register', { doesExist: true }); // success
    }
    data.writeData(users);

});

app.get('/login', (req, res) => {
    res.render('index');
});

app.post('/login', (req, res) => {
    let found = users.find((user) => user.email === req.body.email);
    if (found) {
        if (found.password === req.body.password) {
            activeUser = req.body.email;
            res.render('bankMain', { activeUser: activeUser });
        } else {
            res.render('index', {
                wrongPassword: true
            });
        };
    } else {
        res.render('index', {
            notRegistered: true
        });
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/operation', (req, res) => {
    const op = req.body.operation;
    console.log(`${req.body.operation}`);

    switch (op) {
        case 'balance':
            res.render('balance');
            break;
        case 'deposit':
            res.render('deposit');
            break;
        case 'withdrawal':
            res.render('withdrawal');
            break;
        case 'open-account':
            res.render('openaccount');
        // break;
    }
});

app.post('/main', (req, res) => {
    let accountType = req.body.typeofaccount;
    console.log(accountType);

    res.render('bankMain', { 
    accountCreated: true,
    activeUser: activeUser,
    accountType: (accountType === 'checking') ? 'Checking' : 'Savings'
    });
});

app.listen(PORT, function() {
    console.log(`Listening on port ${PORT}`);
});