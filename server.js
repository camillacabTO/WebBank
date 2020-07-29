const path = require('path');
const express = require('express');
const Handlebars = require("handlebars");   
const bodyParser = require('body-parser');
const expbs = require('express-handlebars');
const expressValidator = require("express-validator");
const mongoose = require('mongoose');
const sessions = require("client-sessions");
const data = require('./dataManager');
const Client = require('./models/Client');

const PORT = process.env.PORT || 3000;
const app = express();
mongoose.connect('mongodb://localhost/WebBank', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

let activeAcc = '';
let accNum;

const users = data.readData('./data.json');
const accounts = data.readData('./accounts.json');
console.log(accounts);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('.hbs', expbs({ 
    defaultLayout: 'main', 
    extname: '.hbs'
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressValidator());
app.use(sessions({
    cookieName: 'userSession',
    secret: 'cmpaeifpafjkpoaekpckcaoepkp', 
	duration: 5 * 60 * 1000,											
	activeDuration: 1 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true   
  }));

app.get('/', (req, res) => { // redirect the user to the login page if '/' is used
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
            Client.create({
                Username: req.body.email,
                Chequing: null,
                Savings: null
            }, (error, client) => {
                console.log(error, client);
            });
            res.render('index', { didRegistered: true });
        }
    } else {
        res.render('register', { doesExist: true }); // success
    }
    data.writeData(users, './data.json');

});

app.get('/login', (req, res) => {
    req.userSession.username = 'Unknown';
    res.render('index');
});

app.post('/login', (req, res) => {
    let found = users.find((user) => user.email === req.body.email);
    if (found) {
        if (found.password === req.body.password) {
            req.userSession.username = req.body.email;
            Client.find({Username: req.body.email}, (error, client) => { 
                console.log(error, client);
                req.userSession.savings = client[0].Savings;
                req.userSession.chequing = client[0].Chequing;
                res.render('bankMain', { 
                    activeUser: req.userSession.username,
                    Chequing: req.userSession.chequing,
                    Savings: req.userSession.savings
                 });
            });
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
    accNum = req.body.accountNumber;
    var doesAccExist = false;

    if (accounts.hasOwnProperty(accNum)){
        doesAccExist = true;
        activeAcc = accounts[accNum];
    }

    if (op !== 'open-account' && doesAccExist) {
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
        } 
    } else if (op === 'open-account') {
        res.render('openaccount');
    } else {
        res.render('bankMain', { 
            invalidAccount: true, 
            activeUser: req.userSession.username,
            Chequing: req.userSession.chequing,
            Savings: req.userSession.savings 
        });
    }
});

app.post('/main', (req, res) => {
    let accountType = req.body.typeofaccount;
    var newAccNum = ++accounts.lastID;
    console.log(accounts.lastID, newAccNum);

    Client.find({Username: req.userSession.username}, (error, client) => { 
        console.log(error, client);
        console.log(client);
        console.log(client[0][accountType]);
        if (client[0][accountType] === null) {
            if (accountType == 'Chequing') {
                Client.findByIdAndUpdate(client[0].id, { Chequing: newAccNum }, (error, client) => console.log(error, client));
                req.userSession.chequing = newAccNum;
            } else {
                Client.findByIdAndUpdate(client[0].id, { Savings: newAccNum }, (error, client) => console.log(error, client));
                req.userSession.savings = newAccNum;
            }

            accounts[newAccNum] = {
                "accountType": accountType,
                "accountBalance": 0.00
            };

            data.writeData(accounts, './accounts.json');

            res.render('bankMain', { 
            accountCreated: true,
            activeUser: req.userSession.username,
            accountType: (accountType === 'Chequing') ? 'Chequing' : 'Savings',
            createdAccountNumber: newAccNum,
            Chequing: req.userSession.chequing,
            Savings: req.userSession.savings
            });
        } else {
            res.render('openaccount', { accAlreadyExists: true });
        }
    });
         

});

app.post('/d', (req, res) => {
    let amount = parseFloat(req.body.depositAmount);
    activeAcc.accountBalance += amount;

    data.writeData(accounts, './accounts.json');
    res.render('bankMain', {
        activeUser: req.userSession.username,
        Chequing: req.userSession.chequing,
        Savings: req.userSession.savings  
    }); 
});

app.post('/w', (req, res) => {
    let amount = parseFloat(req.body.withdrawalAmount);

    if (amount <= activeAcc.accountBalance) {
        activeAcc.accountBalance -= amount;
        data.writeData(accounts, './accounts.json');
        res.render('bankMain', { 
            activeUser: req.userSession.username,
            Chequing: req.userSession.chequing,
            Savings: req.userSession.savings
        });
    } else {
        res.render('withdrawal', { 
            insufficientFunds: true,
            accNumber: accNum
         });
    }
});

app.get('/logout', function (req, res) {
    req.userSession.reset();
    res.render('index');
  });

app.listen(PORT, function() {
    console.log(`Listening on port ${PORT}`);
});

//format account amount to 2 decimals
// move operations to another file
// fix dropdown bar
// create Atlas account
// clean up