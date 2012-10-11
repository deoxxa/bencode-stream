#!/usr/bin/env node

var bencode = require("./index");

var decoder = new bencode.Decoder(),
    encoder = new bencode.Encoder();

decoder.on("data", function(data) {
  console.log("decoded", data);

  encoder.write(data);
});

encoder.on("data", function(data) {
  console.log("encoded", data);
});

decoder.write("d2");
decoder.write(":a");
decoder.write("ai-12");
decoder.write("34e1:bl");
decoder.write("i1ei2eee");
