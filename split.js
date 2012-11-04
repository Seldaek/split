var Split = function (node) {
    this.canvas = node;
    this.matrix = new Matrix(20);
    this.ctx = node.getContext('2d');
    this.nodes = [];

    this.addNode(new Node(this, this.matrix, 160, 20));
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

    // tick all objects
    this.matrix.tick(multiplier);
    for (i = 0, len = this.nodes.length; i < len; i++) {
        this.nodes[i].tick(multiplier);
    }

    // draw frame
    this.draw();
    window.requestAnimationFrame(function () { that.tick(); });
};

Split.prototype.draw = function () {
    var i, len;

    this.ctx.clearRect(0, 0, 320, 480);
    for (i = 0, len = this.nodes.length; i < len; i++) {
        this.nodes[i].draw(this.ctx);
    }
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

if (undefined === window.requestAnimationFrame) {
    window.requestAnimationFrame = window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (callback) {
            setTimeout(callback, 20);
        }
    ;
}
