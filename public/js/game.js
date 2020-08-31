const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const timer = document.getElementById('time');
const activeUsers = document.querySelector('.userList .activeUsers')
const strokeInp = document.getElementById('strokeWeight')
const chatMsg = document.querySelector('.chatArea .chatInbox')
const chatForm = document.getElementById('chatForm')
const canvasInfo = document.querySelector('.board .canvasDisplay .canvasInfo')
const canvasElements = document.querySelector('.board .canvasElements')
const wordDisp = document.querySelector('.board .canvasDisplay .wordLength')
const roundDisp = document.querySelector('.board .canvasDisplay .round')
const wordForm = document.getElementById('wordForm')
const guessWordDisp = document.querySelector('.guessWordDisp')
const dispWinner = document.querySelector('.winner')

let time = 80;
let painting = false;
let strokeWeight = 1;
let strokeColor;

canvas.width = 900;
canvas.height = 500;

let game = false, rounds = 5, maxRounds = 5, guessWord, interval;
let players = [], currentPlayer, playersDB = {};

function clearCanvas(){
    if(game && currentPlayer === name){
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        socket.emit('clear')
    }
}

function remTime(){
    interval = setInterval(() => {
        
        let t = --time

        if(time === 0 || checkAllGuessed()){
            clearInterval(interval)
            handleTurn()
        }
        socket.emit('timer', t)
    }, 1000);
}

chatForm.addEventListener('submit', e => {
    e.preventDefault()
    const msg = e.target.elements[0].value;

    if(currentPlayer !== name && guessWord){

        if(msg.trim().toLowerCase() === guessWord && !playersDB[name].guessed){
            socket.emit('guessed', name)
        } else
            socket.emit('chatMsg', msg);


    }
    else
        socket.emit('chatMsg', msg);

    e.target.elements[0].value = '';
    e.target.elements[0].focus();    
})

strokeInp.addEventListener('change', e => {
    if(currentPlayer === name){
        const val = e.target.value
        if(val && val > 0 && val < 11 && !isNaN(val)){
            strokeWeight = val;
        }
        else
            alert('Enter a value in range 1 to 10')
    }
})

wordForm.addEventListener('submit', e => {
    e.preventDefault()
    let word = e.target[0].value
    if(word){
        word = word.trim().toLowerCase()
        guessWord = word
        socket.emit('word', guessWord)
        remTime()
        game = true
        document.getElementById('modal').style.visibility = 'hidden'
    }
    e.target[0].value = ''
})


function penColor(elt){
    strokeColor = elt.style.backgroundColor;
}


function enterWord(){
    if(currentPlayer === name && !guessWord && players.length > 1){
        if(document.getElementById('modal').style.visibility === 'visible')
            document.getElementById('modal').style.visibility = 'hidden'
        else {
            document.getElementById('modal').style.visibility = 'visible'
            document.querySelector('#wordForm .wordInp').focus()
        }
    }
}

function reset(){
    clearInterval(interval)
    time = 80;
    game = false
    guessWord = null;
    strokeWeight = 1
    strokeColor = 'black';
    strokeInp.value = 1
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for(let i in playersDB)
        playersDB[i].guessed = false
    wordDisp.innerHTML = ''
    guessWordDisp.style.display = 'none'
}

function userDetails(users){
    activeUsers.innerHTML = `
    ${users.map(user => `<div class="userDetails">
        <div class="un">${user}</div>
        <div class="us">${playersDB[user].score}</div>
    </div>`).join('')}
   `
}

function checkAllGuessed(){
    let c = 0;
    for(let i in playersDB)
        if(playersDB[i].guessed)
            c += 1

    return c === players.length - 1;
}

function checkWinner(){
    let winner, maxScore = -Infinity;

    for(let i in playersDB){
        
        if(maxScore === playersDB[i].score)
            return false

        if(playersDB[i].score && maxScore < playersDB[i].score){
            winner = i
            maxScore = playersDB[i].score
        }
    }

    return winner
}

function wordLength(word){
    let codedStr = '';
    for(let i in word)
        if(word.charAt(i) === ' '){
            codedStr += '^ ' 
        }
        else
            codedStr += "__ "
    
    return codedStr
}

function sleep(ms){
    return new Promise(res => setTimeout(res, ms))
}