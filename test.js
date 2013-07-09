#!/usr/bin/env node

var fs = require("fs");

var bencode = require("./");

var decoder = new bencode.Decoder(),
    encoder = new bencode.Encoder(),
    accumulator = new bencode.Accumulator();

decoder.on("data", function(obj) {
  console.log("<<<", obj);
});

encoder.on("data", function(chunk) {
  console.log(">>>", chunk);
});

accumulator.on("data", function(obj) {
  console.log("---", obj);
});

fs.createReadStream("./test.torrent").pipe(decoder).pipe(accumulator).pipe(encoder).pipe(fs.createWriteStream("./out.torrent"));
