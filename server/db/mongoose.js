const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const connection = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TodoApp', {
    useMongoClient: true,
});

connection.then(() => {
    console.log('successful db connection');
}).catch((err) => {
    console.log(`error in connection ${err}`);
});

module.exports = { mongoose };