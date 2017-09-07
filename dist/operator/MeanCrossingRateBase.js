"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaults = {
  noiseThreshold: 0.1,
  // this is used only with internal circular buffer (fed sample by sample)
  frameSize: 50,
  hopSize: 5,
  sampleRate: null
};

var MeanCrossingRate = function () {
  function MeanCrossingRate() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MeanCrossingRate);

    (0, _assign2.default)({}, options, defaults);

    this.mean = 0;
    this.magnitude = 0;
    this.stdDev = 0;
    this.crossings = [];
    this.periodMean = 0;
    this.periodStdDev = 0;
    this.inputFrame = [];

    this.setConfig(options);

    //this.maxFreq = this.inputRate / 0.5;    
  }

  (0, _createClass3.default)(MeanCrossingRate, [{
    key: "setConfig",
    value: function setConfig(cfg) {
      if (cfg.noiseThreshold) {
        this.noiseThreshold = cfg.noiseThreshold;
      }

      if (cfg.frameSize) {
        this.frameSize = cfg.frameSize;
      }

      if (cfg.hopSize) {
        this.hopSize = cfg.hopSize;
      }

      if (cfg.sampleRate) {
        this.sampleRate = cfg.sampleRate;
        // this.maxFreq = this.sampleRate / 2;
      }

      this.inputBuffer = new Array(this.frameSize);
      for (var i = 0; i < this.frameSize; i++) {
        this.inputBuffer[i] = 0;
      }

      this.hopCounter = 0;
      this.bufferIndex = 0;

      this.results = { amplitude: 0, frequency: 0, periodicity: 0 };
    }
  }, {
    key: "process",
    value: function process(value) {
      // update internal circular buffer
      // then call processFrame(this.inputBuffer) if needed
      this.inputBuffer[this.bufferIndex] = value;
      this.bufferIndex = (this.bufferIndex + 1) % this.frameSize;

      if (this.hopCounter === this.hopSize - 1) {
        this.hopCounter = 0;
        this.processFrame(this.inputBuffer, this.bufferIndex);
      } else {
        this.hopCounter++;
      }

      return this.results;
    }

    // compute magnitude, zero crossing rate, and periodicity

  }, {
    key: "processFrame",
    value: function processFrame(frame) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      if (frame.length < 2) {
        return { amplitude: 0, frequency: 0, periodicity: 0 };
      }

      this.inputFrame = frame;

      this._mainAlgorithm();

      // TODO: improve this (2.0 is empirical factor because we don't know a priori sensor range)
      this.amplitude = this.stdDev * 2.0;

      // console.log(this.crossings.length);
      // not used anymore (remove ?)
      // this.frequency = Math.sqrt(this.crossings.length * 2.0 / this.inputFrame.length); // sqrt'ed normalized by nyquist freq

      /* * * * * * * * * * * * * * * */

      // this one is working with one direction crossings detection version
      // this.frequency = this.crossings.length * 2.0 / this.inputFrame.length; // normalized by nyquist freq

      // this one is working with two direction crossings detection version
      this.frequency = this.crossings.length / (this.inputFrame.length - 1); // beware of division by zero

      /* * * * * * * * * * * * * * * */

      // if sampleRate is specified, translate normalized frequency to Hertz :
      if (this.sampleRate) {
        this.frequency *= Math.floor(this.sampleRate / 2);
      }

      if (this.crossings.length > 2) {
        //let clip = this.periodStdDev * 5 / this.inputFrame.length;
        //clip = Math.min(clip, 1.);
        //this.periodicity = 1.0 - Math.sqrt(clip);

        // periodicity is normalized based on input frame size.
        this.periodicity = 1.0 - Math.sqrt(this.periodStdDev / this.inputFrame.length);
        //this.periodicity = 1.0 - Math.pow(this.periodStdDev / this.inputFrame.length, 0.7);
      } else {
        this.periodicity = 0;
      }

      this.results.amplitude = this.amplitude;
      this.results.frequency = this.frequency;
      this.results.periodicity = this.periodicity;

      return this.results;
    }
  }, {
    key: "_mainAlgorithm",
    value: function _mainAlgorithm() {

      // compute min, max, mean and magnitude
      var min = void 0,
          max = void 0;
      min = max = this.inputFrame[0];
      this.mean = 0;
      this.magnitude = 0;
      for (var i in this.inputFrame) {
        var val = this.inputFrame[i];
        this.magnitude += val * val;
        this.mean += val;

        if (val > max) {
          max = val;
        } else if (val < min) {
          min = val;
        }
      }

      // TODO : more tests to determine which mean (true mean or (max-min)/2) is the best
      //this.mean /= this.inputFrame.length;
      this.mean = min + (max - min) * 0.5;

      // this.magnitude /= this.inputFrame.length;
      // this.magnitude = Math.sqrt(this.magnitude);

      // compute signal stdDev and number of mean-crossings
      // descending mean crossing is used here
      // now using ascending AND descending for test ...
      this.crossings = [];
      this.stdDev = 0;
      var prevDelta = this.inputFrame[0] - this.mean;
      //for (let i in this.inputFrame) {
      for (var _i = 1; _i < this.inputFrame.length; _i++) {
        var delta = this.inputFrame[_i] - this.mean;
        this.stdDev += delta * delta;
        // falling
        if (prevDelta > this.noiseThreshold && delta < this.noiseThreshold) {
          this.crossings.push(_i);
        }
        // rising
        else if (prevDelta < this.noiseThreshold && delta > this.noiseThreshold) {
            this.crossings.push(_i);
          }
        prevDelta = delta;
      }
      this.stdDev /= this.inputFrame.length - 1;
      this.stdDev = Math.sqrt(this.stdDev);

      // compute mean of delta-T between crossings
      this.periodMean = 0;
      for (var _i2 = 1; _i2 < this.crossings.length; _i2++) {
        this.periodMean += this.crossings[_i2] - this.crossings[_i2 - 1];
      }
      // if we have a NaN here we don't care as we won't use this.periodMean below
      this.periodMean /= this.crossings.length - 1;

      // compute stdDev of delta-T between crossings
      this.periodStdDev = 0;
      for (var _i3 = 1; _i3 < this.crossings.length; _i3++) {
        var deltaP = this.crossings[_i3] - this.crossings[_i3 - 1] - this.periodMean;
        this.periodStdDev += deltaP * deltaP;
      }
      if (this.crossings.length > 2) {
        this.periodStdDev = Math.sqrt(this.periodStdDev / (this.crossings.length - 2));
      }
    }
  }]);
  return MeanCrossingRate;
}();

exports.default = MeanCrossingRate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmYXVsdHMiLCJub2lzZVRocmVzaG9sZCIsImZyYW1lU2l6ZSIsImhvcFNpemUiLCJzYW1wbGVSYXRlIiwiTWVhbkNyb3NzaW5nUmF0ZSIsIm9wdGlvbnMiLCJtZWFuIiwibWFnbml0dWRlIiwic3RkRGV2IiwiY3Jvc3NpbmdzIiwicGVyaW9kTWVhbiIsInBlcmlvZFN0ZERldiIsImlucHV0RnJhbWUiLCJzZXRDb25maWciLCJjZmciLCJpbnB1dEJ1ZmZlciIsIkFycmF5IiwiaSIsImhvcENvdW50ZXIiLCJidWZmZXJJbmRleCIsInJlc3VsdHMiLCJhbXBsaXR1ZGUiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSIsInZhbHVlIiwicHJvY2Vzc0ZyYW1lIiwiZnJhbWUiLCJvZmZzZXQiLCJsZW5ndGgiLCJfbWFpbkFsZ29yaXRobSIsIk1hdGgiLCJmbG9vciIsInNxcnQiLCJtaW4iLCJtYXgiLCJ2YWwiLCJwcmV2RGVsdGEiLCJkZWx0YSIsInB1c2giLCJkZWx0YVAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsV0FBVztBQUNmQyxrQkFBZ0IsR0FERDtBQUVmO0FBQ0FDLGFBQVcsRUFISTtBQUlmQyxXQUFTLENBSk07QUFLZkMsY0FBWTtBQUxHLENBQWpCOztJQVFNQyxnQjtBQUVKLDhCQUEwQjtBQUFBLFFBQWRDLE9BQWMsdUVBQUosRUFBSTtBQUFBOztBQUN4QiwwQkFBYyxFQUFkLEVBQWtCQSxPQUFsQixFQUEyQk4sUUFBM0I7O0FBRUEsU0FBS08sSUFBTCxHQUFZLENBQVo7QUFDQSxTQUFLQyxTQUFMLEdBQWlCLENBQWpCO0FBQ0EsU0FBS0MsTUFBTCxHQUFjLENBQWQ7QUFDQSxTQUFLQyxTQUFMLEdBQWlCLEVBQWpCO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQixDQUFsQjtBQUNBLFNBQUtDLFlBQUwsR0FBb0IsQ0FBcEI7QUFDQSxTQUFLQyxVQUFMLEdBQWtCLEVBQWxC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U0FBU0EsTUFBOUI7QUFDRDtBQUNELFVBQUksS0FBSzlCLFNBQUwsQ0FBZW1CLE1BQWYsR0FBd0IsQ0FBNUIsRUFBK0I7QUFDN0IsYUFBS2pCLFlBQUwsR0FBb0JtQixLQUFLRSxJQUFMLENBQVUsS0FBS3JCLFlBQUwsSUFBcUIsS0FBS0YsU0FBTCxDQUFlbUIsTUFBZixHQUF3QixDQUE3QyxDQUFWLENBQXBCO0FBQ0Q7QUFDRjs7Ozs7a0JBR1l4QixnQiIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZGVmYXVsdHMgPSB7XG4gIG5vaXNlVGhyZXNob2xkOiAwLjEsXG4gIC8vIHRoaXMgaXMgdXNlZCBvbmx5IHdpdGggaW50ZXJuYWwgY2lyY3VsYXIgYnVmZmVyIChmZWQgc2FtcGxlIGJ5IHNhbXBsZSlcbiAgZnJhbWVTaXplOiA1MCxcbiAgaG9wU2l6ZTogNSxcbiAgc2FtcGxlUmF0ZTogbnVsbCxcbn07XG5cbmNsYXNzIE1lYW5Dcm9zc2luZ1JhdGUge1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIGRlZmF1bHRzKTtcblxuICAgIHRoaXMubWVhbiA9IDA7XG4gICAgdGhpcy5tYWduaXR1ZGUgPSAwO1xuICAgIHRoaXMuc3RkRGV2ID0gMDtcbiAgICB0aGlzLmNyb3NzaW5ncyA9IFtdO1xuICAgIHRoaXMucGVyaW9kTWVhbiA9IDA7XG4gICAgdGhpcy5wZXJpb2RTdGREZXYgPSAwO1xuICAgIHRoaXMuaW5wdXRGcmFtZSA9IFtdO1xuXG4gICAgdGhpcy5zZXRDb25maWcob3B0aW9ucyk7XG5cbiAgICAvL3RoaXMubWF4RnJlcSA9IHRoaXMuaW5wdXRSYXRlIC8gMC41OyAgICBcbiAgfVxuXG4gIHNldENvbmZpZyhjZmcpIHtcbiAgICBpZiAoY2ZnLm5vaXNlVGhyZXNob2xkKSB7XG4gICAgICB0aGlzLm5vaXNlVGhyZXNob2xkID0gY2ZnLm5vaXNlVGhyZXNob2xkO1xuICAgIH1cblxuICAgIGlmIChjZmcuZnJhbWVTaXplKSB7XG4gICAgICB0aGlzLmZyYW1lU2l6ZSA9IGNmZy5mcmFtZVNpemU7XG4gICAgfVxuXG4gICAgaWYgKGNmZy5ob3BTaXplKSB7XG4gICAgICB0aGlzLmhvcFNpemUgPSBjZmcuaG9wU2l6ZTtcbiAgICB9XG5cbiAgICBpZiAoY2ZnLnNhbXBsZVJhdGUpIHtcbiAgICAgIHRoaXMuc2FtcGxlUmF0ZSA9IGNmZy5zYW1wbGVSYXRlO1xuICAgICAgLy8gdGhpcy5tYXhGcmVxID0gdGhpcy5zYW1wbGVSYXRlIC8gMjtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0QnVmZmVyID0gbmV3IEFycmF5KHRoaXMuZnJhbWVTaXplKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZnJhbWVTaXplOyBpKyspIHtcbiAgICAgIHRoaXMuaW5wdXRCdWZmZXJbaV0gPSAwO1xuICAgIH1cblxuICAgIHRoaXMuaG9wQ291bnRlciA9IDA7XG4gICAgdGhpcy5idWZmZXJJbmRleCA9IDA7XG5cbiAgICB0aGlzLnJlc3VsdHMgPSB7IGFtcGxpdHVkZTogMCwgZnJlcXVlbmN5OiAwLCBwZXJpb2RpY2l0eTogMCB9O1xuICB9XG5cbiAgcHJvY2Vzcyh2YWx1ZSkge1xuICAgIC8vIHVwZGF0ZSBpbnRlcm5hbCBjaXJjdWxhciBidWZmZXJcbiAgICAvLyB0aGVuIGNhbGwgcHJvY2Vzc0ZyYW1lKHRoaXMuaW5wdXRCdWZmZXIpIGlmIG5lZWRlZFxuICAgIHRoaXMuaW5wdXRCdWZmZXJbdGhpcy5idWZmZXJJbmRleF0gPSB2YWx1ZTtcbiAgICB0aGlzLmJ1ZmZlckluZGV4ID0gKHRoaXMuYnVmZmVySW5kZXggKyAxKSAlIHRoaXMuZnJhbWVTaXplO1xuXG4gICAgaWYgKHRoaXMuaG9wQ291bnRlciA9PT0gdGhpcy5ob3BTaXplIC0gMSkge1xuICAgICAgdGhpcy5ob3BDb3VudGVyID0gMDtcbiAgICAgIHRoaXMucHJvY2Vzc0ZyYW1lKHRoaXMuaW5wdXRCdWZmZXIsIHRoaXMuYnVmZmVySW5kZXgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaG9wQ291bnRlcisrO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJlc3VsdHM7XG4gIH1cblxuICAvLyBjb21wdXRlIG1hZ25pdHVkZSwgemVybyBjcm9zc2luZyByYXRlLCBhbmQgcGVyaW9kaWNpdHlcbiAgcHJvY2Vzc0ZyYW1lKGZyYW1lLCBvZmZzZXQgPSAwKSB7XG4gICAgaWYgKGZyYW1lLmxlbmd0aCA8IDIpIHtcbiAgICAgIHJldHVybiB7IGFtcGxpdHVkZTogMCwgZnJlcXVlbmN5OiAwLCBwZXJpb2RpY2l0eTogMCB9O1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXRGcmFtZSA9IGZyYW1lO1xuXG4gICAgdGhpcy5fbWFpbkFsZ29yaXRobSgpO1xuXG4gICAgLy8gVE9ETzogaW1wcm92ZSB0aGlzICgyLjAgaXMgZW1waXJpY2FsIGZhY3RvciBiZWNhdXNlIHdlIGRvbid0IGtub3cgYSBwcmlvcmkgc2Vuc29yIHJhbmdlKVxuICAgIHRoaXMuYW1wbGl0dWRlID0gdGhpcy5zdGREZXYgKiAyLjA7XG5cbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmNyb3NzaW5ncy5sZW5ndGgpO1xuICAgIC8vIG5vdCB1c2VkIGFueW1vcmUgKHJlbW92ZSA/KVxuICAgIC8vIHRoaXMuZnJlcXVlbmN5ID0gTWF0aC5zcXJ0KHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCAqIDIuMCAvIHRoaXMuaW5wdXRGcmFtZS5sZW5ndGgpOyAvLyBzcXJ0J2VkIG5vcm1hbGl6ZWQgYnkgbnlxdWlzdCBmcmVxXG5cbiAgICAvKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cblxuICAgIC8vIHRoaXMgb25lIGlzIHdvcmtpbmcgd2l0aCBvbmUgZGlyZWN0aW9uIGNyb3NzaW5ncyBkZXRlY3Rpb24gdmVyc2lvblxuICAgIC8vIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5jcm9zc2luZ3MubGVuZ3RoICogMi4wIC8gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDsgLy8gbm9ybWFsaXplZCBieSBueXF1aXN0IGZyZXFcblxuICAgIC8vIHRoaXMgb25lIGlzIHdvcmtpbmcgd2l0aCB0d28gZGlyZWN0aW9uIGNyb3NzaW5ncyBkZXRlY3Rpb24gdmVyc2lvblxuICAgIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5jcm9zc2luZ3MubGVuZ3RoIC8gKHRoaXMuaW5wdXRGcmFtZS5sZW5ndGggLSAxKTsgLy8gYmV3YXJlIG9mIGRpdmlzaW9uIGJ5IHplcm9cblxuICAgIC8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xuXG4gICAgLy8gaWYgc2FtcGxlUmF0ZSBpcyBzcGVjaWZpZWQsIHRyYW5zbGF0ZSBub3JtYWxpemVkIGZyZXF1ZW5jeSB0byBIZXJ0eiA6XG4gICAgaWYgKHRoaXMuc2FtcGxlUmF0ZSkge1xuICAgICAgdGhpcy5mcmVxdWVuY3kgKj0gTWF0aC5mbG9vcih0aGlzLnNhbXBsZVJhdGUgLyAyKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCA+IDIpIHtcbiAgICAgIC8vbGV0IGNsaXAgPSB0aGlzLnBlcmlvZFN0ZERldiAqIDUgLyB0aGlzLmlucHV0RnJhbWUubGVuZ3RoO1xuICAgICAgLy9jbGlwID0gTWF0aC5taW4oY2xpcCwgMS4pO1xuICAgICAgLy90aGlzLnBlcmlvZGljaXR5ID0gMS4wIC0gTWF0aC5zcXJ0KGNsaXApO1xuXG4gICAgICAvLyBwZXJpb2RpY2l0eSBpcyBub3JtYWxpemVkIGJhc2VkIG9uIGlucHV0IGZyYW1lIHNpemUuXG4gICAgICB0aGlzLnBlcmlvZGljaXR5ID0gMS4wIC0gTWF0aC5zcXJ0KHRoaXMucGVyaW9kU3RkRGV2IC8gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aCk7XG4gICAgICAvL3RoaXMucGVyaW9kaWNpdHkgPSAxLjAgLSBNYXRoLnBvdyh0aGlzLnBlcmlvZFN0ZERldiAvIHRoaXMuaW5wdXRGcmFtZS5sZW5ndGgsIDAuNyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGVyaW9kaWNpdHkgPSAwO1xuICAgIH1cblxuICAgIHRoaXMucmVzdWx0cy5hbXBsaXR1ZGUgPSB0aGlzLmFtcGxpdHVkZTtcbiAgICB0aGlzLnJlc3VsdHMuZnJlcXVlbmN5ID0gdGhpcy5mcmVxdWVuY3k7XG4gICAgdGhpcy5yZXN1bHRzLnBlcmlvZGljaXR5ID0gdGhpcy5wZXJpb2RpY2l0eTtcblxuICAgIHJldHVybiB0aGlzLnJlc3VsdHM7XG4gIH1cblxuICBfbWFpbkFsZ29yaXRobSgpIHtcblxuICAgIC8vIGNvbXB1dGUgbWluLCBtYXgsIG1lYW4gYW5kIG1hZ25pdHVkZVxuICAgIGxldCBtaW4sIG1heDtcbiAgICBtaW4gPSBtYXggPSB0aGlzLmlucHV0RnJhbWVbMF07XG4gICAgdGhpcy5tZWFuID0gMDtcbiAgICB0aGlzLm1hZ25pdHVkZSA9IDA7XG4gICAgZm9yIChsZXQgaSBpbiB0aGlzLmlucHV0RnJhbWUpIHtcbiAgICAgIGxldCB2YWwgPSB0aGlzLmlucHV0RnJhbWVbaV07XG4gICAgICB0aGlzLm1hZ25pdHVkZSArPSB2YWwgKiB2YWw7XG4gICAgICB0aGlzLm1lYW4gKz0gdmFsO1xuXG4gICAgICBpZiAodmFsID4gbWF4KSB7XG4gICAgICAgIG1heCA9IHZhbDtcbiAgICAgIH0gZWxzZSBpZiAodmFsIDwgbWluKSB7XG4gICAgICAgIG1pbiA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIDogbW9yZSB0ZXN0cyB0byBkZXRlcm1pbmUgd2hpY2ggbWVhbiAodHJ1ZSBtZWFuIG9yIChtYXgtbWluKS8yKSBpcyB0aGUgYmVzdFxuICAgIC8vdGhpcy5tZWFuIC89IHRoaXMuaW5wdXRGcmFtZS5sZW5ndGg7XG4gICAgdGhpcy5tZWFuID0gbWluICsgKG1heCAtIG1pbikgKiAwLjU7XG5cbiAgICAvLyB0aGlzLm1hZ25pdHVkZSAvPSB0aGlzLmlucHV0RnJhbWUubGVuZ3RoO1xuICAgIC8vIHRoaXMubWFnbml0dWRlID0gTWF0aC5zcXJ0KHRoaXMubWFnbml0dWRlKTtcblxuICAgIC8vIGNvbXB1dGUgc2lnbmFsIHN0ZERldiBhbmQgbnVtYmVyIG9mIG1lYW4tY3Jvc3NpbmdzXG4gICAgLy8gZGVzY2VuZGluZyBtZWFuIGNyb3NzaW5nIGlzIHVzZWQgaGVyZVxuICAgIC8vIG5vdyB1c2luZyBhc2NlbmRpbmcgQU5EIGRlc2NlbmRpbmcgZm9yIHRlc3QgLi4uXG4gICAgdGhpcy5jcm9zc2luZ3MgPSBbXTtcbiAgICB0aGlzLnN0ZERldiA9IDA7XG4gICAgbGV0IHByZXZEZWx0YSA9IHRoaXMuaW5wdXRGcmFtZVswXSAtIHRoaXMubWVhbjtcbiAgICAvL2ZvciAobGV0IGkgaW4gdGhpcy5pbnB1dEZyYW1lKSB7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLmlucHV0RnJhbWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBkZWx0YSA9IHRoaXMuaW5wdXRGcmFtZVtpXSAtIHRoaXMubWVhbjtcbiAgICAgIHRoaXMuc3RkRGV2ICs9IGRlbHRhICogZGVsdGE7XG4gICAgICAvLyBmYWxsaW5nXG4gICAgICBpZiAocHJldkRlbHRhID4gdGhpcy5ub2lzZVRocmVzaG9sZCAmJiBkZWx0YSA8IHRoaXMubm9pc2VUaHJlc2hvbGQpIHtcbiAgICAgICAgdGhpcy5jcm9zc2luZ3MucHVzaChpKTtcbiAgICAgIH1cbiAgICAgIC8vIHJpc2luZ1xuICAgICAgZWxzZSBpZiAocHJldkRlbHRhIDwgdGhpcy5ub2lzZVRocmVzaG9sZCAmJiBkZWx0YSA+IHRoaXMubm9pc2VUaHJlc2hvbGQpIHtcbiAgICAgICAgdGhpcy5jcm9zc2luZ3MucHVzaChpKTtcbiAgICAgIH1cbiAgICAgIHByZXZEZWx0YSA9IGRlbHRhO1xuICAgIH1cbiAgICB0aGlzLnN0ZERldiAvPSAodGhpcy5pbnB1dEZyYW1lLmxlbmd0aCAtIDEpO1xuICAgIHRoaXMuc3RkRGV2ID0gTWF0aC5zcXJ0KHRoaXMuc3RkRGV2KTtcblxuICAgIC8vIGNvbXB1dGUgbWVhbiBvZiBkZWx0YS1UIGJldHdlZW4gY3Jvc3NpbmdzXG4gICAgdGhpcy5wZXJpb2RNZWFuID0gMDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMuY3Jvc3NpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnBlcmlvZE1lYW4gKz0gdGhpcy5jcm9zc2luZ3NbaV0gLSB0aGlzLmNyb3NzaW5nc1tpIC0gMV07XG4gICAgfVxuICAgIC8vIGlmIHdlIGhhdmUgYSBOYU4gaGVyZSB3ZSBkb24ndCBjYXJlIGFzIHdlIHdvbid0IHVzZSB0aGlzLnBlcmlvZE1lYW4gYmVsb3dcbiAgICB0aGlzLnBlcmlvZE1lYW4gLz0gKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCAtIDEpO1xuXG4gICAgLy8gY29tcHV0ZSBzdGREZXYgb2YgZGVsdGEtVCBiZXR3ZWVuIGNyb3NzaW5nc1xuICAgIHRoaXMucGVyaW9kU3RkRGV2ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMuY3Jvc3NpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGVsdGFQID0gKHRoaXMuY3Jvc3NpbmdzW2ldIC0gdGhpcy5jcm9zc2luZ3NbaSAtIDFdIC0gdGhpcy5wZXJpb2RNZWFuKVxuICAgICAgdGhpcy5wZXJpb2RTdGREZXYgKz0gZGVsdGFQICogZGVsdGFQO1xuICAgIH1cbiAgICBpZiAodGhpcy5jcm9zc2luZ3MubGVuZ3RoID4gMikge1xuICAgICAgdGhpcy5wZXJpb2RTdGREZXYgPSBNYXRoLnNxcnQodGhpcy5wZXJpb2RTdGREZXYgLyAodGhpcy5jcm9zc2luZ3MubGVuZ3RoIC0gMikpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNZWFuQ3Jvc3NpbmdSYXRlOyJdfQ==