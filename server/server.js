const config = require('./config/config');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const { mongoose } = require('./db/mongoose');
const { authenticate } = require('./middleware/authenticate');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();

app.use(bodyParser.json());

app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send({ todos });
    }, (err) => {
        res.status(400).send(err);
    });
});

app.post('/todos', (req, res) => {
    const todo = new Todo({
        text: req.body.text,
    });

    todo.save().then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
});

app.get('/todos/:id', (req, res) => {

    if(!ObjectID.isValid(req.params.id)) {
        return res.status(404).send();
    }

    Todo.findById(req.params.id).then((todo) => {
        if(!todo) {
            return res.status(404).send();
        }
        res.send({ todo });
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.delete('/todos/:id', (req, res) => {

    const id = req.params.id;

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Todo.findByIdAndRemove(id).then((todo) => {
        if(!todo) {
            return res.status(404).send();
        }
        res.send({ todo });
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.patch('/todos/:id', (req, res) => {
    const id = req.params.id;
    const body = _.pick(req.body, ['text', 'completed']);

    if(!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    if(_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime()
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
        if(!todo) {
            return res.status(404).send();
        }
        res.send({ todo });
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.post('/users', (req, res) => {
    const user = new User(_.pick(req.body, ['email', 'password']));

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((err) => {
        res.status(400).send(err);
    })
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        });
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.listen(process.env.PORT, function () {
    console.log(`Example app listening on port ${process.env.PORT}!`)
});

module.exports = { app };