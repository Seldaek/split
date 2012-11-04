var Node = function (game, matrix, x, y, angle, speed) {
    this.game = game;
    this.matrix = matrix;

    this.isSplit = false;

    this.x = x;
    this.y = y;

    this.baseSpeed = 20;
    this.speed = speed || this.baseSpeed;
    this.baseAngle = deg2rad(90);
    this.angle = deg2rad(angle || 90);
    this.accel = 0;
};

Node.prototype.tick = function (multiplier) {
    this.x += this.speed * Math.cos(this.angle) * multiplier;
    this.y += this.speed * Math.sin(this.angle) * multiplier;

    // easing of angle/speed
    if (this.angle !== this.baseAngle) {
        this.angle += (this.baseAngle - this.angle) * 0.5 * multiplier;
        if (Math.abs(this.angle - this.baseAngle) < 0.2) {
            this.angle = this.baseAngle;
        }
    }
    if (this.speed !== this.baseSpeed) {
        this.speed += (this.baseSpeed - this.speed) * multiplier;
        if (Math.abs(this.speed - this.baseSpeed) < 0.2) {
            this.speed = this.baseSpeed;
        }
    }
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
