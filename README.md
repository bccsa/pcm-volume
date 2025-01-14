pcm-volume
===========
This module changes the volume of a given PCM data stream. It should work with any type of little endian signed integer PCM stream, but not (yet) with floating point formats.
I don't know whether this is the right way to do things. Feel free to contact me/open a pull request if you want to add something.

Install
-------

Install with `npm install pcm-volume` or clone from GitHub and `npm install`.

How to use
----------
Pipe an existing stream into an instance of pcm-volume. You can get a PCM-stream from node-lame for example.

This example reads the file music.mp3 and changes the volume to 50% after 5seconds.
```js
var Speaker = require("speaker");
var lame = require("lame");
var fs = require("fs");
var volume = require("pcm-volume");

var readable = fs.createReadStream("music.mp3");

// see node-lame documentation for more information
var decoder = new lame.Decoder({
    channels: 2,
    bitDepth: 16,
    sampleRate: 44100,
    bitRate: 128,
    outSampleRate: 22050,
    mode: lame.STEREO
});

// Initialize speaker
var speaker = new Speaker();

// Create a volume instance
var volume = 1;         // Optional initial volume (default = 1);
var bitDepth = 16;      // Optional PCM bit depth (default = 16). Supported values: 8; 16; 24; 32;
var v = new volume(volume, bitDepth);

// Wait 5s, then change the volume to 50%
setTimeout(function() {
    v.setVolume(0.5);
}, 5000)

v.pipe(speaker); // pipe volume to speaker
decoder.pipe(v); // pipe PCM data to volume
readable.pipe(decoder); // pipe file input to decoder
```


API
---
pcm-volume is a Transform Stream (see https://nodejs.org/api/stream.html#stream_class_stream_transform for more information). Pipe in your PCM data and pipe out PCM data with a different volume.
Use setVolume(v) to set the volume (v is a float between 0 and roughly 1.5 also you can go higher but it sounds like crap).
