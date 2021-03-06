const expect  = require('expect');
const request = require('supertest');
const { ObjectID} = require('mongodb');
const _ = require('lodash');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');
const { todos,
        populateTodos,
        users,
        populateUsers } = require('./seed/seed');


beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
    it('should create a new todo', (done)=>{
        const text = 'Test todo text';

        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                Todo.find({ text }).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((e) => done(e))
            })
    });

    it('should not create a todo with invalid data', (done) => {
        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({})
            .expect(400)
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((e) => done(e))
            })
    });
});

describe('GET /todos', () => {
    it('should return all todos', (done) => {
        request(app)
            .get('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(1);
            })
            .end(done);
    });
});

describe('GET /todos/:id', () => {
    it('should return a todo by id', (done) => {
        const id = todos[0]._id;

        request(app)
            .get(`/todos/${id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });

    // one more case - user can't fetch not his own item

    it('should return a 404 if todo is not found', (done) => {
        const id = new ObjectID();

        request(app)
            .get(`/todos/${id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return a 404 if todoId is not valid', (done) => {
        const id = 123;

        request(app)
            .get(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo by id', (done) => {
        const id = todos[1]._id.toHexString();

        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(id);
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                Todo.findById(id).then((todo) => {
                    expect(todo).toBeFalsy();
                    done();
                }).catch((e) => done(e))
            });
    });

    // one more case - user can't fetch not his own item

    it('should return a 404 if todo is not found', (done) => {
        const id = new ObjectID();

        request(app)
            .delete(`/todos/${id.toHexString()}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return a 404 if todoId is not valid', (done) => {
        const id = 123;

        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('PATCH /todos/:id', () => {
    it('should update a todo by id', (done) => {

        const id = todos[1]._id.toHexString();
        const body = {
            text: 'Patch updated todo',
            completed: true,
        };

        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send(body)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(body.text);
                expect(res.body.todo.completed).toBeTruthy();
                expect(typeof res.body.todo.completedAt).toBe('number');
            })
            .end(done);
    });

    // one more case - user can't fetch not his own item

    it('should clear completedAt when todo is not completed', (done) => {
        const id = todos[1]._id.toHexString();
        const body = {
            text: 'Patch updated todo one more time',
            completed: false,
        };

        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send(body)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(body.text);
                expect(res.body.todo.completed).toBeFalsy();
                expect(res.body.todo.completedAt).toBeFalsy();
            })
            .end(done);
    });
});

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get(`/users/me`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);
            })
            .end(done);
    });

    it('should return 401 if not authenticated', (done) => {
        request(app)
            .get(`/users/me`)
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('POST /users', () => {
    it('should create a user', (done) => {
        const email = 'email@email.com';
        const password = '123pass';

        request(app)
            .post(`/users`)
            .send({ email, password})
            .expect(200)
            .expect((res) => {
                expect(typeof res.headers['x-auth']).toBe('string');
                expect(res.body.email).toBe(email);
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                User.findOne({ email }).then((user) => {
                    expect(user.email).toBe(email);
                    done();
                }).catch((e) => done(e))
            });
    });

    it('should return validation errors if request invalid', (done) => {
        const email = 'email@email';
        const password = '12';

        request(app)
            .post(`/users`)
            .send({ email, password})
            .expect(400)
            .end(done);
    });

    it('should not create a user if email is in use', (done) => {
        const email = 'user1@users.com';
        const password = 'user1pass';

        request(app)
            .post(`/users`)
            .send({ email, password})
            .expect(400)
            .end(done);
    });
});

describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {

        const email = users[1].email;
        const password = users[1].password;

        request(app)
            .post(`/users/login`)
            .send({ email, password})
            .expect(200)
            .expect((res) => {
                expect(typeof res.headers['x-auth']).toBe('string');
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens[1].token).toBe(res.headers['x-auth']);
                    done();
                }).catch((e) => done(e))
            });
    });

    it('should reject invalid login', (done) => {
        const email = users[1].email;
        const password = 'login123';

        request(app)
            .post(`/users/login`)
            .send({ email, password})
            .expect(400)
            .expect((res) => {
                expect(typeof res.headers['x-auth']).toBe('undefined');
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(1);
                    done();
                }).catch((e) => done(e))
            });
    })
});

describe('POST /users/me/token', () => {

    it('should delete auth token', (done) => {

        request(app)
            .delete(`/users/me/token`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch((e) => done(e))
            });
    });
});