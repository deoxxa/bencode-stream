var stream = require("stream");

//
// This is almost embarassingly simple. It doesn't keep track of whether or not
// it's generating valid bencode data, so you kind of need to be nice to it.
//
// You'll note that it emits strings - this is for speed, since passing strings
// around is way faster than passing buffers around. In Node.JS, it's faster to
// pass a string into the `write` method of a socket or a file handle than it is
// to explicitly create a Buffer and pass that in.
//
var Encoder = module.exports = function Encoder(options) {
  options = options || {};
  options.objectMode = true;

  stream.Transform.call(this, options);
};
Encoder.prototype = Object.create(stream.Transform.prototype, {constructor: {value: Encoder}});

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
// There are a couple of types provided for convenience as well, as they're
// emitted by the `Accumulator` stream and are easier to create if you're
// building a bencoded object programmatically. Those types are `string` and
// `integer`, with their payloads being kept in `.data`.
//
Encoder.prototype._transform = function(input, encoding, done) {
  switch (input.type) {
    case "integer-start": this.push("i"); break;
    case "integer-sign": this.push("-"); break;
    case "integer-data": this.push(input.data); break;
    case "integer-end": this.push("e"); break;
    case "integer": this.push("i" + input.data.toString() + "e"); break;
    case "string-start": this.push(input.length + ":"); break;
    case "string-data": this.push(input.data); break;
    case "string": this.push(input.data.length + ":"); this.push(input.data); break;
    case "dict-start": this.push("d"); break;
    case "dict-end": this.push("e"); break;
    case "list-start": this.push("l"); break;
    case "list-end": this.push("e"); break;
  }

  return done();
};
