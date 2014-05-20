
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function GameEngine() {
    this.ctx = null;
    this.grid = false;
    this.renderer = null;
    this.gameboard = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx, gb) {
    this.ctx = ctx;
    this.gameboard = gb;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();

    console.log('game initialized');
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left - 23.5;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top - 23.5;

        x = Math.floor(x / 39.55);
        y = Math.floor(y / 39.55);

        if (x < 0 || x > 18 || y < 0 || y > 18) return null;

        return { x: x, y: y };
    }

    var that = this;

    this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
        socket.emit('click', { click: that.click, black: that.gameboard.black });
        return false;
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    console.log('Input started');
}

GameEngine.prototype.loop = function () {
    this.update();
    this.draw();
    this.click = null;
}

GameEngine.prototype.update = function () {
    if (this.click) this.gameboard.move(this.click.x, this.click.y);

    this.click = null;
}

GameEngine.prototype.draw = function () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.drawImage(ASSET_MANAGER.getAsset("./img/960px-Blank_Go_board.png"), 20, 20, 760, 760);
    for (var i = 0; i < 19; i++) {
        for (var j = 0; j < 19; j++) {
            if (this.grid) {
                this.ctx.strokeStyle = "green";
                this.ctx.strokeRect(23.5 + i * 39.55, 23.5 + j * 39.55, 39.55, 39.55);
            }
            if (this.gameboard.board[i][j] === 1) {
                //black stone
                this.ctx.drawImage(ASSET_MANAGER.getAsset("./img/black.png"), i * 39.55 + 23.5, j * 39.55 + 23.5, 39.55, 39.55);
            }
            else if (this.gameboard.board[i][j] === 2) {
                //white stone
                this.ctx.drawImage(ASSET_MANAGER.getAsset("./img/white.png"), i * 39.55 + 23.5, j * 39.55 + 23.5, 39.55, 39.55);
            }
        }
    }

    // draw mouse shadow
    if (this.mouse && this.gameboard.board[this.mouse.x][this.mouse.y] === 0) {
        var mouse = this.mouse;
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        if (this.gameboard.black) {
            this.ctx.drawImage(ASSET_MANAGER.getAsset("./img/black.png"), mouse.x * 39.55 + 23.5, mouse.y * 39.55 + 23.5, 39.55, 39.55);
        } else {
            this.ctx.drawImage(ASSET_MANAGER.getAsset("./img/white.png"), mouse.x * 39.55 + 23.5, mouse.y * 39.55 + 23.5, 39.55, 39.55);
        }
        this.ctx.restore();
    }
}

