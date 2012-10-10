var stream = require("stream"),
    util = require("util");

var Decoder = module.exports = function Decoder() {
  stream.Stream.call(this);

  this.writable = true;
  this.readable = true;

  this.buffers = [];

  this.state = "root";
  this.states = [this.state];
};

util.inherits(Decoder, stream.Stream);

Decoder.prototype.write = function(data) {
  if (typeof data === "string") {
    data = Buffer(data);
  }

  var offset = 0;

  while (offset < data.length) {
    if (this.state === "string-data") {
      var to_take = Math.min(this.string_length, data.length - offset);

      this.emit("data", {type: "string-data", data: data.slice(offset, offset + to_take)});

      offset += to_take;
      this.string_length -= to_take;

      if (this.string_length === 0) {
        this.states.pop();
        this.state = this.states[this.states.length - 1];

        this.emit("data", {type: "string-end"});

        if (this.state === "dict-key") {
          this.state = "dict-value";
          this.states.push(this.state);
        }
      }

      continue;
    }

    if ((this.state === "root" || this.state === "list" || this.state === "dict-value") && data[offset] === 105) {
      this.state = "integer";
      this.states.push(this.state);
      this.integer_buffer = "";
      offset++;
      continue;
    }

    if (this.state === "integer" && ((data[offset] >= 48 && data[offset] <= 57) || data[offset] === 45)) {
      if (data[offset] === 45) {
        if (this.integer_buffer.length !== 0) {
          this.emit("error", Error("found `-' but we're not at the start of a number"));
          break;
        }

        this.integer_buffer += data.asciiSlice(offset, offset+1);
        offset++;
      }

      while (offset < data.length && data[offset] >= 48 && data[offset] <= 57) {
        this.integer_buffer += data.asciiSlice(offset, offset+1);
        offset++;
      }

      continue;
    }

    if (this.state === "integer" && data[offset] === 101) {
      this.states.pop();
      this.state = this.states[this.states.length - 1];

      if (this.state === "dict-value") {
        this.states.pop();
        this.state = this.states[this.states.length - 1];

        this.emit("data", {type: "dict-value"});
      }

      offset++;

      this.emit("data", {type: "integer", data: this.integer_buffer});

      delete this.integer_buffer;

      continue;
    }

    if ((this.state === "root" || this.state === "list" || this.state === "dict-key" || this.state === "dict-value" || this.state === "string-length") && (data[offset] >= 48 && data[offset] <= 57)) {
      if (this.state === "dict-key") {
        this.emit("data", {type: "dict-key"});
      }

      if (this.state === "dict-value") {
        this.states.pop();
        this.state = this.states[this.states.length - 1];

        this.emit("data", {type: "dict-value"});
      }

      if (this.state !== "string-length") {
        this.state = "string-length";
        this.states.push(this.state);
        this.string_length_buffer = "";
      }

      while (offset < data.length && data[offset] >= 48 && data[offset] <= 57) {
        this.string_length_buffer += data.asciiSlice(offset, offset+1);
        offset++;
      }

      continue;
    }

    if (this.state === "string-length" && data[offset] === 58) {
      this.states.pop();

      if (this.state === "dict-value") {
        this.states.pop();
        this.state = this.states[this.states.length - 1];

        this.emit("data", {type: "dict-value"});
      }

      offset++;

      this.string_length = parseInt(this.string_length_buffer, 10);
      delete this.string_length_buffer;

      this.emit("data", {type: "string-start"});

      this.state = "string-data";
      this.states.push(this.state);

      continue;
    }

    if ((this.state === "root" || this.state === "list" || this.state === "dict-value") && data[offset] === 108) {
      if (this.state === "dict-value") {
        this.states.pop();
        this.state = this.states[this.states.length - 1];

        this.emit("data", {type: "dict-value"});
      }

      this.emit("data", {type: "list-open"});

      this.state = "list"; this.states.push(this.state);

      offset++;

      continue;
    }

    if ((this.state === "root" || this.state === "list" || this.state === "dict-value") && data[offset] === 100) {
      if (this.state === "dict-value") {
        this.states.pop();
        this.state = this.states[this.states.length - 1];

        this.emit("data", {type: "dict-value"});
      }

      this.emit("data", {type: "dict-open"});

      this.state = "dict-key"; this.states.push(this.state);

      offset++;

      continue;
    }

    if ((this.state === "list" || this.state === "dict-key") && data[offset] === 101) {
      switch (this.state) {
        case "list": this.emit("data", {type: "list-close"}); break;
        case "dict-key": this.emit("data", {type: "dict-close"}); break;
      }

      offset++;

      this.states.pop();
      this.state = this.states[this.states.length - 1];

      continue;
    }

    this.emit("error", Error("couldn't parse data at offset " + offset));
  }

  return true;
};
