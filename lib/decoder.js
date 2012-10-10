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
  var offset = 0;

  while (offset < data.length) {
    if ((this.state === "root" || this.state === "list" || this.state === "dict-value") && data[offset] === "i") {
      this.state = "integer";
      this.states.push(this.state);
      this.integer_buffer = "";
      offset++;
      continue;
    }

    if (this.state === "integer" && ((data[offset] >= "0" && data[offset] <= "9") || data[offset] === "-")) {
      if (data[offset] === "-") {
        if (this.integer_buffer.length !== 0) {
          this.emit("error", Error("found `-' but we're not at the start of a number"));
          break;
        }

        this.integer_buffer += data[offset];
        offset++;
      }

      while (data[offset] >= "0" && data[offset] <= "9") {
        this.integer_buffer += data[offset];
        offset++;
      }

      continue;
    }

    if (this.state === "integer" && data[offset] === "e") {
      this.emit("data", {type: "integer", data: this.integer_buffer});
      offset++;
      this.states.pop();
      this.state = this.states[this.states.length - 1];
      delete this.integer_buffer;
      continue;
    }

    if ((this.state === "root" || this.state === "list" || this.state === "dict-value") && data[offset] === "l") {
      this.emit("data", {type: "list-open"});
      this.state = "list"; this.states.push(this.state);
      offset++;
      continue;
    }

    if ((this.state === "root" || this.state === "list" || this.state === "dict-value") && data[offset] === "d") {
      this.emit("data", {type: "dict-open"});
      this.state = "dict-key"; this.states.push(this.state);
      offset++;
      continue;
    }

    if ((this.state === "list" || this.state === "dict-key") && data[offset] === "e") {
      switch (this.state) {
        case "list": this.emit("data", {type: "list-close"}); break;
        case "dict-key": this.emit("data", {type: "dict-close"}); break;
      }

      offset++;

      this.states.pop();
      this.state = this.states[this.states.length - 1];

      continue;
    }
  }

  return true;
};
