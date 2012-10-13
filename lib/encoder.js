var stream = require("stream"),
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
  stream.Stream.call(this);

  this.writable = true;
  this.readable = true;

  this.paused = false;
  this.closing = false;

  this.queue = [];
};

util.inherits(Encoder, stream.Stream);

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
  console.log("encoder", "write");

  switch (data.type) {
    case "integer-start": this.emit_data("i"); break;
    case "integer-sign": this.emit_data("-"); break;
    case "integer-data": this.emit_data(data.data); break;
    case "integer-end": this.emit_data("e"); break;
    case "string-start": this.emit_data(data.length + ":"); break;
    case "string-data": this.emit_data(data.data); break;
    case "dict-start": this.emit_data("d"); break;
    case "dict-end": this.emit_data("e"); break;
    case "list-start": this.emit_data("l"); break;
    case "list-end": this.emit_data("e"); break;
  }

  return this.writable;
};

Encoder.prototype.end = function end(data) {
  console.log("encoder", "end");

  if (data) {
    this.write(data);
  }

  this.writable = false;
  this.closing = true;

  this.destroySoon();
};

Encoder.prototype.destroySoon = function destroySoon() {
  console.log("encoder", "destroySoon");

  if (this.queue.length === 0) {
    this.destroy();
  } else {
    process.nextTick(this.destroySoon.bind(this));
  }
};

Encoder.prototype.destroy = function destroy() {
  console.log("encoder", "destroy");

  this.emit("close");

  this.readable = false;
};

Encoder.prototype.pause = function pause() {
  console.log("encoder", "pause");

  this.writable = false;
  this.paused = true;
};

Encoder.prototype.resume = function resume() {
  console.log("encoder", "resume");

  if (!this.closing) {
    this.writable = true;
  }

  var was_paused = this.paused;

  this.paused = false;

  if (was_paused) {
    this.emit("drain");
    this.emit_one();
  }
};

Encoder.prototype.emit_data = function emit_data(data) {
  console.log("encoder", "emit_data");

  this.queue.push(data);
  this.emit_one();
};

Encoder.prototype.emit_one = function emit_one() {
  console.log("encoder", "emit_one", this.queue.length);

  if (this.paused) {
    return;
  }

  if (this.queue.length) {
    this.emit("data", this.queue.shift());

    if (this.queue.length) {
      process.nextTick(this.emit_one.bind(this));
    }
  }
};
