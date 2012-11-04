var Split = function (node) {
    this.canvas = node;
    this.collisionMap = document.createElement('canvas');
    this.collisionMap.width = node.width;
    this.collisionMap.height = node.height;
    this.collisionCtx = this.collisionMap.getContext('2d');
    document.body.appendChild(this.collisionMap);
    this.matrix = new Matrix(50, node.width, node.height);
    this.ctx = node.getContext('2d');
    this.difficulty = 0.5;
    this.lastBlock = 0;
    this.nodes = [];
    this.blocks = [];

    // difficulty progress
    setInterval(function (split) {
        var i, len;
        split.matrix.speed += 1;

        for (i = 0, len = split.nodes.length; i < len; i++) {
            split.nodes[i].baseSpeed += 1;
        }
        split.difficulty += 0.01;
    }, 2000, this);

    this.addNode(new Node(this, this.matrix, node.width / 2, 40));
    this.initControls();
};

Split.prototype.run = function () {
    this.lastTick = Date.now();
    this.tick();
};

Split.prototype.tick = function () {
    var that, multiplier, curTick, i, len;
    that = this;

    // compute multiplier
    curTick = Date.now();
    multiplier = (curTick - this.lastTick) / 1000;
    this.lastTick = curTick;

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
    for (i = 0, len = this.nodes.length; i < len; i++) {
        if (false === this.nodes[i].tick(multiplier)) {
            this.nodes.splice(this.nodes.indexOf(this.nodes[i]), 1);
            i--;
            len--;
        }
    }
    for (i = 0, len = this.blocks.length; i < len; i++) {
        if (false === this.blocks[i].tick(multiplier)) {
            this.blocks.splice(this.blocks.indexOf(this.blocks[i]), 1);
            i--;
            len--;
        }
    }

    // draw frame
    this.draw();

    // check for collisions
    this.computeCollisions();

    window.requestAnimationFrame(function () { that.tick(); });
};

Split.prototype.draw = function () {
    var i, len;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.collisionCtx.fillStyle = '#000000';
    this.collisionCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (i = 0, len = this.nodes.length; i < len; i++) {
        this.nodes[i].draw(this.ctx);
    }
    for (i = 0, len = this.blocks.length; i < len; i++) {
        this.blocks[i].draw(this.ctx, this.collisionCtx);
    }
};

Split.prototype.computeCollisions = function () {
    var i, len, coords, offset, node, collMap;

    collMap = this.collisionCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    for (i = 0, len = this.nodes.length; i < len; i++) {
        node = this.nodes[i];
        coords = this.matrix.map(node.x, node.y);
        offset = (coords[1] * this.canvas.width + coords[0]) * 4;

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
            pressTime = Date.now();
            e.preventDefault();
            this.addEventListener('keyup', function listener(e) {
                if (32 === e.keyCode) {
                    e.preventDefault();
                    this.removeEventListener('keyup', listener);
                    isKeyPressed = false;
                    that.split(Date.now() - pressTime);
                }
            });
        }
    });
};

Split.prototype.split = function (duration) {
    var i, len;

    // normalize, max strength = 2sec press
    strength = Math.min(1, duration / 1000 / 2);

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
