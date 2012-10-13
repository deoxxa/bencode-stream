#!/usr/bin/env node

var fs = require("fs");

var bencode = require("./index");

var encoder = new bencode.Encoder();

encoder.pipe(fs.createWriteStream("./test.torrent"));

encoder.write({type: "dict-start"});

for (var i=0;i<parseInt(process.argv[2] || "50", 10);++i) {
  var k = ["entry", i].join("_"),
      v = new Array(101).join("a");

  encoder.write({type: "string-start", length: k.length});
  encoder.write({type: "string-data", data: k});
  encoder.write({type: "string-start", length: v.length});
  encoder.write({type: "string-data", data: v});
}

encoder.write({type: "dict-end"});

encoder.end();
