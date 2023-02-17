const path = require('path')
const express = require('express')
const Handlebars = require('handlebars')
const bodyParser = require('body-parser')
const expbs = require('express-handlebars')
const expressValidator = require('express-validator')
const mongoose = require('mongoose')
const sessions = require('client-sessions')
const data = require('./dataManager')
const Client = require('./models/Client')
const operationRouter = require('./routes/operation')
require('dotenv').config()

const PORT = process.env.PORT || 3000
const app = express()
// mongoose.connect('mongodb://localhost/WebBank', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('connected to Database'))
// const db = mongoose.connection
// db.on('error', (error) => console.error(error))
// db.once('open', () => console.log('Connected to Database'))

const users = data.readData('./data.json')
const accounts = data.readData('./accounts.json')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.engine(
  '.hbs',
  expbs({
    defaultLayout: 'main',
    extname: '.hbs',
  })
)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', '.hbs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(expressValidator())
app.use(
  sessions({
    cookieName: 'userSession',
    secret: 'cmpaeifpafjkpoaekpckcaoepkp',
    duration: 5 * 60 * 1000,
    activeDuration: 1 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true,
  })
)

app.use('/operation', operationRouter)

app.get('/', (req, res) => {
  // redirect the user to the login page if '/' is used
  res.redirect('/login')
})

app.get('/logout', function (req, res) {
  req.userSession.reset()
  res.render('index')
})

app
  .route('/register')
  .get((req, res) => {
    res.render('register')
  })
  .post(async (req, res) => {
    // checking if email and password are valid
    req.check('email', 'Invalid email address').isEmail()
    req
      .check('password', 'Password must contain 8 or more characters')
      .isLength({ min: 8 })
    req
      .check('password', 'Mismatched Password and Confirm Password')
      .equals(req.body.passwordConfirmation)
    // saving potential invalid information errors into an array
    var errorArray = req.validationErrors()
    //checking if email provided is already registered
    let found = users.find((user) => user.email === req.body.email)

    if (!found) {
      //if email not registered but info provided is not valid, display alerts
      if (errorArray) {
        res.render('register', { errors: errorArray })
      } else {
        // if email not registered and information is valid. Create a new user and associate him /her with two non-existent chequing and savings account (empty slots)
        users.push({ email: req.body.email, password: req.body.password })
        data.writeData(users, './data.json')
        const newClient = new Client({
          Username: req.body.email,
          Chequing: null,
          Savings: null,
        })
        try {
          await newClient.save()
          console.log(newClient)
          // confirm successful registration of new user
          res.render('index', { didRegistered: true })
        } catch (error) {
          console.error(error)
        }
      }
    } else {
      // email already registered
      res.render('register', { doesExist: true })
    }
  })

app
  .route('/login')
  .get((req, res) => {
    req.userSession.username = 'Unknown'
    res.render('index')
  })
  .post(async (req, res) => {
    // checking if user is registered
    let found = users.find((user) => user.email === req.body.email)
    if (found) {
      // if user already exists, checking if password is correct
      if (found.password === req.body.password) {
        // if user existis and password is correct, save username in the cookie
        req.userSession.username = req.body.email
        // finding accounts associated to this user
        const client = await Client.findOne({ Username: req.body.email })
        try {
          console.log(client)
          // saving accounts numbers in the cookie (current session)
          req.userSession.savings = client.Savings
          req.userSession.chequing = client.Chequing
          // display main menu with user's email and accounts
          res.render('bankMain', {
            activeUser: req.userSession.username,
            Chequing: req.userSession.chequing,
            Savings: req.userSession.savings,
          })
        } catch (error) {
          console.error(error)
        }
      } else {
        // user exists but password is wrong
        res.render('index', {
          wrongPassword: true,
        })
      }
    } else {
      // user not found
      res.render('index', {
        notRegistered: true,
      })
    }
  })

app.post('/main', async (req, res) => {
  // open a new account route
  let accountType = req.body.typeofaccount // store type of account selected
  var newAccNum = ++accounts.lastID // store the number of the new account
  const currClient = await Client.findOne({
    Username: req.userSession.username,
  }) // find in the database account numbers related to this client
  try {
    if (currClient[accountType] === null) {
      // if the client does not have the type of account selected (null), create a new one based on selection
      accounts[newAccNum] = {
        // add new account information to accounts.json to manage balance
        accountType: accountType,
        accountBalance: 0.0,
      }
      data.writeData(accounts, './accounts.json')

      if (accountType == 'Chequing') {
        req.userSession.chequing = newAccNum // store acc number in the user session to appear in the dropdown menu
        try {
          // create and store chequings account related to this client
          await Client.findByIdAndUpdate(currClient.id, {
            Chequing: newAccNum,
          })
        } catch (error) {
          console.error(error)
        }
      } else {
        // create and store savings account related to this client
        req.userSession.savings = newAccNum
        try {
          await Client.findByIdAndUpdate(currClient.id, { Savings: newAccNum })
        } catch (error) {
          console.error(error)
        }
      }
      res.render('bankMain', {
        // display main page confirming that new account was created
        accountCreated: true,
        activeUser: req.userSession.username,
        createdAccountNumber: newAccNum,
        Chequing: req.userSession.chequing,
        Savings: req.userSession.savings,
        accountType,
      })
    } else {
      // if client already have account selected, display alert
      res.render('openaccount', { accAlreadyExists: true, accountType })
    }
  } catch (error) {
    console.error(error)
  }
})

app.listen(process.env.PORT, function () {
  console.log(`Listening on port ${process.env.PORT}`)
})
