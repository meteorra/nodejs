const { MongoClient, ObjectID } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
    if(err) {
        return console.log('Unable to connect to MongoDB server', err);
    }

    console.log('Connected to MongoDB server');

    // mongodb update operators
    db.collection('Users').findOneAndUpdate({
        _id: new ObjectID('59e88780cc04ce05e45afb83')
    }, {
        $set: {
            location: 'Malta'
        },
        $inc: {
            age: 1
        }
    }, {
        returnOriginal: false
    }).then((result)=> {
        console.log(result);
    }, () => {

    });

    //db.close();
});