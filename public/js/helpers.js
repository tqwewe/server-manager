Array.prototype.pushIfNotExist = function (e) {
    var exists = false;
    for (var i = 0; i < this.length; i++) {
        if (this[i] == e) {
            exists = true;
            break;
        }
    }
    if (!exists) {
        this.push(e);
    }
};
Array.prototype.delete = function (e) {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] == e) {
            this.splice(i, 1);
        }
    }
};
