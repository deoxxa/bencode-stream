var stream = require("stream");

var Decoder = module.exports = function Decoder(options) {
  options = options || {};
  options.objectMode = true;

  stream.Transform.call(this, options);

  this.states = [{integer: true, string: true, list: true, dict: true}];
};
Decoder.prototype = Object.create(stream.Transform.prototype, {constructor: {value: Decoder}});

Decoder.prototype._transform = function _transform(input, encoding, done) {
  if (typeof input === "string") {
    input = Buffer(input);
  }

  var offset = 0;

  while (offset < input.length) {
    if (this.states[0].dict_pair && input[offset] >= 48 && input[offset] <= 57) {
      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.states.unshift({dict_key: true}, {dict_value: true});

      continue;
    }

    if (this.states[0].dict_key) {
      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.push({type: "dict-key"});

      this.states.unshift({string: true});

      continue;
    }

    if (this.states[0].dict_value) {
      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.push({type: "dict-value"});

      this.states.unshift({string: true, integer: true, list: true, dict: true});

      continue;
    }

    if (this.states[0].string && input[offset] >= 48 && input[offset] <= 57) {
      this.string_length = 0;

      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.states.unshift({string_length: true}, {string_data: true});

      continue;
    }

    if (this.states[0].string_length && input[offset] >= 48 && input[offset] <= 57) {
      var string_offset = offset;

      while (offset < input.length && input[offset] >= 48 && input[offset] <= 57) {
        this.string_length = (this.string_length * 10) + (input[offset] - 48);
        offset++;
      }

      this.states[0].string_separator = true;

      continue;
    }

    if (this.states[0].string_separator && input[offset] === 58) {
      offset++;

      this.push({type: "string-start", length: this.string_length});

      this.states.shift();

      continue;
    }

    if (this.states[0].string_data && this.string_length) {
      var to_take = Math.min(this.string_length, input.length - offset);

      this.push({type: "string-data", data: input.slice(offset, offset + to_take)});

      offset += to_take;
      this.string_length -= to_take;

      continue;
    }

    if (this.states[0].string_data && this.string_length === 0) {
      this.push({type: "string-end"});

      delete this.string_length;

      this.states.shift();

      continue;
    }

    if (this.states[0].integer && input[offset] === 105) {
      this.push({type: "integer-start"});

      offset++;

      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.states.unshift({integer_sign: true, integer_data: true});

      continue;
    }

    if (this.states[0].integer_sign && input[offset] === 45) {
      this.push({type: "integer-sign"});

      offset++;

      this.states.shift();
      this.states.unshift({integer_data: true});

      continue;
    }

    if (this.states[0].integer_data && input[offset] >= 48 && input[offset] <= 57) {
      var integer_offset = offset;

      while (offset < input.length && input[offset] >= 48 && input[offset] <= 57) {
        offset++;
      }

      this.push({type: "integer-data", data: Buffer(input.slice(integer_offset, offset))});

      this.states[0].integer_end = true;

      continue;
    }

    if (this.states[0].integer_end && input[offset] === 101) {
      this.push({type: "integer-end"});

      offset++;

      this.states.shift();

      continue;
    }

    if (this.states[0].list && input[offset] === 108) {
      this.push({type: "list-start"});

      offset++;

      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.states.unshift({multiple: true, integer: true, string: true, list: true, dict: true}, {list_end: true});

      continue;
    }

    if (this.states[0].list_end && input[offset] === 101) {
      this.push({type: "list-end"});

      offset++;

      this.states.shift();

      continue;
    }

    if (this.states[0].dict && input[offset] === 100) {
      this.push({type: "dict-start"});

      offset++;

      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.states.unshift({multiple: true, dict_pair: true}, {dict_end: true});

      continue;
    }

    if (this.states[0].dict_end && input[offset] === 101) {
      this.push({type: "dict-end"});

      offset++;

      this.states.shift();

      continue;
    }

    if (this.states[0].multiple) {
      this.states.shift();

      continue;
    }

    throw new Error("lol bad data");
  }

  return done();
};
