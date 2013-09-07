var stream = require("stream");

var Liberator = module.exports = function Liberator(options) {
  options = options || {};

  options.objectMode = true;

  stream.Transform.call(this, options);
};
Liberator.prototype = Object.create(stream.Transform.prototype, {constructor: {value: Liberator}});

Liberator.prototype._recursiveWrite = function _recursiveWrite(input) {
  if (typeof input === "string" || Buffer.isBuffer(input)) {
    return this.push({type: "string", data: input});
  }

  if (typeof input === "number") {
    return this.push({type: "integer", data: input});
  }

  if (typeof input === "object" && Array.isArray(input)) {
    this.push({type: "list-start"});

    input.forEach(this._recursiveWrite.bind(this));

    this.push({type: "list-end"});

    return;
  }

  if (typeof input === "object" && !Array.isArray(input)) {
    this.push({type: "dict-start"});

    for (var k in input) {
      this.push({type: "dict-key"});
      this._recursiveWrite(k);
      this.push({type: "dict-value"});
      this._recursiveWrite(input[k]);
    }

    this.push({type: "dict-end"});

    return;
  }
};

Liberator.prototype._transform = function _transform(input, encoding, done) {
  try {
    this._recursiveWrite(input);
  } catch (e) {
    return done(e);
  }

  return done();
};
