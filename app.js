var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var io = require('socket.io');
var http = require('http');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))



app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.get('/', function(req, res) {

    res.render('chat.handlebars', {});
})

var httpServer = http.createServer(app);
var ioserver = io(httpServer);
var users = [];

ioserver.on('connection', function(socket) { // step 3: Handle  standard event 'connection' on io object and receive a client socket
    console.log('a user connected');

    socket.on('disconnect', function() { //step 4: write a handler for the 'disconnect' event on the client socket
        delete users[socket.nickname];
        ioserver.emit('usernames', Object.keys(users));
    });
    socket.on('client-message', function(data) {
        ioserver.emit('new-msg', socket.nickname + ': ' + data)

    })
    socket.on('private-c-message', function(toPerson, message) {
        if (toPerson in users) {
            users[toPerson].emit('private-s-msg', socket.nickname + ': ' + message)
            users[socket.nickname].emit('private-s-msg', socket.nickname + ': ' + message)
        } else {
            users[socket.nickname].emit('private-s-msg-error', "Private msg was not sent. User doesn't exist.")
        }
    })

    socket.on('new-user', function(data, callback) { // step 5: write handler for various user events 

        console.log('new user request received')
        if (data in users) {
            callback(false);
            console.log(data)
        } else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            ioserver.emit('usernames', Object.keys(users));
        } // step 6: use io.emit method on io to broadcast ao all connected users
    });
});

var port = process.env.PORT || 3000;
httpServer.listen(port, function() {
    console.log('server is online');
})