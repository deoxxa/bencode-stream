var stream = require("stream"),
    util = require("util");

var Encoder = module.exports = function Encoder() {
  stream.Stream.call(this);

  this.writable = true;
  this.readable = true;

  this.buffers = [];

  this.state = "root";
  this.states = [this.state];
};

util.inherits(Encoder, stream.Stream);

Encoder.prototype.write = function(data) {
  switch (data.type) {
    case "integer": this.emit("data", Buffer("i" + data.data + "e")); break;
    case "string-start": this.emit("data", Buffer(data.length + ":")); break;
    case "string-data": this.emit("data", data.data); break;
    case "dict-open": this.emit("data", Buffer("d")); break;
    case "dict-close": this.emit("data", Buffer("e")); break;
    case "list-open": this.emit("data", Buffer("l")); break;
    case "list-close": this.emit("data", Buffer("e")); break;
  }

  return true;
};
