const socket = io();
const {name: username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})
const userName = username.toLowerCase()

socket.emit('userJoin', {userName, room})

socket.on('msg', msg => {
    const message = document.createElement('div')
    message.classList = 'msgInfo'
    message.innerHTML = msg
    chatMsg.appendChild(message)
    chatMsg.scrollTop = chatMsg.scrollHeight
})

socket.on('conn', ({users, userLeft}) => {

    players = users

    if(!userLeft){

        currentPlayer = players[0]
        roundDisp.innerHTML = 'Round: ' + (maxRounds - rounds + 1)

        if(users.length === 1){
            canvasInfo.innerHTML = 'Waiting for Other Player to Join'
        } else {
            if(currentPlayer === userName)
                canvasInfo.innerHTML = 'your turn'
            else
                canvasInfo.innerHTML = `${currentPlayer}'s turn`
        }

        players.forEach(player => {
            if(!playersDB[player])
                playersDB[player] = {"score": 0, "guessed": false}
        })
    }
    else{
        delete playersDB[userLeft]
        if(players.length === 1){
            canvasInfo.innerHTML = 'Waiting for Other Player to Join'
            currentPlayer = players[0]
            rounds = 5
            roundDisp.innerHTML = 'Round: 1'
            playersDB[currentPlayer].score = 0
            reset()
        }
        else if(currentPlayer === userLeft)
            handleTurn()
    }

    userDetails(users)
})

socket.on('drawing', mouse => {
    canvasInfo.innerHTML = `${mouse.name} is drawing`
    strokeWeight = mouse.strokeWeight
    strokeColor = mouse.strokeColor
    strokeInp.value = strokeWeight
    drawCanvas(mouse.x, mouse.y, mouse.painting)
})

socket.on('penUp', () => {
    painting = false;
    ctx.beginPath();
})

socket.on('clear', () => ctx.clearRect(0, 0, canvas.width, canvas.height))

socket.on('chatMsg', userMsg => {
    const message = document.createElement('div')
    message.classList = 'chatMessages'
    message.innerHTML = userMsg.name.bold() + ": " + userMsg.msg;
    chatMsg.appendChild(message)
    chatMsg.scrollTop = chatMsg.scrollHeight
})

socket.on('nextTurn', async nextPlayer => {

        guessWordDisp.children[1].innerHTML = guessWord
        guessWordDisp.style.display = 'block'

        await sleep(3300)

        currentPlayer = nextPlayer.player;
        rounds = nextPlayer.rounds
        roundDisp.innerHTML = 'Round: ' + (maxRounds - rounds + 1)
        if(currentPlayer === userName)
            canvasInfo.innerHTML = 'your turn'
        else
            canvasInfo.innerHTML = `${currentPlayer}'s turn`
        reset()
})

socket.on('timer', time => {
    timer.innerHTML = time
})

socket.on('word', word => {
    guessWord = word
    if(currentPlayer === userName)
        wordDisp.innerHTML = word
    else
        wordDisp.innerHTML = wordLength(word)
})

socket.on('guessed', name => {

    playersDB[name].guessed = true
    playersDB[name].score += Math.floor((120 * guessWord.length) / players.length);

    playersDB[currentPlayer].score += Math.floor((70 * guessWord.length) / (1.5 * players.length))

    const message = document.createElement('div')
    message.classList = 'guessed';
    message.innerHTML = `${name} guessed it right`
    chatMsg.appendChild(message)
    chatMsg.scrollTop = chatMsg.scrollHeight

    userDetails(players)
})

socket.on('gameover', () => {

    dispWinner.style.visibility = 'visible';

    if(checkWinner())
        dispWinner.children[1].innerHTML = 'Winner: ' + checkWinner().bold()
    else
        dispWinner.children[1].innerHTML = 'Match Drawn'
        
    reset()
})

function startPosition(e){
    painting = true;
    draw(e)
}

function finishPosition(){
    painting = false;
    ctx.beginPath();
    socket.emit('penUp')
}

function draw(e){
    if(!painting) return;

    if(game && currentPlayer === userName){

        ctx.lineWidth = strokeWeight;
        ctx.strokeStyle = strokeColor;
        ctx.lineCap = 'round';
        ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop)
    
        socket.emit('drawing', {name: userName, x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop, painting, strokeWeight, strokeColor})
    }
}

function drawCanvas(x, y, painting){
    if(!painting) return;

    ctx.lineWidth = strokeWeight;
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
}

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishPosition);
canvas.addEventListener('mousemove', draw)

function handleTurn(){
    let ind = players.indexOf(currentPlayer)
    if(ind + 1 < players.length)
        socket.emit('nextTurn', {player: players[ind + 1], rounds})
    else if(rounds > 1){
        rounds -= 1
        socket.emit('nextTurn', {player: players[0], rounds})
    }
    else
        socket.emit('gameover')
}