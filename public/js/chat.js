const socket=io()

const $messageForm=document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector('button')
const $sendLocationButton=document.querySelector('#send-location')
const $messages=document.querySelector('#messages')
const $sideBar=document.querySelector('#sidebar')

const messageTemplate=document.querySelector('#message-template').innerHTML
const messageLocationTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML


const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll=()=>{
    const $newMessage=$messages.lastElementChild


    //Height of new message
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight+newMessageMargin

    //visible height
    const visibleHeight=$messages.offsetHeight

    //Height of messages conatainer
    const containerHeight=$messages.scrollHeight


    //How far scrolled
    const scrollOffset=$messages.scrollTop+visibleHeight

    if(containerHeight-newMessageHeight <=scrollOffset){
        $messages.scrollTop=$messages.scrollHeight
    }
}

socket.on('message',(msz)=>{
    console.log(msz)
    const html=Mustache.render(messageTemplate,{
        username:msz.username,
        message:msz.text,
        createdAt:moment(msz.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(msz)=>{
    console.log(msz)
    const html=Mustache.render(messageLocationTemplate,{
        username:msz.username,
        url:msz.url,
        createdAt:moment(msz.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room:room,
        users:users
    })
    $sideBar.innerHTML=html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')

    const msz=e.target.elements.message.value
    // console.log(msz)
    socket.emit('sendMessage',msz,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message delivered')
    })
})

$sendLocationButton.addEventListener('click',(e)=>{
    if(!navigator.geolocation){
        return alert('Geo location is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        let lat=position.coords.latitude
        let long=position.coords.longitude
        socket.emit('sendLocation',lat,long,()=>{
            console.log('Location shared')
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})