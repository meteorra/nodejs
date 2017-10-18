const express = require('express');
const hbs = require('hbs');
const fs = require('fs');

const app = express();

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('getCurrentYear', () => new Date().getFullYear());
hbs.registerHelper('screamIt', (str) => str.toUpperCase());

app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));

app.use((req, res, next) => {
    const now = new Date().toString();
    const log = `${now} : ${req.method} ${req.url}`;
    console.log(log);
    fs.appendFile('server.log', `${log}\n`, (err) => {
        if(err) {
            console.log('Unable to append to server.log');
        }
    });
    next();
});

app.get('/', (req, res) => {
    res.render('home.hbs', {
        pageTitle: 'Home page',
        welcomeMessage: 'Hello, you are here'
    });
});

app.get('/about',(req, res) => {
    res.render('about.hbs', {
        pageTitle: 'About page',
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});