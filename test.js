#!/usr/bin/env node

var bencode = require("./index");

var decoder = new bencode.Decoder();

decoder.on("data", function(data) {
  console.log(data);
});

decoder.write("l4:aaaa4:aaaae");
