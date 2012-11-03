var Node = function (split, matrix, x, y) {
    this.split = split;
    this.matrix = matrix;

    this.x = x;
    this.y = y;

    this.speed = 20;
    this.angle = deg2rad(90);
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
