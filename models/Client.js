const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClientSchema = new Schema ({
    Username: String,
    Chequing: Number,
    Savings: Number
});

const Client = mongoose.model('Client', ClientSchema); 

module.exports = Client;  