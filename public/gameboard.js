(function (exports) {
    var GameBoard = function () {
        this.black = true;
        this.board = [];
        for (var i = 0; i < 19; i++) {
            this.board.push([]);
            for (var j = 0; j < 19; j++) {
                this.board[i].push(0);
            }
        }
    }

    GameBoard.prototype.cloneBoard = function () {
        var b = [];
        for (var i = 0; i < 19; i++) {
            b.push([]);
            for (var j = 0; j < 19; j++) {
                b[i].push(this.board[i][j]);
            }
        }
        return b;
    }

    GameBoard.prototype.move = function (x, y) {
        if (this.board[x][y] === 0) {
            var color = this.black ? 1 : 2;
            var oldState = this.cloneBoard();
            this.board[x][y] = color;
            this.black = !this.black;

            var that = this;
            function checkCapture(dir) {
                if (that.board[dir.x][dir.y] === 0) return;
                if (that.board[dir.x][dir.y] === color) return;
                //check for capture
                var grp = [];
                var libs = [];
                that.countLiberties(dir.x, dir.y, grp, libs);
                if (libs.length === 0) {
                    for (var i = 0; i < grp.length; i++) {
                        that.board[grp[i].x][grp[i].y] = 0;
                    }
                }
            }

            if (x - 1 >= 0) {
                checkCapture({ x: x - 1, y: y });
            }
            if (y - 1 >= 0) {
                checkCapture({ x: x, y: y - 1 });
            }
            if (x + 1 <= 18) {
                checkCapture({ x: x + 1, y: y });
            }
            if (y + 1 <= 18) {
                checkCapture({ x: x, y: y + 1 });
            }

            var l = [];
            this.countLiberties(x, y, [], l);
            if (l.length === 0) {
                this.board = oldState;
                this.black = !this.black;
            }
        }
    }

    GameBoard.prototype.countLiberties = function (x, y, grp, libs) {
        var color = this.board[x][y];
        if (color === 0) return;
        grp.push({ x: x, y: y });
        var that = this;

        function contains(lst, itm) {
            for (var i = 0; i < lst.length; i++) {
                if (lst[i].x === itm.x && lst[i].y === itm.y) return true;
            }
            return false;
        }

        function checkStone(dir) {
            var stone = that.board[dir.x][dir.y];
            if (stone === 0) {
                if (!contains(libs, { x: dir.x, y: dir.y })) {
                    libs.push({ x: dir.x, y: dir.y });
                }
            } else if (stone === color) {
                if (!contains(grp, { x: dir.x, y: dir.y })) {
                    that.countLiberties(dir.x, dir.y, grp, libs);
                }
            }
        }
        // four directions
        // west
        if (x - 1 >= 0) {
            checkStone({ x: x - 1, y: y });
        }
        // north
        if (y - 1 >= 0) {
            checkStone({ x: x, y: y - 1 });
        }
        // east
        if (x + 1 <= 18) {
            checkStone({ x: x + 1, y: y });
        }
        // south
        if (y + 1 <= 18) {
            checkStone({ x: x, y: y + 1 });
        }
    }

    exports.GameBoard = GameBoard;
})(typeof global === "undefined" ? window : exports);