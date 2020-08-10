const express = require('express');
const router = express.Router();
const data = require('../dataManager');

let activeAcc = '';
let accNum;
const accounts = data.readData('./accounts.json');

// POST to /operation
router.post('/', (req, res) => {
    const op = req.body.operation;
    accNum = req.body.accountNumber; // store account number selected (in the dropdown menu) to be used in the operations
    var doesAccExist = false;

    if (accounts.hasOwnProperty(accNum)){ // confirming if account exists
        doesAccExist = true;
        activeAcc = accounts[accNum]; // if exists pull information from this account and store in this variable
    }

    if (op !== 'open-account' && doesAccExist) { // if account exists user can deposit, withdrawal or see balance
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
    } else if (op === 'open-account') { // display open account page. Does not need to have an existing account to display this page
        res.render('openaccount');
    } else { // User trying to access deposit, withdrawal or balance without selecting an valid account
        res.render('bankMain', { 
            invalidAccount: true, 
            activeUser: req.userSession.username,
            Chequing: req.userSession.chequing,
            Savings: req.userSession.savings 
        });
    }
});

router.post('/d', (req, res) => { // make deposit
    let amount = parseFloat(req.body.depositAmount);
    activeAcc.accountBalance += amount;

    data.writeData(accounts, './accounts.json');
    res.render('bankMain', {
        activeUser: req.userSession.username,
        Chequing: req.userSession.chequing,
        Savings: req.userSession.savings  
    }); 
});

router.post('/w', (req, res) => { 
    let amount = parseFloat(req.body.withdrawalAmount);

    if (amount <= activeAcc.accountBalance) { // only allow withdrawals if the amount is less than what is available (balance)
        activeAcc.accountBalance -= amount;
        data.writeData(accounts, './accounts.json');
        res.render('bankMain', { 
            activeUser: req.userSession.username,
            Chequing: req.userSession.chequing,
            Savings: req.userSession.savings
        });
    } else { // if withdrawal amount is higher than balance, show message
        res.render('withdrawal', { 
            insufficientFunds: true,
            accNumber: accNum
         });
    }
});

module.exports = router;