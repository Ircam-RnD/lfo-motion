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

/** @todo : add integrated buffer here for optimized statistics computing */

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

    (0, _assign2.default)(options, defaults);

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

      if (ctg.sampleRate) {
        this.sampleRate = cfg.sampleRate;
        // this.maxFreq = this.sampleRate / 2;
      }

      this.inputBuffer = new Array(this.frameSize);
      for (var i = 0; i < this.frameSize; i++) {
        this.inputBuffer[i] = 0;
      }

      this.hopCounter = 0;
      this.bufferIndex = 0;

      this.results = {
        amplitude: 0,
        frequency: 0,
        periodicity: 0
      };
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

      this.inputFrame = frame;

      this._mainAlgorithm();

      // TODO: improve this (2.0 is empirical factor because we don't know a priori sensor range)
      this.amplitude = this.stdDev * 2.0;

      // console.log(this.crossings.length);
      // not used anymore (remove ?)
      // this.frequency = Math.sqrt(this.crossings.length * 2.0 / this.inputFrame.length); // sqrt'ed normalized by nyquist freq

      // this one is working wth one direction crossings detection version
      // this.frequency = this.crossings.length * 2.0 / this.inputFrame.length; // normalized by nyquist freq

      // this one is working with two direction crossings detection version
      this.frequency = this.crossings.length / (this.inputFrame.length - 1); // beware of division by zero
      // if sampleRate is specified, translate normalized frequency to Hertz :
      if (this.sampleRate) {
        this.frequency *= Math.floo(this.sampleRate / 2);
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

      this.magnitude /= this.inputFrame.length;
      this.magnitude = Math.sqrt(this.magnitude);

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
        if (prevDelta > this.noiseThreshold && delta < this.noiseThreshold) {
          this.crossings.push(_i);
        } else if (prevDelta < this.noiseThreshold && delta > this.noiseThreshold) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmYXVsdHMiLCJub2lzZVRocmVzaG9sZCIsImZyYW1lU2l6ZSIsImhvcFNpemUiLCJzYW1wbGVSYXRlIiwiTWVhbkNyb3NzaW5nUmF0ZSIsIm9wdGlvbnMiLCJtZWFuIiwibWFnbml0dWRlIiwic3RkRGV2IiwiY3Jvc3NpbmdzIiwicGVyaW9kTWVhbiIsInBlcmlvZFN0ZERldiIsImlucHV0RnJhbWUiLCJzZXRDb25maWciLCJjZmciLCJjdGciLCJpbnB1dEJ1ZmZlciIsIkFycmF5IiwiaSIsImhvcENvdW50ZXIiLCJidWZmZXJJbmRleCIsInJlc3VsdHMiLCJhbXBsaXR1ZGUiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSIsInZhbHVlIiwicHJvY2Vzc0ZyYW1lIiwiZnJhbWUiLCJvZmZzZXQiLCJfbWFpbkFsZ29yaXRobSIsImxlbmd0aCIsIk1hdGgiLCJmbG9vIiwic3FydCIsIm1pbiIsIm1heCIsInZhbCIsInByZXZEZWx0YSIsImRlbHRhIiwicHVzaCIsImRlbHRhUCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFFQSxJQUFNQSxXQUFXO0FBQ2ZDLGtCQUFnQixHQUREO0FBRWY7QUFDQUMsYUFBVyxFQUhJO0FBSWZDLFdBQVMsQ0FKTTtBQUtmQyxjQUFZO0FBTEcsQ0FBakI7O0lBUU1DLGdCO0FBRUosOEJBQTBCO0FBQUEsUUFBZEMsT0FBYyx1RUFBSixFQUFJO0FBQUE7O0FBQ3hCLDBCQUFjQSxPQUFkLEVBQXVCTixRQUF2Qjs7QUFFQSxTQUFLTyxJQUFMLEdBQVksQ0FBWjtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsQ0FBakI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsQ0FBZDtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxTQUFLQyxVQUFMLEdBQWtCLENBQWxCO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixDQUFwQjtBQUNBLFNBQUtDLFVBQUwsR0FBa0IsRUFBbEI7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QWVxQixNQUFmLEdBQXdCLENBQTVCLEVBQStCO0FBQzdCLGFBQUtuQixZQUFMLEdBQW9Cb0IsS0FBS0UsSUFBTCxDQUFVLEtBQUt0QixZQUFMLElBQXFCLEtBQUtGLFNBQUwsQ0FBZXFCLE1BQWYsR0FBd0IsQ0FBN0MsQ0FBVixDQUFwQjtBQUNEO0FBQ0Y7Ozs7O2tCQUdZMUIsZ0IiLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAdG9kbyA6IGFkZCBpbnRlZ3JhdGVkIGJ1ZmZlciBoZXJlIGZvciBvcHRpbWl6ZWQgc3RhdGlzdGljcyBjb21wdXRpbmcgKi9cblxuY29uc3QgZGVmYXVsdHMgPSB7XG4gIG5vaXNlVGhyZXNob2xkOiAwLjEsXG4gIC8vIHRoaXMgaXMgdXNlZCBvbmx5IHdpdGggaW50ZXJuYWwgY2lyY3VsYXIgYnVmZmVyIChmZWQgc2FtcGxlIGJ5IHNhbXBsZSlcbiAgZnJhbWVTaXplOiA1MCxcbiAgaG9wU2l6ZTogNSxcbiAgc2FtcGxlUmF0ZTogbnVsbCxcbn07XG5cbmNsYXNzIE1lYW5Dcm9zc2luZ1JhdGUge1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIE9iamVjdC5hc3NpZ24ob3B0aW9ucywgZGVmYXVsdHMpO1xuXG4gICAgdGhpcy5tZWFuID0gMDtcbiAgICB0aGlzLm1hZ25pdHVkZSA9IDA7XG4gICAgdGhpcy5zdGREZXYgPSAwO1xuICAgIHRoaXMuY3Jvc3NpbmdzID0gW107XG4gICAgdGhpcy5wZXJpb2RNZWFuID0gMDtcbiAgICB0aGlzLnBlcmlvZFN0ZERldiA9IDA7XG4gICAgdGhpcy5pbnB1dEZyYW1lID0gW107XG5cbiAgICB0aGlzLnNldENvbmZpZyhvcHRpb25zKTtcblxuICAgIC8vdGhpcy5tYXhGcmVxID0gdGhpcy5pbnB1dFJhdGUgLyAwLjU7ICAgIFxuICB9XG5cbiAgc2V0Q29uZmlnKGNmZykge1xuICAgIGlmIChjZmcubm9pc2VUaHJlc2hvbGQpIHtcbiAgICAgIHRoaXMubm9pc2VUaHJlc2hvbGQgPSBjZmcubm9pc2VUaHJlc2hvbGQ7XG4gICAgfVxuXG4gICAgaWYgKGNmZy5mcmFtZVNpemUpIHtcbiAgICAgIHRoaXMuZnJhbWVTaXplID0gY2ZnLmZyYW1lU2l6ZTtcbiAgICB9XG5cbiAgICBpZiAoY2ZnLmhvcFNpemUpIHtcbiAgICAgIHRoaXMuaG9wU2l6ZSA9IGNmZy5ob3BTaXplO1xuICAgIH1cblxuICAgIGlmIChjdGcuc2FtcGxlUmF0ZSkge1xuICAgICAgdGhpcy5zYW1wbGVSYXRlID0gY2ZnLnNhbXBsZVJhdGU7XG4gICAgICAvLyB0aGlzLm1heEZyZXEgPSB0aGlzLnNhbXBsZVJhdGUgLyAyO1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXRCdWZmZXIgPSBuZXcgQXJyYXkodGhpcy5mcmFtZVNpemUpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mcmFtZVNpemU7IGkrKykge1xuICAgICAgdGhpcy5pbnB1dEJ1ZmZlcltpXSA9IDA7XG4gICAgfVxuXG4gICAgdGhpcy5ob3BDb3VudGVyID0gMDtcbiAgICB0aGlzLmJ1ZmZlckluZGV4ID0gMDtcblxuICAgIHRoaXMucmVzdWx0cyA9IHtcbiAgICAgIGFtcGxpdHVkZTogMCxcbiAgICAgIGZyZXF1ZW5jeTogMCxcbiAgICAgIHBlcmlvZGljaXR5OiAwXG4gICAgfTtcbiAgfVxuXG4gIHByb2Nlc3ModmFsdWUpIHtcbiAgICAvLyB1cGRhdGUgaW50ZXJuYWwgY2lyY3VsYXIgYnVmZmVyXG4gICAgLy8gdGhlbiBjYWxsIHByb2Nlc3NGcmFtZSh0aGlzLmlucHV0QnVmZmVyKSBpZiBuZWVkZWRcbiAgICB0aGlzLmlucHV0QnVmZmVyW3RoaXMuYnVmZmVySW5kZXhdID0gdmFsdWU7XG4gICAgdGhpcy5idWZmZXJJbmRleCA9ICh0aGlzLmJ1ZmZlckluZGV4ICsgMSkgJSB0aGlzLmZyYW1lU2l6ZTtcblxuICAgIGlmICh0aGlzLmhvcENvdW50ZXIgPT09IHRoaXMuaG9wU2l6ZSAtIDEpIHtcbiAgICAgIHRoaXMuaG9wQ291bnRlciA9IDA7XG4gICAgICB0aGlzLnByb2Nlc3NGcmFtZSh0aGlzLmlucHV0QnVmZmVyLCB0aGlzLmJ1ZmZlckluZGV4KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhvcENvdW50ZXIrKztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZXN1bHRzO1xuICB9XG5cbiAgLy8gY29tcHV0ZSBtYWduaXR1ZGUsIHplcm8gY3Jvc3NpbmcgcmF0ZSwgYW5kIHBlcmlvZGljaXR5XG4gIHByb2Nlc3NGcmFtZShmcmFtZSwgb2Zmc2V0ID0gMCkge1xuICAgIHRoaXMuaW5wdXRGcmFtZSA9IGZyYW1lO1xuXG4gICAgdGhpcy5fbWFpbkFsZ29yaXRobSgpO1xuXG4gICAgLy8gVE9ETzogaW1wcm92ZSB0aGlzICgyLjAgaXMgZW1waXJpY2FsIGZhY3RvciBiZWNhdXNlIHdlIGRvbid0IGtub3cgYSBwcmlvcmkgc2Vuc29yIHJhbmdlKVxuICAgIHRoaXMuYW1wbGl0dWRlID0gdGhpcy5zdGREZXYgKiAyLjA7XG5cbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmNyb3NzaW5ncy5sZW5ndGgpO1xuICAgIC8vIG5vdCB1c2VkIGFueW1vcmUgKHJlbW92ZSA/KVxuICAgIC8vIHRoaXMuZnJlcXVlbmN5ID0gTWF0aC5zcXJ0KHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCAqIDIuMCAvIHRoaXMuaW5wdXRGcmFtZS5sZW5ndGgpOyAvLyBzcXJ0J2VkIG5vcm1hbGl6ZWQgYnkgbnlxdWlzdCBmcmVxXG5cbiAgICAvLyB0aGlzIG9uZSBpcyB3b3JraW5nIHd0aCBvbmUgZGlyZWN0aW9uIGNyb3NzaW5ncyBkZXRlY3Rpb24gdmVyc2lvblxuICAgIC8vIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5jcm9zc2luZ3MubGVuZ3RoICogMi4wIC8gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDsgLy8gbm9ybWFsaXplZCBieSBueXF1aXN0IGZyZXFcblxuICAgIC8vIHRoaXMgb25lIGlzIHdvcmtpbmcgd2l0aCB0d28gZGlyZWN0aW9uIGNyb3NzaW5ncyBkZXRlY3Rpb24gdmVyc2lvblxuICAgIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5jcm9zc2luZ3MubGVuZ3RoIC8gKHRoaXMuaW5wdXRGcmFtZS5sZW5ndGggLSAxKTsgLy8gYmV3YXJlIG9mIGRpdmlzaW9uIGJ5IHplcm9cbiAgICAvLyBpZiBzYW1wbGVSYXRlIGlzIHNwZWNpZmllZCwgdHJhbnNsYXRlIG5vcm1hbGl6ZWQgZnJlcXVlbmN5IHRvIEhlcnR6IDpcbiAgICBpZiAodGhpcy5zYW1wbGVSYXRlKSB7XG4gICAgICB0aGlzLmZyZXF1ZW5jeSAqPSBNYXRoLmZsb28odGhpcy5zYW1wbGVSYXRlIC8gMik7XG4gICAgfVxuICAgIFxuICAgIGlmICh0aGlzLmNyb3NzaW5ncy5sZW5ndGggPiAyKSB7XG4gICAgICAvL2xldCBjbGlwID0gdGhpcy5wZXJpb2RTdGREZXYgKiA1IC8gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDtcbiAgICAgIC8vY2xpcCA9IE1hdGgubWluKGNsaXAsIDEuKTtcbiAgICAgIC8vdGhpcy5wZXJpb2RpY2l0eSA9IDEuMCAtIE1hdGguc3FydChjbGlwKTtcblxuICAgICAgLy8gcGVyaW9kaWNpdHkgaXMgbm9ybWFsaXplZCBiYXNlZCBvbiBpbnB1dCBmcmFtZSBzaXplLlxuICAgICAgdGhpcy5wZXJpb2RpY2l0eSA9IDEuMCAtIE1hdGguc3FydCh0aGlzLnBlcmlvZFN0ZERldiAvIHRoaXMuaW5wdXRGcmFtZS5sZW5ndGgpO1xuICAgICAgLy90aGlzLnBlcmlvZGljaXR5ID0gMS4wIC0gTWF0aC5wb3codGhpcy5wZXJpb2RTdGREZXYgLyB0aGlzLmlucHV0RnJhbWUubGVuZ3RoLCAwLjcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBlcmlvZGljaXR5ID0gMDtcbiAgICB9XG5cbiAgICB0aGlzLnJlc3VsdHMuYW1wbGl0dWRlID0gdGhpcy5hbXBsaXR1ZGU7XG4gICAgdGhpcy5yZXN1bHRzLmZyZXF1ZW5jeSA9IHRoaXMuZnJlcXVlbmN5O1xuICAgIHRoaXMucmVzdWx0cy5wZXJpb2RpY2l0eSA9IHRoaXMucGVyaW9kaWNpdHk7XG5cbiAgICByZXR1cm4gdGhpcy5yZXN1bHRzO1xuICB9XG5cbiAgX21haW5BbGdvcml0aG0oKSB7XG5cbiAgICAvLyBjb21wdXRlIG1pbiwgbWF4LCBtZWFuIGFuZCBtYWduaXR1ZGVcbiAgICBsZXQgbWluLCBtYXg7XG4gICAgbWluID0gbWF4ID0gdGhpcy5pbnB1dEZyYW1lWzBdO1xuICAgIHRoaXMubWVhbiA9IDA7XG4gICAgdGhpcy5tYWduaXR1ZGUgPSAwO1xuICAgIGZvciAobGV0IGkgaW4gdGhpcy5pbnB1dEZyYW1lKSB7XG4gICAgICBsZXQgdmFsID0gdGhpcy5pbnB1dEZyYW1lW2ldO1xuICAgICAgdGhpcy5tYWduaXR1ZGUgKz0gdmFsICogdmFsO1xuICAgICAgdGhpcy5tZWFuICs9IHZhbDtcblxuICAgICAgaWYgKHZhbCA+IG1heCkge1xuICAgICAgICBtYXggPSB2YWw7XG4gICAgICB9IGVsc2UgaWYgKHZhbCA8IG1pbikge1xuICAgICAgICBtaW4gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETyA6IG1vcmUgdGVzdHMgdG8gZGV0ZXJtaW5lIHdoaWNoIG1lYW4gKHRydWUgbWVhbiBvciAobWF4LW1pbikvMikgaXMgdGhlIGJlc3RcbiAgICAvL3RoaXMubWVhbiAvPSB0aGlzLmlucHV0RnJhbWUubGVuZ3RoO1xuICAgIHRoaXMubWVhbiA9IG1pbiArIChtYXggLSBtaW4pICogMC41O1xuXG4gICAgdGhpcy5tYWduaXR1ZGUgLz0gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDtcbiAgICB0aGlzLm1hZ25pdHVkZSA9IE1hdGguc3FydCh0aGlzLm1hZ25pdHVkZSk7XG5cbiAgICAvLyBjb21wdXRlIHNpZ25hbCBzdGREZXYgYW5kIG51bWJlciBvZiBtZWFuLWNyb3NzaW5nc1xuICAgIC8vIGRlc2NlbmRpbmcgbWVhbiBjcm9zc2luZyBpcyB1c2VkIGhlcmVcbiAgICAvLyBub3cgdXNpbmcgYXNjZW5kaW5nIEFORCBkZXNjZW5kaW5nIGZvciB0ZXN0IC4uLlxuICAgIHRoaXMuY3Jvc3NpbmdzID0gW107XG4gICAgdGhpcy5zdGREZXYgPSAwO1xuICAgIGxldCBwcmV2RGVsdGEgPSB0aGlzLmlucHV0RnJhbWVbMF0gLSB0aGlzLm1lYW47XG4gICAgLy9mb3IgKGxldCBpIGluIHRoaXMuaW5wdXRGcmFtZSkge1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGVsdGEgPSB0aGlzLmlucHV0RnJhbWVbaV0gLSB0aGlzLm1lYW47XG4gICAgICB0aGlzLnN0ZERldiArPSBkZWx0YSAqIGRlbHRhO1xuICAgICAgaWYgKHByZXZEZWx0YSA+IHRoaXMubm9pc2VUaHJlc2hvbGQgJiYgZGVsdGEgPCB0aGlzLm5vaXNlVGhyZXNob2xkKSB7XG4gICAgICAgIHRoaXMuY3Jvc3NpbmdzLnB1c2goaSk7XG4gICAgICB9IFxuICAgICAgZWxzZSBpZiAocHJldkRlbHRhIDwgdGhpcy5ub2lzZVRocmVzaG9sZCAmJiBkZWx0YSA+IHRoaXMubm9pc2VUaHJlc2hvbGQpIHtcbiAgICAgICAgdGhpcy5jcm9zc2luZ3MucHVzaChpKTtcbiAgICAgIH1cbiAgICAgIHByZXZEZWx0YSA9IGRlbHRhO1xuICAgIH1cbiAgICB0aGlzLnN0ZERldiAvPSAodGhpcy5pbnB1dEZyYW1lLmxlbmd0aCAtIDEpO1xuICAgIHRoaXMuc3RkRGV2ID0gTWF0aC5zcXJ0KHRoaXMuc3RkRGV2KTtcblxuICAgIC8vIGNvbXB1dGUgbWVhbiBvZiBkZWx0YS1UIGJldHdlZW4gY3Jvc3NpbmdzXG4gICAgdGhpcy5wZXJpb2RNZWFuID0gMDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMuY3Jvc3NpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnBlcmlvZE1lYW4gKz0gdGhpcy5jcm9zc2luZ3NbaV0gLSB0aGlzLmNyb3NzaW5nc1tpIC0gMV07XG4gICAgfVxuICAgIC8vIGlmIHdlIGhhdmUgYSBOYU4gaGVyZSB3ZSBkb24ndCBjYXJlIGFzIHdlIHdvbid0IHVzZSB0aGlzLnBlcmlvZE1lYW4gYmVsb3dcbiAgICB0aGlzLnBlcmlvZE1lYW4gLz0gKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCAtIDEpO1xuXG4gICAgLy8gY29tcHV0ZSBzdGREZXYgb2YgZGVsdGEtVCBiZXR3ZWVuIGNyb3NzaW5nc1xuICAgIHRoaXMucGVyaW9kU3RkRGV2ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMuY3Jvc3NpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGVsdGFQID0gKHRoaXMuY3Jvc3NpbmdzW2ldIC0gdGhpcy5jcm9zc2luZ3NbaSAtIDFdIC0gdGhpcy5wZXJpb2RNZWFuKVxuICAgICAgdGhpcy5wZXJpb2RTdGREZXYgKz0gZGVsdGFQICogZGVsdGFQO1xuICAgIH1cbiAgICBpZiAodGhpcy5jcm9zc2luZ3MubGVuZ3RoID4gMikge1xuICAgICAgdGhpcy5wZXJpb2RTdGREZXYgPSBNYXRoLnNxcnQodGhpcy5wZXJpb2RTdGREZXYgLyAodGhpcy5jcm9zc2luZ3MubGVuZ3RoIC0gMikpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNZWFuQ3Jvc3NpbmdSYXRlOyJdfQ==