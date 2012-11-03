var Split = function (node) {
    var that = this;

    this.canvas = node;
    this.matrix = new Matrix(20);
    this.ctx = node.getContext('2d');
    this.nodes = [];

    this.addNode(new Node(this, this.matrix, 160, 20));
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
