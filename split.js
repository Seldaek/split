var Split = function (node, trailsNode, energyNode, forceNode) {
    this.canvas = node;

    this.collisionMap = document.createElement('canvas');
    this.collisionMap.width = node.width;
    this.collisionMap.height = node.height;
    this.collisionCtx = this.collisionMap.getContext('2d');

    this.matrix = new Matrix(50, node.width, node.height);
    this.trails = new Trails(trailsNode, this.matrix);
    this.energyBar = new EnergyBar(this, energyNode, forceNode);

    this.ctx = node.getContext('2d');

    this.lastTick = 0;
    this.lastBlock = 0;
    this.lastDifficultyBump = 0;

    this.difficulty = 0.5;
    this.frame = 0;
    this.lastFrame = 0;
    this.nodes = [];
    this.blocks = [];
    this.playing = true;
    this.paused = false;

    this.debug = false;
    if (this.debug) {
        document.body.appendChild(this.collisionMap);
    }

    this.addNode(new Node(this, this.matrix, node.width / 2, 40));
    this.initControls();

    // TODO add http://davidwalsh.name/page-visibility to pause the game
};

Split.prototype.start = function () {
    this.lastTick = Date.now();
    this.lastFrame = this.lastTick;
    this.lastDifficultyBump = this.lastTick;
    this.lastBlock = this.lastTick;

    this.tick();
};

Split.prototype.tick = function () {
    var that, multiplier, curTick, i, len;
    that = this;

    // TODO add pause, unpause should check the time elapsed and add that to all the last* vars

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
            Math.max(1, this.difficulty * this.canvas.width / 1.5 - 10 + Math.random() * 5),
            Math.max(1, Math.random() * this.difficulty * 40)
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
        this.playing = false;
    }

    if (this.playing) {
        window.requestAnimationFrame(function () { that.tick(); });
    }
};

Split.prototype.draw = function () {
    var i, len;

    this.trails.draw(this.frame);
    this.energyBar.draw();

    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
    var isKeyPressed, that = this;

    window.addEventListener('keydown', function (e) {
        var pressTime;
        if (isKeyPressed) {
            return;
        }
        if (32 === e.keyCode) {
            isKeyPressed = true;
            e.preventDefault();
            that.energyBar.start();
            this.addEventListener('keyup', function listener(e) {
                if (32 === e.keyCode) {
                    e.preventDefault();
                    this.removeEventListener('keyup', listener);
                    isKeyPressed = false;
                    that.split(that.energyBar.stop());
                }
            });
        }
    });
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

if (undefined === window.requestAnimationFrame) {
    window.requestAnimationFrame = window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (callback) {
            setTimeout(callback, 20);
        }
    ;
}
