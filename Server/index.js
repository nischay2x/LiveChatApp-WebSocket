let users = require('./models/users.json')
let chatWindows = require('./models/chatWindows.json')


const WebSocket = require('ws');

const webSocketServer = new WebSocket.Server({ port: 8080 });

webSocketServer.on('connection', webSocket => {
  webSocket.on('message', message => {

    let msg = JSON.parse(message.toString())
    webSocket.id = msg.from
    
    if(msg.text){
      let reciever = users.find(us => us.id === msg.to)
      if(reciever.online){
        updateChatWindow(msg)
        sendTo(`${message}`, msg.to)
      } else {
        updateChatWindow(msg)
      }
      webSocket.send(`${message}`)
    } else {
      let sender = users.find(us => us.id === msg.from)
      sender.online = true
    }

  });

  webSocket.on('close', () => {
    const closer = users.find(us => us.id === webSocket.id)
    if(closer) closer.online = false
  })

});

function sendTo(data, id) {
  webSocketServer.clients.forEach(client => {
      if(client.id == id){
          if(client.readyState === WebSocket.OPEN) {
            client.send(''+data);
          }
        }
  });
}

function updateChatWindow(msg) {
  let chatWindow = chatWindows.find(win => (win.participants.includes(msg.to) && win.participants.includes(msg.from)))
  if (chatWindow) {
    chatWindow.chats.push({
      timestamp: msg.timestamp,
      from: msg.from,
      text: msg.text
    })
  } else {
    chatWindows.push({
      participants: [msg.from, msg.to],
      chats: [{
        timestamp: msg.timestamp,
        from: msg.from,
        text: msg.text
      }]
    })
  }
}

const express = require('express')
const app = express()
const cors = require('cors')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended : true }))

app.listen(5000, () => {
  console.log('Express Server Started');
})

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(us => us.email === email )
  if(user){
    if(user.password === password){

      user.online = true;

      let friendList = []
      users.forEach(us => {
        if( us.email !== email ){
          friendList.push({
            id : us.id, 
            profile : us.profile,
            name : us.name,
            online : us.online
          })
        }
      })

      const userInfo = { id : user.id, name : user.name, online : user.online, profile : user.profile }

      res.status(200).json({status : 1, user : userInfo, friends : friendList  })
    } 
    else res.status(200).json({status : 0, msg : 'Wrong Password !'})
  } else {
    res.status(200).json({status : 0, msg : 'User Does not Exist !'})
  }

})

app.post('/chats', (req, res) => {
  const { friend, host } = req.body;

  const chatWindow = chatWindows.find(win => ( win.participants.includes(friend) && win.participants.includes(host) ) )

  const reqFriend = users.find(us => us.id === friend )
  const reqFriendInfo = { id : reqFriend.id, name : reqFriend.name, profile : reqFriend.profile, online : reqFriend.online }

  if(chatWindow){
    res.status(200).json({ status : 1, chats : chatWindow.chats, friend : reqFriendInfo })
  } else {
    res.status(200).json({status : 1, chats : [], friend : reqFriendInfo })
  }

})

app.post('/register', (req, res) => {
  const { email, password, name, profile } = req.body;

  const user = users.find(us => us.email === email)
  if(user){
    res.status(200).json({status : 0, msg : 'User Already Exist'})
  } else {
    const totalUsers = users.length;
    const newUid = (totalUsers > 9) ? `U0${totalUsers+1}` : `U00${totalUsers+1}`
    const newProfile = profile ? profile : 'https://avatars0.githubusercontent.com/u/58340587?v=4'
    users.push({
      id : newUid,
      email : email,
      password : password,
      name : name,
      profile : newProfile
    })
    res.status(200).send({ status : 1, msg : 'User Registered, Now Login '})
  }

})

app.post('/status', (req, res) => {
  const { id } = req.body;

  let friendList = []
  users.forEach(us => {
    if( us.id !== id ){
      friendList.push({
        id : us.id, 
        profile : us.profile,
        name : us.name,
        online : us.online
      })
    }
  })

  res.status(200).json( { friends : friendList })

})