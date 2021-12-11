const { Transform } = require('stream');
const { Buffer } = require('buffer');

class Volume extends Transform {
  constructor(volume, bitDepth) {
    super();

    if (volume === undefined) {
      this.volume = 1;
    }
    else {
      this.volume = volume;
    }

    if (bitDepth === undefined) {
      this._bitDepth = 16;
    }
    else {
      this._bitDepth = bitDepth;
    }

    this._wordLen = this._bitDepth/8;
    this._wordMax = Math.pow(2, this._bitDepth - 1) - 1;
    this._wordMin = -this._wordMax - 1;

    this._word = 0; // reusable variable for calculated PCM words

    this._peak = new Array(100);
    this._peak.fill(0);
    this._peakPos = 0;
  }

  // peak over 100 chunks
  get peak() {
    return Math.max.apply(null, this._peak);
  }

  setVolume(volume) {
    this.volume = volume;
    // c.f. https://dsp.stackexchange.com/questions/2990/how-to-change-volume-of-a-pcm-16-bit-signed-audio/2996#2996
    //this.multiplier = Math.pow(10, (-48 + 54*this.volume)/20);

    // c.f. http://www.ypass.net/blog/2010/01/pcm-audio-part-3-basic-audio-effects-volume-control/
    this.multiplier = Math.tan(this.volume);
  }

  setBitDepth(bitDepth) {
    this._bitDepth = bitDepth;
    this._wordLen = this._bitDepth/8;
    this._wordMax = Math.pow(2, this._bitDepth - 1) - 1;
    this._wordMin = -this._wordMax - 1;
  }

  _transform(buf, encoding, callback) {
    // create a new Buffer for the transformed data
    let out = Buffer.alloc(buf.length);
  
    let peak = 0;

    // Iterate the chunks
    for (let i = 0; i < buf.length; i+=this._wordLen) {
      // read input word, multiply with volume multiplier and round down
      this._word = Math.floor(this.volume * buf.readIntLE(i, this._wordLen));
  
      // higher/lower values exceed max word size
      this._word = Math.min(this._wordMax, this._word);
      this._word = Math.max(this._wordMin, this._word);

      // Determine the peak volume
      if (this._word > peak) peak = this._word;
  
      // write transformed word into the output buffer
      out.writeIntLE(this._word, i, this._wordLen);
    }
  
    // Add peak to peak array for a moving maximum calculation
    this._peak[this._peakPos] = peak / this._wordMax;
    this._peakPos++;
    if (this._peakPos >= this._peak.length) this._peakPos = 0;

    // return the buffer with the changed values
    this.push(out);
    callback();
  };
}

module.exports = Volume;
