const path = require('path');
const express = require('express');
const Handlebars = require("handlebars");   
const bodyParser = require('body-parser');
const expbs = require('express-handlebars');
const data = require('./users');
const app = express();

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
    return Math.floor(Math.random() * 10000000);
});

app.post('/register', (req, res) => {
    let found = users.find((user) => user.email === req.body.email);
    console.log(`${req.body.email} ${req.body.password}`);
    if (!found) {
        users.push({ email: req.body.email, password: req.body.password});
        res.render('index', { didRegistered: true });
    } else {
        res.render('register', { doesExist: true });
    }
    data.writeData(users);
});

app.get('/login', (req, res) => {
    // res.json(users);
    res.render('index');
});

app.post('/login', (req, res) => {
    let found = users.find((user) => user.email === req.body.email);
    // console.log(`${found.email} ${found.password}`);
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
    // res.json(users);
    res.render('register');
});

app.post('/openaccount', (req, res) => {
    // res.send(`You have selected: ${req.body.operation}`);
    console.log(`${req.body.operation}`);
    res.render('openaccount');
});

app.post('/accountcreated', (req, res) => {
    let accountType = req.body.typeofaccount;
    console.log(accountType);
    if (accountType === 'checking') {
        res.render('bankMain', { 
            accountCreated: true,
            accountType: 'Checking',
            activeUser: activeUser
        });
    } else {
        res.render('bankMain', { 
            accountCreated: true,
            accountType: 'Savings'
        });
    }
});

app.listen(5000);