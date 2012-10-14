var Steez = require("steez"),
    util = require("util");

//
// This is almost embarassingly simple. It doesn't keep track of whether or not
// it's generating valid bencode data, so you kind of need to be nice to it.
//
// You'll note that it emits strings - this is for speed, since passing strings
// around is way faster than passing buffers around. In Node.JS, it's faster to
// pass a string into the `write` method of a socket or a file handle than it is
// to explicitly create a Buffer and pass that in.
//
var Encoder = module.exports = function Encoder() {
  Steez.call(this);
};

util.inherits(Encoder, Steez);

//
// Write an object like the ones that come out of the `Decoder` stream. They
// look something like this:
//
// {type: "string-start", length: 4}
// {type: "string-data", data: Buffer("asdf")}
//
// This will cause the `Encoder` stream to emit "4:", followed by "asdf" as a
// buffer.
//
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

  return this.writable;
};
