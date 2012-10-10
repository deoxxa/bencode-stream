#!/usr/bin/env node

var bencode = require("./index");

var decoder = new bencode.Decoder();

decoder.on("data", function(data) {
  console.log(data);
});

decoder.write("d1");
decoder.write(":");
decoder.write("ai12");
decoder.write("34e1:bli1ei2eee");
