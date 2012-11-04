var Node = function (game, matrix, x, y, angle, speed) {
    this.game = game;
    this.matrix = matrix;

    this.isSplit = false;
    this.isAlive = true;

    this.x = x;
    this.y = y;

    this.baseSpeed = matrix.speed;
    this.speed = speed || this.baseSpeed;
    this.baseAngle = deg2rad(90);
    this.angle = deg2rad(angle || 90);
    this.accel = 0;
};

Node.prototype.tick = function (multiplier) {
    this.x += this.speed * Math.cos(this.angle) * multiplier;
//    this.y += this.speed * Math.sin(this.angle) * multiplier;
    this.y += this.baseSpeed * multiplier;

    // easing of angle/speed
    if (this.angle !== this.baseAngle) {
        this.angle += (this.baseAngle - this.angle) * 0.5 * multiplier;
        if (Math.abs(this.angle - this.baseAngle) < 0.2) {
            this.angle = this.baseAngle;
        }

        // check if we hit the border while we are not running in a straight line
        if ((this.x > this.matrix.w - 3) || (this.x < 3)) {
            this.bounce();
        }
    }

    if (this.isAlive === false) {
        // noop
    } else if (this.isSplit === true) {
        this.speed -= multiplier * 20;
        this.baseSpeed -= multiplier * 20;
    } else if (this.speed !== this.baseSpeed) {
        this.speed += (this.baseSpeed - this.speed) * multiplier;
        if (Math.abs(this.speed - this.baseSpeed) < 0.2) {
            this.speed = this.baseSpeed;
        }
    }

    if (!this.matrix.isVisible(this.x, this.y)) {
        delete this.game;
        delete this.matrix;

        return false;
    }

    return true;
};

Node.prototype.bounce = function () {
    var degAngle = rad2deg(this.angle),
        degBaseAngle = rad2deg(this.baseAngle);

    this.angle = deg2rad(degBaseAngle + (degBaseAngle - degAngle));
};

Node.prototype.draw = function (ctx) {
    var coords = this.matrix.map(this.x, this.y);

    ctx.fillStyle = '#000000';
    ctx.fillRect(coords[0] - 3, coords[1] - 3, 6, 6);
};

Node.prototype.collide = function () {
    if (this.isAlive === false) {
        return;
    }
    this.isAlive = false;
    this.speed *= -1;
    this.baseSpeed *= -1;
    this.angle = deg2rad(Math.random() * -180);
};

Node.prototype.split = function (strength) {
    var str1, str2;

    if (this.isSplit === true || this.isAlive === false) {
        return;
    }

    this.isSplit = true;

    str1 = strength - 0.1 + Math.random() * 0.1;
    str2 = strength - 0.1 + Math.random() * 0.1;
    this.game.addNode(new Node(this.game, this.matrix, this.x, this.y, rad2deg(this.angle) + str1 * 100, str1 * 120));
    this.game.addNode(new Node(this.game, this.matrix, this.x, this.y, rad2deg(this.angle) - str2 * 100, str2 * 120));
};
