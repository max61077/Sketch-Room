const users = [];

function userJoin(id, username, room){
    const user = {id, username, room};

    user.username = user.username.toLowerCase().trim()
    user.room = user.room.toLowerCase().trim()

    users.push(user);

    return user;
}

function getCurrentUser(id){
    return users.find((user) => user.id === id);
}

function removeUser(id){
    const index = users.findIndex(user => user.id === id);

    if(index !== -1)
        return users.splice(index, 1)[0];
}

function getUserRoom(room){
    const userRoom = users.filter(user => user.room === room);
    let names = []
    userRoom.forEach(user => names.push(user.username))
    return names
}

module.exports = {userJoin, getCurrentUser, removeUser, getUserRoom};