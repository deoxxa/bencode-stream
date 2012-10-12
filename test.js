#!/usr/bin/env node

var fs = require("fs");

var bencode = require("./index");

var decoder = new bencode.Decoder(),
    encoder = new bencode.Encoder();

decoder.on("data", function(data) {
  if (data.type === "string-data") {
//    data.data = data.data.toString();
  }

  console.log("<<<", data);

  encoder.write(data);
});

encoder.on("data", function(data) {
  console.log(">>>", data);
});

fs.createReadStream("./test.torrent").on("data", decoder.write.bind(decoder));
