#!/usr/bin/env node

var bencode = require("./index");

var decoder = new bencode.Decoder();

decoder.on("data", function(data) {
  console.log(data);
});

decoder.write("d1:ai1234e1:bli1ei2eee");
