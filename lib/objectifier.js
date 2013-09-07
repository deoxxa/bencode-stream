var stream = require("stream");

var Objectifier = module.exports = function Objectifier(options) {
  options = options || {};

  options.objectMode = true;

  stream.Transform.call(this, options);

  this._state = [];
  this._context = [];
};
Objectifier.prototype = Object.create(stream.Transform.prototype, {constructor: {value: Objectifier}});

Objectifier.prototype._transform = function _transform(input, encoding, done) {
  if (input.type === "list-start") {
    this._state.push("list");

    this._context.push([]);

    return done();  
  }

  if (input.type === "dict-start") {
    this._state.push("dict");

    this._context.push({});

    return done();
  }

  if (input.type === "dict-key") {
    this._state.push("dict-key");

    return done();
  }

  if (input.type === "dict-value") {
    this._state.push("dict-value");

    return done();
  }

  if (this._state[this._state.length - 1] === "dict-key") {
    if (input.type !== "string") {
      return done(Error("invalid type for dict key; expected string but got " + input.type));
    }

    this._state.pop();

    this._context.push(input.data);

    return done();
  }

  if (input.type === "string" || input.type === "integer") {
    this._context.push(input.data);
  }

  if (input.type === "dict-end" || input.type === "list-end") {
    this._state.pop();
  }

  if (this._state[this._state.length - 1] === "dict-value") {
    this._state.pop();

    var val = this._context.pop(),
        key = this._context.pop(),
        obj = this._context[this._context.length - 1];

    obj[key] = val;

    return done();
  }

  if (this._state[this._state.length - 1] === "list") {
    var val = this._context.pop(),
        arr = this._context[this._context.length - 1];

    arr.push(val);

    return done();
  }

  if (this._state.length === 0) {
    this.push(this._context.pop());

    return done();
  }

  return done(Error("shouldn't have gotten to the end"));
};
