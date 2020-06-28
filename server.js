const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chat-Bot';

//run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // welcome
    socket.emit('message', formatMessage(botName, 'Welcome!'));

    //broadcast on connection
    socket.broadcast.to(user.room).emit('message',
    formatMessage(botName,  `${user.username} has connected on chat`));

      // send users and room info
      io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
      });
    });


  //listen for chat messages
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });


//broadcast on disconnection
socket.on('disconnect', () => {
  const user = userLeave(socket.id);

  if(user){
    io.to(user.room).emit('message', formatMessage(botName, `${user.username} Disconnected Chat`)
    );

    // send users and room info
    io.to(user.room).emit({
      room: user.room,
      users: getRoomUsers(user.room)
    });

  }
});
});


server.listen(3000, function() {
  console.log("Server started on port 3000");
});
