#!/usr/bin/env node

var fs = require("fs"),
    stream = require("stream");

var bencode = require("./");

var decoder = new bencode.Decoder(),
    encoder = new bencode.Encoder(),
    accumulator = new bencode.Accumulator(),
    objectifier = new bencode.Objectifier(),
    liberator = new bencode.Liberator();

decoder.on("data", function(obj) {
  console.log("<<<", obj);
});

encoder.on("data", function(chunk) {
  console.log(">>>", chunk);
});

accumulator.on("data", function(obj) {
  console.log("---", obj);
});

fs.createReadStream("./test.torrent").pipe(decoder).pipe(accumulator).pipe(objectifier).pipe(liberator).pipe(encoder).pipe(fs.createWriteStream("./out.torrent"));
