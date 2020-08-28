const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app)
const socketio = require('socket.io');
const io = socketio(server);
const {userJoin, getUserRoom , getCurrentUser,removeUser} = require('./users')

app.use(express.static('public'))

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`))


io.on('connection', socket => {
    socket.on('userJoin', ({name, room}) => {
        const user = userJoin(socket.id, name, room);

        if(user){
            socket.join(user.room)
            io.to(user.room).emit('conn', {users: getUserRoom(user.room), userLeft: null})
            socket.broadcast.to(user.room).emit('msg', `${user.username} has joined`)

            socket.on('drawing', mouse => {
                socket.broadcast.to(user.room).emit('drawing', mouse)
            })

            socket.on('penUp', () => {
                socket.broadcast.to(user.room).emit('penUp')
            })

            socket.on('clear', () => {
                socket.broadcast.to(user.room).emit('clear')
            })

            socket.on('chatMsg', msg => {
                io.to(user.room).emit('chatMsg', {name: getCurrentUser(user.id).username, msg})
            })

            socket.on('nextTurn', nextPlayer => {
                io.to(user.room).emit('nextTurn', nextPlayer)
            })

            socket.on('timer', time => {
                io.to(user.room).emit('timer', time)
            })

            socket.on('guessed', name => {
                io.to(user.room).emit('guessed', name)
            })

            socket.on('word', word => {
                io.to(user.room).emit('word', word)
            })

            socket.on('gameover', () => {
                io.to(user.room).emit('gameover')
            })
        }
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('conn', {users: getUserRoom(user.room), userLeft: user.username})
            socket.broadcast.to(user.room).emit('msg', `${user.username} has left`)
        }
    })
})