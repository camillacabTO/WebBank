const path = require('path');
const express = require('express');
const Handlebars = require("handlebars");   
const bodyParser = require('body-parser');
const expbs = require('express-handlebars');
const expressValidator = require("express-validator");
const data = require('./dataManager');
const app = express();

const PORT = process.env.PORT || 3000;

let activeUser = '';
let activeAcc = '';
const users = data.readData('./data.json');
const accounts = data.readData('./accounts.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('.hbs', expbs({ 
    defaultLayout: 'main', 
    extname: '.hbs'
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');
app.use(express.static(path.join(__dirname, 'public')));

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
    data.writeData(users, './data.json');

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
    const accNum = req.body.accountNumber;
    var doesAccExist = false;

    if (accounts.hasOwnProperty(accNum)){
        doesAccExist = true;
        activeAcc = accounts[accNum];
    }

    if (doesAccExist) {
        switch (op) {
            case 'balance':
                res.render('balance', {
                    accNumber: accNum,
                    accType: activeAcc.accountType,
                    accBalance: activeAcc.accountBalance,
                });
                break;
            case 'deposit':
                res.render('deposit', { accNumber: accNum });
                break;
            case 'withdrawal':
                res.render('withdrawal', { accNumber: accNum });
                break;
            case 'open-account': 
                res.render('openaccount');
        } 
    } else {
        if (op === 'open-account') {
            res.render('openaccount');
        } else {
            res.render('bankMain', { invalidAccount: true });
        }
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