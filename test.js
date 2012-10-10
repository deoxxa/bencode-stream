#!/usr/bin/env node

var bencode = require("./index");

var decoder = new bencode.Decoder();

decoder.on("data", function(data) {
  console.log(data);
});

decoder.write("d2");
decoder.write(":a");
decoder.write("ai12");
decoder.write("34e1:bl");
decoder.write("i1ei2eee");
