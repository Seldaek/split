var Node = function (game, matrix, x, y, angle, speed) {
    this.game = game;
    this.matrix = matrix;

    this.isSplit = false;
    this.isAlive = true;

    this.x = x;
    this.y = y;
    this.mappedX = x;
    this.mappedY = y;

    this.baseSpeed = matrix.speed;
    this.speed = speed || this.baseSpeed;
    this.baseAngle = deg2rad(90);
    this.angle = deg2rad(angle || 90);
    this.accel = 0;
};

Node.IMAGE = new Image();
Node.IMAGE.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAATCAYAAACQjC21AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAxBJREFUeNpcVDtvFDEQnrG9G/aOy5ELESSEcAiBAkJ0QEODRIMoaGno6KjS8UfgPyAqGmgoEA0lDWkQUhoCinhccrnblz02440dGU76ZJ/X83m+eeHDjxMIPwwQCVRyHu9YhmNQ2FNydmwAgcDvJSML37LkDIORh2HoQIbhvz+3KiGLHuUBC2HN/nvYG7cBTcAxaSopkhUBfUKRORTIXzsP+ddJRWsLYckTlokySAmjTE/UY6sBCZmvl79vDOb794y1IyILRhu0zv4sF5ffTUer286BRGcjmY2SU6knPBl71d882H1wfrL7FKwZWuugqTU0TctooL+7c1+tX3o+2bj61iHzOUdBMongnYyEVoh8PN+7M97f3XJKDt1CD2zWZ98XAfuMou9FLRVfP2/1fuzcdkJGZd5exmR0ki2KhaVmvrrx+/tjTaIAx3ddDsg2QkmGAlQZYJazU9gvvm4/yqrZshNCBZUyLRXFhDisDq5hXV0hPrb8luOcAPI1lGHlM4ZlDjGfXsWmWgOfuECo/ilozqfVesTBz53kiBOFSkYgjqOHjyeRA8G+aDIDS7aXlB3EOoRYmGzQtK22Dhuhjk74gyc0PstgyHQ3La+tbo2DLs0u7RQXWwg5ME1e7NRkDlxdLSkmQxbR1QN7ZoxhIuK1grIswQj5DZT6lbagSFtJ8rOT4cqXw8XlN6Yqoa4rLpcadMNoG0YJ8/kUZodzoIqxNn7vBqe+da+EslFJP/rKr7lsyr0Lmy/PHP65jNPJLacWuiQYttFaQ8t1aMpDoNHKB3399isrZINETbAnufnkmUgnCsuWOi/q6tTKJyxngv78XG1ms17LHmn2mCz9MufGr83Nuy9cf7DHZBWbzb0zXiXy+JJJ653wrcc4yQVbSGp7ajq5SFqf5cDknIAWs+yHHZ7ecTIruYvKQFYFwlaFgMZZ18RZh9z8JLKaRmf3eSzIcMH5BCMZy2R1uF+FVafjy4agYpJ1w41fs8YsKBDdQ0ffdECb7G2cNi4hikOTwl4lwzVOlXRSR6I4sd1fAQYAlue9+sEeac8AAAAASUVORK5CYII';

Node.prototype.tick = function (multiplier) {
    var coords;

    this.x += this.speed * Math.cos(this.angle) * multiplier;
    this.y += this.speed * Math.sin(this.angle) * multiplier;

    coords = this.matrix.map(this.x, this.y);
    this.mappedX = coords[0];
    this.mappedY = coords[1];

    if (this.isAlive) {
        // normalize angle
        if (this.angle !== this.baseAngle) {
            this.angle += (this.baseAngle - this.angle) * 0.5 * multiplier;
            if (Math.abs(this.angle - this.baseAngle) < 0.13) {
                this.angle = this.baseAngle;
            }

            // check if we hit the border while we are not running in a straight line
            if ((this.x > this.matrix.w - 3) || (this.x < 3)) {
                this.bounce();
            }
        } else if (this.mappedY > this.matrix.h - 20) {
            // speed up nodes if their vector is normalized and they fly too low
            this.speed = this.baseSpeed * (1.1 + Math.random() * 0.2);
        }

        // slow down nodes if they are too high
        if (this.mappedY < this.matrix.h - 100) {
            this.speed = this.baseSpeed * (1 - Math.random() * 0.2);
        }

        // decelerate nodes after they spawn
        if (this.speed > this.baseSpeed * 1.5) {
            this.speed += (this.baseSpeed - this.speed) * multiplier;
        }
    }

    if (!this.matrix.isVisible(this.x, this.y)) {
        this.game = null;
        this.matrix = null;

        return false;
    }

    return true;
};

Node.prototype.bounce = function () {
    var degAngle = rad2deg(this.angle),
        degBaseAngle = rad2deg(this.baseAngle);

    this.angle = deg2rad(- degAngle + 180);
};

Node.prototype.draw = function (ctx, trails) {
    ctx.drawImage(Node.IMAGE, this.mappedX - 11, this.mappedY - 10);

    trails.ctx.fillStyle = '#8faec8';
    trails.ctx.beginPath();
    trails.ctx.arc(this.mappedX, this.mappedY, 2+Math.random()*2, 0, Math.PI*2, true);
    trails.ctx.closePath();
    trails.ctx.fill();
};

Node.prototype.collide = function () {
    var newAngle,
        degAngle = rad2deg(this.angle);

    if (this.isAlive === false) {
        return;
    }
    this.isAlive = false;

    newAngle = - degAngle;
    while (newAngle > 180) {
        newAngle -= 360;
    }
    while (newAngle < -180) {
        newAngle += 360;
    }

    if (newAngle > 90) {
        newAngle = -170;
    }
    if (newAngle > 0) {
        newAngle = -10;
    }

    this.angle = deg2rad(newAngle);
};

Node.prototype.split = function (strength) {
    var str1, str2;

    if (this.isSplit === true || this.isAlive === false) {
        return;
    }

    this.isSplit = true;

    str1 = strength - 0.1 + Math.random() * 0.1;
    str2 = strength - 0.1 + Math.random() * 0.1;
    this.game.addNode(new Node(this.game, this.matrix, this.x, this.y, rad2deg(this.angle) + str1 * 90, this.speed + (2 * this.speed * str1)));
    this.game.addNode(new Node(this.game, this.matrix, this.x, this.y, rad2deg(this.angle) - str2 * 90, this.speed + (2 * this.speed * str2)));

    this.x = -500;
};
