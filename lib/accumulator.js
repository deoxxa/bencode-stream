var stream = require("stream");

var Accumulator = module.exports = function Accumulator(options) {
  options = options || {};
  options.objectMode = true;

  stream.Transform.call(this, options);

  this.current = null;
  this.offset = null;
};
Accumulator.prototype = Object.create(stream.Transform.prototype, {constructor: {value: Accumulator}});

Accumulator.prototype._transform = function _transform(input, encoding, done) {
  switch (input.type) {
    case "integer-start":
      this.current = "";
      break;

    case "integer-sign":
      this.current += "-";
      break;

    case "integer-data":
      this.current += input.data;
      break;

    case "integer-end":
      this.push({type: "integer", data: parseInt(this.current, 10)});
      this.current = null;
      break;

    case "string-start":
      this.current = Buffer(input.length); this.offset = 0;
      break;

    case "string-data":
      input.data.copy(this.current, this.offset);
      this.offset += input.data.length;
      break;

    case "string-end":
      this.push({type: "string", data: this.current});
      this.current = null;
      this.offset = null;
      break;

    default:
      this.push(input);
      break;
  }

  return done();
};
