const messages = document.getElementById('messages')
const chatText = document.getElementById('chat-text')

const loginForm = document.getElementById('login-form')
const logEmail = document.getElementById('log-email')
const logPass = document.getElementById('log-pass')
const loginWindow = document.getElementById('login')

const registerWindow = document.getElementById('register')
const regForm = document.getElementById('register-form')

const friendWindow = document.getElementById('friend-window')
const friendList = document.getElementById('friend-list')
const curUserProfile = document.getElementById('cur-user-profile')

const onChat = document.getElementById('friend-on-chat')
const toList = document.getElementById('to-list')

const alertText = document.getElementById('alert-text')

const chatWindow = document.getElementById('chat-window')

let currentUser = {}
let currentFriendList = []
let currentFriend = {}


const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    console.log('connected');
};
  
socket.onclose = () => {
    console.error('disconnected');
};
  
socket.onerror = error => {
    console.error('failed to connect', error);
};


socket.onmessage = ({data}) => {
    let res = JSON.parse(data)

    if(res.type === 'status'){
        console.log(res);
    }

    if(res.from === currentFriend.id || res.from === currentUser.id){
        appendChat(res)
    } else {
        let sender = currentFriendList.find(fr => fr.id === res.from)
        alertText.innerText = `${sender.name} sent you a message.`
        alertText.classList.add('active')
        setTimeout(() => {
            alertText.classList.remove('active')
        }, 2000)
    }
}

document.querySelector('#chatbox').onsubmit = (e) => {
    e.preventDefault()
    let text = chatText.value;

    socket.send(JSON.stringify({timestamp : new Date(), text : text, from : currentUser.id, to : currentFriend.id }))
    chatText.value = '';
}

toList.onclick = async() => {
    chatWindow.style.display = 'none'
    friendWindow.style.display = 'unset'

    const { friends } = await postData('http://localhost:5000/status', { id : currentUser.id })
    currentFriendList = friends

    currentFriend = {}

    friendList.innerHTML =  currentFriendList.map(friend => {
        return(
           `<div class="friend" onclick="getChats('${friend.id}')">
                <div class="frnd-img" style="background-image : url('${friend.profile}')"></div>
                <div class="d-flex flex-column">
                    <span class="frnd-name">${friend.name}</span>
                    <span class="frnd-status ${friend.online ? 'text-success' : 'text-danger'}">${friend.online ? 'Online' : 'Offline'}</span>
                </div>
            </div>`
        )
    }).join('')
}


loginForm.onsubmit = async(e) => {
    e.preventDefault()
    const data = await postData('http://localhost:5000/login', {
        email : logEmail.value,
        password : logPass.value
    })

    if(data.status){
        
        currentUser = data.user
        currentFriendList = data.friends

        socket.send(JSON.stringify({timestamp : new Date(), text : '', from : currentUser.id }))
        
        curUserProfile.setAttribute('style', `background-image : url('${currentUser.profile}')`)

        friendList.innerHTML =  currentFriendList.map(friend => {
            return(
               `<div class="friend" onclick="getChats('${friend.id}')">
                    <div class="frnd-img" style="background-image : url('${friend.profile}')"></div>
                    <div class="d-flex flex-column">
                        <span class="frnd-name">${friend.name}</span>
                        <span class="frnd-status ${friend.online ? 'text-success' : 'text-danger'}">${friend.online ? 'Online' : 'Offline'}</span>
                    </div>
                </div>`
            )
        }).join('')

        loginWindow.style.display = 'none'
        friendWindow.style.display = 'unset'
        
    } else {
        alert(data.msg)
    }
}

async function getChats(fid) {
    const data = await postData('http://localhost:5000/chats', { host : currentUser.id , friend : fid })

    messages.innerHTML = '';
    data.chats.forEach(chat => {
        appendChat(chat)
    })

    currentFriend = data.friend

    onChat.innerHTML = `<span style="font-weight: 500;">${currentFriend.name}</span>
    <div class="frnd-img" style="background-image : url('${currentFriend.profile}')" ></div>`
    
    friendWindow.style.display = 'none';
    chatWindow.style.display = 'unset';
    messages.scrollTo(0, messages.scrollHeight)
}

async function postData(url = '', data = {}) {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
    },
    redirect: 'follow', 
    referrerPolicy: 'no-referrer', 
    body: JSON.stringify(data)
});
return response.json();
}

function appendChat(res) {
    let msgDiv = document.createElement('div')
    if (res.from === currentUser.id) msgDiv.classList.add('self')
    msgDiv.classList.add('message')
    let chat = document.createElement('div')
    chat.innerText = res.text
    chat.classList.add('chat')
    msgDiv.append(chat)
    messages.appendChild(msgDiv)
    messages.scrollTo(0, messages.scrollHeight)
}

regForm.onsubmit = async(e) => {
    e.preventDefault()
    const regName = document.getElementById('reg-name').value
    const regEmail = document.getElementById('reg-email').value
    const regPass = document.getElementById('reg-pass').value
    const regImage = document.getElementById('reg-image').value

    const res = await postData('http://localhost:5000/register', {
        name : regName,
        email : regEmail,
        password : regPass,
        profile : regImage
    })

    if(res.status){
        alert(res.msg)
        registerWindow.style.display = 'none'
        loginWindow.style.display = 'unset'
    } else {
        alert(res.msg)
    }
}

function switchLog(){
    registerWindow.style.display = 'none'
    loginWindow.style.display = 'flex'
}

function switchReg(){
    loginWindow.style.display = 'none'
    registerWindow.style.display = 'flex'
}