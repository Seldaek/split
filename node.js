var Node = function (game, matrix, x, y, angle) {
    this.game = game;
    this.matrix = matrix;

    this.isSplit = false;

    this.x = x;
    this.y = y;

    this.speed = 20;
    this.angle = deg2rad(angle || 90);
    this.accel = 0;
};

Node.prototype.tick = function (multiplier) {
    this.x += this.speed * Math.cos(this.angle) * multiplier;
    this.y += this.speed * Math.sin(this.angle) * multiplier;
};

Node.prototype.draw = function (ctx) {
    var coords = this.matrix.map(this.x, this.y);

    ctx.fillStyle = '#000000';
    ctx.fillRect(coords[0] - 3, coords[1] - 3, 6, 6);

    ctx.fillStyle = 'red';
    ctx.fillRect(coords[0], coords[1], 1, 1);
};

Node.prototype.split = function () {
    this.isSplit = true;

    this.game.addNode(new Node(this.game, this.matrix, this.x, this.y, rad2deg(this.angle) + 40));
    this.game.addNode(new Node(this.game, this.matrix, this.x, this.y, rad2deg(this.angle) - 40));
};
