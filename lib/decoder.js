var stream = require("stream"),
    util = require("util");

var Decoder = module.exports = function Decoder() {
  stream.Stream.call(this);

  this.writable = true;
  this.readable = true;

  this.paused = false;
  this.closing = false;

  this.queue = [];

  this.states = [{integer: true, string: true, list: true, dict: true}];
}

util.inherits(Decoder, stream.Stream);

Decoder.prototype.write = function write(data) {
  console.log("decoder", "write", data.length);

  if (typeof data === "string") {
    data = Buffer(data);
  }

  var offset = 0;

  while (offset < data.length) {
    if (this.states[0].dict_pair && data[offset] >= 48 && data[offset] <= 57) {
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

      this.emit_data({type: "dict-key"});

      this.states.unshift({string: true});

      continue;
    }

    if (this.states[0].dict_value) {
      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.emit_data({type: "dict-value"});

      this.states.unshift({string: true, integer: true, list: true, dict: true});

      continue;
    }

    if (this.states[0].string && data[offset] >= 48 && data[offset] <= 57) {
      this.string_length = 0;

      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.states.unshift({string_length: true}, {string_data: true});

      continue;
    }

    if (this.states[0].string_length && data[offset] >= 48 && data[offset] <= 57) {
      var string_offset = offset;

      while (offset < data.length && data[offset] >= 48 && data[offset] <= 57) {
        this.string_length = (this.string_length * 10) + (data[offset] - 48);
        offset++;
      }

      this.states[0].string_separator = true;

      continue;
    }

    if (this.states[0].string_separator && data[offset] === 58) {
      offset++;

      this.emit_data({type: "string-start", length: this.string_length});

      this.states.shift();

      continue;
    }

    if (this.states[0].string_data && this.string_length) {
      var to_take = Math.min(this.string_length, data.length - offset);

      this.emit_data({type: "string-data", data: data.slice(offset, offset + to_take)});

      offset += to_take;
      this.string_length -= to_take;

      if (this.string_length === 0) {
        this.emit_data({type: "string-end"});

        delete this.string_length;

        this.states.shift();
      }

      continue;
    }

    if (this.states[0].integer && data[offset] === 105) {
      this.emit_data({type: "integer-start"});

      offset++;

      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.states.unshift({integer_sign: true, integer_data: true});

      continue;
    }

    if (this.states[0].integer_sign && data[offset] === 45) {
      this.emit_data({type: "integer-sign"});

      offset++;

      this.states.shift();
      this.states.unshift({integer_data: true});

      continue;
    }

    if (this.states[0].integer_data && data[offset] >= 48 && data[offset] <= 57) {
      var integer_offset = offset;

      while (offset < data.length && data[offset] >= 48 && data[offset] <= 57) {
        offset++;
      }

      this.emit_data({type: "integer-data", data: Buffer(data.slice(integer_offset, offset))});

      this.states[0].integer_end = true;

      continue;
    }

    if (this.states[0].integer_end && data[offset] === 101) {
      this.emit_data({type: "integer-end"});

      offset++;

      this.states.shift();

      continue;
    }

    if (this.states[0].list && data[offset] === 108) {
      this.emit_data({type: "list-start"});

      offset++;

      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.states.unshift({multiple: true, integer: true, string: true, list: true, dict: true}, {list_end: true});

      continue;
    }

    if (this.states[0].list_end && data[offset] === 101) {
      this.emit_data({type: "list-end"});

      offset++;

      this.states.shift();

      continue;
    }

    if (this.states[0].dict && data[offset] === 100) {
      this.emit_data({type: "dict-start"});

      offset++;

      if (!this.states[0].multiple) {
        this.states.shift();
      }

      this.states.unshift({multiple: true, dict_pair: true}, {dict_end: true});

      continue;
    }

    if (this.states[0].dict_end && data[offset] === 101) {
      this.emit_data({type: "dict-end"});

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

  return this.writable;
};

Decoder.prototype.end = function end(data) {
  console.log("decoder", "end");

  if (data) {
    this.write(data);
  }

  this.writable = false;
  this.closing = true;

  this.destroySoon();
};

Decoder.prototype.destroySoon = function destroySoon() {
  console.log("decoder", "destroySoon");

  if (this.queue.length === 0) {
    this.destroy();
  } else {
    process.nextTick(this.destroySoon.bind(this));
  }
};

Decoder.prototype.destroy = function destroy() {
  console.log("decoder", "destroy");

  this.emit("close");

  this.readable = false;
};

Decoder.prototype.pause = function pause() {
  console.log("decoder", "pause");

  this.writable = false;
  this.paused = true;
};

Decoder.prototype.resume = function resume() {
  console.log("decoder", "resume");

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

Decoder.prototype.emit_data = function emit_data(data) {
  console.log("decoder", "emit_data");

  this.queue.push(data);
  this.emit_one();
};

Decoder.prototype.emit_one = function emit_one() {
  console.log("decoder", "emit_one", this.queue.length);

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
