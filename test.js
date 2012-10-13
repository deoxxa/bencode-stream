#!/usr/bin/env node

var fs = require("fs");

var bencode = require("./index");

var decoder = new bencode.Decoder(),
    encoder = new bencode.Encoder();

decoder.on("data", function(data) {
  if (data.type === "string-data") {
    data.length = data.data.length;
  }

  console.log("<<<", data);
});

encoder.on("data", function(data) {
  console.log(">>>", data);
});

fs.createReadStream("./test.torrent").pipe(decoder).pipe(encoder).pipe(fs.createWriteStream("./out.torrent"));
