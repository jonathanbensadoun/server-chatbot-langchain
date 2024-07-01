require ('dotenv').config();

const express = require('express');
const session = require('express-session'); 
const cors = require('cors')

const app = express();
const PORT = process.env.PORT || 3000;
const router = require('./app/routers/router');

app.use(express.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true
}));

app.use(express.static('assets'));
app.use(cors('*'));

app.use(express.json());
app.use('/api',router)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});