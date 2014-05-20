var messages = [];
var ASSET_MANAGER = new AssetManager();
var gameboard = new GameBoard();

// the commented out code is an example of how to setup a non-local server after testing
// of course you will have to use your ip address or web address instead

//var socket = io.connect('http://184.64.45.190:8888');
var socket = io.connect('http://localhost:8888');


window.onload = function () {
    var field = document.getElementById("field");
    var ctx = document.getElementById("gameworld").getContext("2d");
    var content = document.getElementById("content");
    var name = document.getElementById("name");
    var username = name.innerHTML;

    var gameEngine = new GameEngine();

    socket.on('start', function (data) {
        socket.username = username;
        socket.emit('init', username);
    });

    socket.on('sync', function (data) {
        gameEngine.gameboard.board = data.board;
        gameEngine.gameboard.black = data.black;
    });

    socket.on('click', function (data) {
        gameEngine.gameboard.move(data.click.x, data.click.y);
    });

    socket.on('message', function (data) {
        if (data.message) {
            messages.push(data);
            var html = '';
            for (var i = 0; i < messages.length; i++) {
                html += '<b>' + (messages[i].username ? messages[i].username : 'Server') + ': </b>';
                html += messages[i].message + '<br />';
            }
            content.innerHTML = html;
            content.scrollTop = content.scrollHeight;
        } else {
            console.log("There is a problem:", data);
        }
    });

    field.onkeydown = function (e) {
        if (e.keyCode == 13) {
            var text = field.value;
            socket.emit('send', { message: text, username: username });
            field.value = "";
        }
    };

    ASSET_MANAGER.queueDownload("./img/960px-Blank_Go_board.png");
    ASSET_MANAGER.queueDownload("./img/black.png");
    ASSET_MANAGER.queueDownload("./img/white.png");

    ASSET_MANAGER.downloadAll(function () {
        gameEngine.init(ctx, gameboard);
        gameEngine.start();
    });
}
