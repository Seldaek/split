var Split = function (node, trailsNode, energyNode, forceNode, scoreNode, messagesNode, ingameNode) {
    this.canvas = node;
    this.messagesNode = messagesNode;

    if (false === 'getContext' in node) {
        this.setMessage('This game requires a browser with HTML5 Canvas support. Try to <a href="http://browsehappy.com/">upgrade</a> your browser!');
    }

    this.collisionMap = document.createElement('canvas');
    this.collisionMap.width = node.width;
    this.collisionMap.height = node.height;
    this.collisionCtx = this.collisionMap.getContext('2d');

    this.matrix = new Matrix(50, node.width, node.height);
    this.trails = new Trails(trailsNode, this.matrix);
    this.energyBar = new EnergyBar(this, energyNode, forceNode);
    this.scoreNode = scoreNode;
    this.ingameNode = ingameNode;

    if (window.localStorage && !isNaN(parseInt(window.localStorage.getItem('highscore'), 10))) {
        this.scoreNode.innerHTML = "<span>HIGHSCORE</span>" + window.localStorage.getItem('highscore') + " ◊";
    }

    this.ctx = node.getContext('2d');

    this.debug = false;
    if (this.debug) {
        document.body.appendChild(this.collisionMap);
    }

    this.plays = 1;
    this.setMessage('SPLIT<br/><br/><br/>You are trapped in a void.<br/>[SPACE] is your only way out.<br/>Longer presses go further.<br/><br/><br/>Press [SPACE] To Start', function () {
        this.start();
    });
};

Split.prototype.start = function () {
    this.setMessage('');

    this.energyBar.reset();
    this.matrix.reset();
    this.trails.reset();

    this.lastTick = Date.now();
    this.lastFrame = this.lastTick;
    this.lastDifficultyBump = this.lastTick;
    this.lastBlock = this.lastTick;
    this.lastPause = 0;

    this.difficulty = 0.5;
    this.frame = 0;
    this.nodes = [];
    this.blocks = [];
    this.playing = true;
    this.paused = false;
    this.score = 0;
    this.ingameNode.className = 'playing';

    this.addNode(new Node(this, this.matrix, this.canvas.width / 2, 80));
    this.initControls();
    this.initAutoPause();

    this.tick();

    _gaq.push(['_trackEvent', 'Game', 'Play', 'Split', this.plays++]);
};

Split.prototype.gameOver = function () {
    var msg, highscore, newHighscore = false;
    this.playing = false;
    this.ingameNode.className = '';
    this.removeControls();

    if (window.localStorage) {
        highscore = parseInt(window.localStorage.getItem('highscore'), 10);
        if (isNaN(highscore) || highscore < this.score) {
            window.localStorage.setItem('highscore', this.score);
            newHighscore = true;
        }
    }

    msg = (newHighscore ? 'New Highscore!' : 'Game Over') + '<br/><br/><br/>Press [SPACE] To Try Again';
    this.setMessage(msg, function () {
        this.start();
    });
};

Split.prototype.tick = function () {
    var that, multiplier, curTick, i, len;
    that = this;

    if (this.paused) {
        return;
    }

    this.score = this.matrix.y - this.canvas.height;
    this.scoreNode.innerHTML = '' + this.score + ' ◊';

    // compute multiplier
    curTick = Date.now();
    multiplier = (curTick - this.lastTick) / 1000;
    this.lastTick = curTick;

    // compute frames
    while (curTick > this.lastFrame + 40) {
        this.frame += 1;
        this.lastFrame += 40;
    }

    // difficulty progress
    if (this.lastDifficultyBump < curTick - 2000) {
        this.lastDifficultyBump = curTick;
        this.matrix.speed += 1;

        for (i = 0, len = this.nodes.length; i < len; i++) {
            this.nodes[i].baseSpeed += 1;
            this.nodes[i].speed += 1;
        }
        this.difficulty += 0.01;
    }

    // create blocks
    if (this.lastBlock < curTick - (1 / this.difficulty * 1000) && Math.random() > 0.5) {
        this.lastBlock = curTick;
        this.addBlock(new Block(
            this,
            this.matrix,
            Math.random() * this.canvas.width,
            20 + this.matrix.y + Math.random() * 20,
            Math.max(10, this.difficulty * this.canvas.width / 1.5 - 10 + Math.random() * 5),
            Math.min(Math.max(3, Math.random() * this.difficulty * 10), 10)
        ));
    }

    // tick all objects
    this.matrix.tick(multiplier);
    this.energyBar.tick(multiplier);
    for (i = 0, len = this.nodes.length; i < len; i++) {
        if (false === this.nodes[i].tick(multiplier)) {
            // GC object if it returns false
            this.nodes.splice(this.nodes.indexOf(this.nodes[i]), 1);
            i--;
            len--;
        }
    }
    for (i = 0, len = this.blocks.length; i < len; i++) {
        if (false === this.blocks[i].tick(multiplier)) {
            // GC object if it returns false
            this.blocks.splice(this.blocks.indexOf(this.blocks[i]), 1);
            i--;
            len--;
        }
    }

    // draw frame
    this.draw();

    // check for collisions
    this.computeCollisions();

    if (this.nodes.length === 0) {
        this.gameOver();
    }

    if (this.playing) {
        window.requestAnimationFrame(function () { that.tick(); });
    }
};

Split.prototype.draw = function () {
    var i, len;

    this.trails.draw(this.frame);
    this.energyBar.draw();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.collisionCtx.fillStyle = '#000000';
    this.collisionCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (i = 0, len = this.nodes.length; i < len; i++) {
        this.nodes[i].draw(this.ctx, this.trails);
    }
    for (i = 0, len = this.blocks.length; i < len; i++) {
        this.blocks[i].draw(this.ctx, this.collisionCtx);
    }
};

Split.prototype.computeCollisions = function () {
    var i, len, offset, node, collMap;

    collMap = this.collisionCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    for (i = 0, len = this.nodes.length; i < len; i++) {
        node = this.nodes[i];
        offset = (Math.min(this.canvas.height, node.mappedY) * this.canvas.width + Math.max(0, node.mappedX)) * 4;

        if (collMap.data[offset]) {
            node.collide();
        }
        collMap.data[offset + 1] = 255;
    }

    this.collisionCtx.putImageData(collMap, 0, 0);
};

Split.prototype.initControls = function () {
    var isActive, that = this;

    if (this.controls) {
        this.removeControls();
    }

    this.controls = function (e) {
        var pressTime;
        if (isActive) {
            if (32 === e.keyCode) {
                e.preventDefault();
            }
            return;
        }

        if (32 === e.keyCode) {
            isActive = true;
            e.preventDefault();
            that.energyBar.start();
            this.addEventListener('keyup', function listener(e) {
                if (32 === e.keyCode) {
                    e.preventDefault();
                    this.removeEventListener('keyup', listener);
                    isActive = false;
                    that.split(that.energyBar.stop());
                }
            });
        } else if (e.changedTouches) {
            isActive = true;
            that.energyBar.start();
            this.addEventListener('touchend', function listener(e) {
                this.removeEventListener('touchend', listener);
                isActive = false;
                that.split(that.energyBar.stop());
            });
        } else if (80 === e.keyCode) {
            that.togglePause();
        }
    };

    window.addEventListener('keydown', this.controls);
    window.addEventListener('touchstart', this.controls);
};

Split.prototype.togglePause = function () {
    var that = this;

    this.paused = !this.paused;
    if (this.paused) {
        this.lastPause = this.lastTick;
        this.setMessage('[PAUSED]', function () {
            that.togglePause();
        });
    } else {
        this.lastTick = Date.now();
        this.lastFrame += (this.lastTick - this.lastPause);
        this.lastDifficultyBump += (this.lastTick - this.lastPause);
        this.lastBlock += (this.lastTick - this.lastPause);
        this.setMessage('');

        window.requestAnimationFrame(function () { that.tick(); });
    }
};

Split.prototype.initAutoPause = function () {
    var state, visibilityChange, that = this;
    if (typeof document.hidden !== "undefined") {
      visibilityChange = "visibilitychange";
      state = "visibilityState";
    } else if (typeof document.mozHidden !== "undefined") {
      visibilityChange = "mozvisibilitychange";
      state = "mozVisibilityState";
    } else if (typeof document.msHidden !== "undefined") {
      visibilityChange = "msvisibilitychange";
      state = "msVisibilityState";
    } else if (typeof document.webkitHidden !== "undefined") {
      visibilityChange = "webkitvisibilitychange";
      state = "webkitVisibilityState";
    }

    document.addEventListener(visibilityChange, function () {
        console.log(document[state]);
        if (document[state].toString().match(/hidden/i) && !that.paused) {
            that.togglePause();
        }
    }, false);
};

Split.prototype.removeControls = function () {
    window.removeEventListener('keydown', this.controls);
    this.controls = null;
};

Split.prototype.split = function (strength) {
    var i, len;

    if (strength === 0) {
        return;
    }

    for (i = 0, len = this.nodes.length; i < len; i++) {
        this.nodes[i].split(strength);
    }
};

Split.prototype.addNode = function (node) {
    this.nodes.push(node);
};

Split.prototype.addBlock = function (block) {
    this.blocks.push(block);
};

Split.prototype.setMessage = function (message, callback) {
    var computedStyle, height, that = this;

    this.messagesNode.innerHTML = message;
    computedStyle = document.defaultView.getComputedStyle(this.messagesNode, "");
    height = parseInt(computedStyle.getPropertyValue("height").replace('px', ''), 10);
    this.messagesNode.setAttribute('style', 'margin-top: -' + Math.round(height / 2) + 'px');

    this.msgCallback = callback;

    if (!this.msgCbInitialized) {
        this.msgCbInitialized = true;
        window.addEventListener('keydown', function listener(e) {
            if (32 === e.keyCode && that.msgCallback) {
                e.preventDefault();
                e.stopImmediatePropagation();
                that.msgCallback();
            }
        });

        this.messagesNode.addEventListener('click', function (event) {
            if (that.msgCallback) {
                that.msgCallback();
            }
        });
    }
};

if (undefined === window.requestAnimationFrame) {
    window.requestAnimationFrame = window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (callback) {
            setTimeout(callback, 20);
        }
    ;
}
