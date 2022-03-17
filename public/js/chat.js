const socket =  io()

//Elements
const $messageInput = document.querySelector("#input")
const $messageButton = document.querySelector('#send')
const $geolocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const messageTemplateLocation = document.querySelector('#message-template-location').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', message => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a'),
        message:  message.text
    })
    $messages.insertAdjacentHTML('beforeend', html)
    console.log(message)
    autoscroll()
})

socket.on('locationMessage', message => {
    const html = Mustache.render(messageTemplateLocation, {
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a'),
        message:  message.url
    })
    $messages.insertAdjacentHTML('beforeend', html)
    console.log(message)
    autoscroll()
})

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageButton.addEventListener('click', () => {
        const inputValue = $messageInput.value
        $messageButton.setAttribute('disabled', 'disabled')

        socket.emit('sendMessage', inputValue, (error) => {
            $messageButton.removeAttribute('disabled')
            $messageInput.value = ''
            $messageInput.focus()

            if (error) {
                return console.log(error)
            }
            console.log('Message delivered!')
        })
    }
)

$geolocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    $geolocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const coordinate = `https://google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
        socket.emit('sendLocation', coordinate, () => {
            $geolocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
