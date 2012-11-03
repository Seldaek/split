var Matrix = function (speed) {
    this.x = 0;
    this.y = 480;

    this.speed = speed;
};

Matrix.prototype.setSpeed = function (speed) {
    this.speed = speed;
};

Matrix.prototype.map = function (x, y) {
    return [Math.floor(this.x + x), Math.floor(this.y - y)];
};

Matrix.prototype.tick = function (multiplier) {
    this.y += this.speed * multiplier;
};
