var stream = require("stream"),
    util = require("util");

var Encoder = module.exports = function Encoder() {
  stream.Stream.call(this);

  this.writable = true;
  this.readable = true;
};

util.inherits(Encoder, stream.Stream);

Encoder.prototype.write = function(data) {
  switch (data.type) {
    case "integer-start": this.emit("data", "i"); break;
    case "integer-sign": this.emit("data", "-"); break;
    case "integer-data": this.emit("data", data.data); break;
    case "integer-end": this.emit("data", "e"); break;
    case "string-start": this.emit("data", data.length + ":"); break;
    case "string-data": this.emit("data", data.data); break;
    case "dict-start": this.emit("data", "d"); break;
    case "dict-end": this.emit("data", "e"); break;
    case "list-start": this.emit("data", "l"); break;
    case "list-end": this.emit("data", "e"); break;
  }

  return true;
};
