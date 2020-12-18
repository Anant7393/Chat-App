const { Socket } = require('dgram')
const express=require('express')
const http=require('http')
const path=require('path')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessages,generateLocationMessages}=require('./utils/messages')
const {addUser,getUser,getUsersInRoom,removeUser}=require('./utils/users')

const app=express()
const server=http.createServer(app)
const io=socketio(server)

const publicPathDirectory=path.join(__dirname,'../public')
const PORT=process.env.PORT

app.use(express.static(publicPathDirectory))

io.on('connection',(socket)=>{
    console.log('New web socket connection')

    socket.on('join',({username,room},callback)=>{

        const {user,error}=addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message',generateMessages('Admin','Welcome !!'))
        socket.broadcast.to(user.room).emit('message',generateMessages('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(msz,callback)=>{
        const user=getUser(socket.id)
        const filter=new Filter()
        if(filter.isProfane(msz)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessages(user.username,msz))
        callback('Delivered !')
    })

    socket.on('sendLocation',(lat,long,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessages(user.username,`https://google.com/maps?q=${lat},${long}`))
        callback()
    })
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessages('Admin',`${user.username} has left`))
        }
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
    })
})

server.listen(PORT,()=>console.log('Server is on port ',PORT))