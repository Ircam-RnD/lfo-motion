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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmYXVsdHMiLCJub2lzZVRocmVzaG9sZCIsImZyYW1lU2l6ZSIsImhvcFNpemUiLCJzYW1wbGVSYXRlIiwiTWVhbkNyb3NzaW5nUmF0ZSIsIm9wdGlvbnMiLCJtZWFuIiwibWFnbml0dWRlIiwic3RkRGV2IiwiY3Jvc3NpbmdzIiwicGVyaW9kTWVhbiIsInBlcmlvZFN0ZERldiIsImlucHV0RnJhbWUiLCJzZXRDb25maWciLCJjZmciLCJpbnB1dEJ1ZmZlciIsIkFycmF5IiwiaSIsImhvcENvdW50ZXIiLCJidWZmZXJJbmRleCIsInJlc3VsdHMiLCJhbXBsaXR1ZGUiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSIsInZhbHVlIiwicHJvY2Vzc0ZyYW1lIiwiZnJhbWUiLCJvZmZzZXQiLCJfbWFpbkFsZ29yaXRobSIsImxlbmd0aCIsIk1hdGgiLCJmbG9vIiwic3FydCIsIm1pbiIsIm1heCIsInZhbCIsInByZXZEZWx0YSIsImRlbHRhIiwicHVzaCIsImRlbHRhUCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFNQSxXQUFXO0FBQ2ZDLGtCQUFnQixHQUREO0FBRWY7QUFDQUMsYUFBVyxFQUhJO0FBSWZDLFdBQVMsQ0FKTTtBQUtmQyxjQUFZO0FBTEcsQ0FBakI7O0lBUU1DLGdCO0FBRUosOEJBQTBCO0FBQUEsUUFBZEMsT0FBYyx1RUFBSixFQUFJO0FBQUE7O0FBQ3hCLDBCQUFjQSxPQUFkLEVBQXVCTixRQUF2Qjs7QUFFQSxTQUFLTyxJQUFMLEdBQVksQ0FBWjtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsQ0FBakI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsQ0FBZDtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxTQUFLQyxVQUFMLEdBQWtCLENBQWxCO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixDQUFwQjtBQUNBLFNBQUtDLFVBQUwsR0FBa0IsRUFBbEI7O0FBRUEsU0FBS0Ms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QixDQUE1QixFQUErQjtBQUM3QixhQUFLbEIsWUFBTCxHQUFvQm1CLEtBQUtFLElBQUwsQ0FBVSxLQUFLckIsWUFBTCxJQUFxQixLQUFLRixTQUFMLENBQWVvQixNQUFmLEdBQXdCLENBQTdDLENBQVYsQ0FBcEI7QUFDRDtBQUNGOzs7OztrQkFHWXpCLGdCIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBkZWZhdWx0cyA9IHtcbiAgbm9pc2VUaHJlc2hvbGQ6IDAuMSxcbiAgLy8gdGhpcyBpcyB1c2VkIG9ubHkgd2l0aCBpbnRlcm5hbCBjaXJjdWxhciBidWZmZXIgKGZlZCBzYW1wbGUgYnkgc2FtcGxlKVxuICBmcmFtZVNpemU6IDUwLFxuICBob3BTaXplOiA1LFxuICBzYW1wbGVSYXRlOiBudWxsLFxufTtcblxuY2xhc3MgTWVhbkNyb3NzaW5nUmF0ZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgT2JqZWN0LmFzc2lnbihvcHRpb25zLCBkZWZhdWx0cyk7XG5cbiAgICB0aGlzLm1lYW4gPSAwO1xuICAgIHRoaXMubWFnbml0dWRlID0gMDtcbiAgICB0aGlzLnN0ZERldiA9IDA7XG4gICAgdGhpcy5jcm9zc2luZ3MgPSBbXTtcbiAgICB0aGlzLnBlcmlvZE1lYW4gPSAwO1xuICAgIHRoaXMucGVyaW9kU3RkRGV2ID0gMDtcbiAgICB0aGlzLmlucHV0RnJhbWUgPSBbXTtcblxuICAgIHRoaXMuc2V0Q29uZmlnKG9wdGlvbnMpO1xuXG4gICAgLy90aGlzLm1heEZyZXEgPSB0aGlzLmlucHV0UmF0ZSAvIDAuNTsgICAgXG4gIH1cblxuICBzZXRDb25maWcoY2ZnKSB7XG4gICAgaWYgKGNmZy5ub2lzZVRocmVzaG9sZCkge1xuICAgICAgdGhpcy5ub2lzZVRocmVzaG9sZCA9IGNmZy5ub2lzZVRocmVzaG9sZDtcbiAgICB9XG5cbiAgICBpZiAoY2ZnLmZyYW1lU2l6ZSkge1xuICAgICAgdGhpcy5mcmFtZVNpemUgPSBjZmcuZnJhbWVTaXplO1xuICAgIH1cblxuICAgIGlmIChjZmcuaG9wU2l6ZSkge1xuICAgICAgdGhpcy5ob3BTaXplID0gY2ZnLmhvcFNpemU7XG4gICAgfVxuXG4gICAgaWYgKGNmZy5zYW1wbGVSYXRlKSB7XG4gICAgICB0aGlzLnNhbXBsZVJhdGUgPSBjZmcuc2FtcGxlUmF0ZTtcbiAgICAgIC8vIHRoaXMubWF4RnJlcSA9IHRoaXMuc2FtcGxlUmF0ZSAvIDI7XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEJ1ZmZlciA9IG5ldyBBcnJheSh0aGlzLmZyYW1lU2l6ZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZyYW1lU2l6ZTsgaSsrKSB7XG4gICAgICB0aGlzLmlucHV0QnVmZmVyW2ldID0gMDtcbiAgICB9XG5cbiAgICB0aGlzLmhvcENvdW50ZXIgPSAwO1xuICAgIHRoaXMuYnVmZmVySW5kZXggPSAwO1xuXG4gICAgdGhpcy5yZXN1bHRzID0ge1xuICAgICAgYW1wbGl0dWRlOiAwLFxuICAgICAgZnJlcXVlbmN5OiAwLFxuICAgICAgcGVyaW9kaWNpdHk6IDBcbiAgICB9O1xuICB9XG5cbiAgcHJvY2Vzcyh2YWx1ZSkge1xuICAgIC8vIHVwZGF0ZSBpbnRlcm5hbCBjaXJjdWxhciBidWZmZXJcbiAgICAvLyB0aGVuIGNhbGwgcHJvY2Vzc0ZyYW1lKHRoaXMuaW5wdXRCdWZmZXIpIGlmIG5lZWRlZFxuICAgIHRoaXMuaW5wdXRCdWZmZXJbdGhpcy5idWZmZXJJbmRleF0gPSB2YWx1ZTtcbiAgICB0aGlzLmJ1ZmZlckluZGV4ID0gKHRoaXMuYnVmZmVySW5kZXggKyAxKSAlIHRoaXMuZnJhbWVTaXplO1xuXG4gICAgaWYgKHRoaXMuaG9wQ291bnRlciA9PT0gdGhpcy5ob3BTaXplIC0gMSkge1xuICAgICAgdGhpcy5ob3BDb3VudGVyID0gMDtcbiAgICAgIHRoaXMucHJvY2Vzc0ZyYW1lKHRoaXMuaW5wdXRCdWZmZXIsIHRoaXMuYnVmZmVySW5kZXgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaG9wQ291bnRlcisrO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJlc3VsdHM7XG4gIH1cblxuICAvLyBjb21wdXRlIG1hZ25pdHVkZSwgemVybyBjcm9zc2luZyByYXRlLCBhbmQgcGVyaW9kaWNpdHlcbiAgcHJvY2Vzc0ZyYW1lKGZyYW1lLCBvZmZzZXQgPSAwKSB7XG4gICAgdGhpcy5pbnB1dEZyYW1lID0gZnJhbWU7XG5cbiAgICB0aGlzLl9tYWluQWxnb3JpdGhtKCk7XG5cbiAgICAvLyBUT0RPOiBpbXByb3ZlIHRoaXMgKDIuMCBpcyBlbXBpcmljYWwgZmFjdG9yIGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBhIHByaW9yaSBzZW5zb3IgcmFuZ2UpXG4gICAgdGhpcy5hbXBsaXR1ZGUgPSB0aGlzLnN0ZERldiAqIDIuMDtcblxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCk7XG4gICAgLy8gbm90IHVzZWQgYW55bW9yZSAocmVtb3ZlID8pXG4gICAgLy8gdGhpcy5mcmVxdWVuY3kgPSBNYXRoLnNxcnQodGhpcy5jcm9zc2luZ3MubGVuZ3RoICogMi4wIC8gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aCk7IC8vIHNxcnQnZWQgbm9ybWFsaXplZCBieSBueXF1aXN0IGZyZXFcblxuICAgIC8vIHRoaXMgb25lIGlzIHdvcmtpbmcgd3RoIG9uZSBkaXJlY3Rpb24gY3Jvc3NpbmdzIGRldGVjdGlvbiB2ZXJzaW9uXG4gICAgLy8gdGhpcy5mcmVxdWVuY3kgPSB0aGlzLmNyb3NzaW5ncy5sZW5ndGggKiAyLjAgLyB0aGlzLmlucHV0RnJhbWUubGVuZ3RoOyAvLyBub3JtYWxpemVkIGJ5IG55cXVpc3QgZnJlcVxuXG4gICAgLy8gdGhpcyBvbmUgaXMgd29ya2luZyB3aXRoIHR3byBkaXJlY3Rpb24gY3Jvc3NpbmdzIGRldGVjdGlvbiB2ZXJzaW9uXG4gICAgdGhpcy5mcmVxdWVuY3kgPSB0aGlzLmNyb3NzaW5ncy5sZW5ndGggLyAodGhpcy5pbnB1dEZyYW1lLmxlbmd0aCAtIDEpOyAvLyBiZXdhcmUgb2YgZGl2aXNpb24gYnkgemVyb1xuICAgIC8vIGlmIHNhbXBsZVJhdGUgaXMgc3BlY2lmaWVkLCB0cmFuc2xhdGUgbm9ybWFsaXplZCBmcmVxdWVuY3kgdG8gSGVydHogOlxuICAgIGlmICh0aGlzLnNhbXBsZVJhdGUpIHtcbiAgICAgIHRoaXMuZnJlcXVlbmN5ICo9IE1hdGguZmxvbyh0aGlzLnNhbXBsZVJhdGUgLyAyKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCA+IDIpIHtcbiAgICAgIC8vbGV0IGNsaXAgPSB0aGlzLnBlcmlvZFN0ZERldiAqIDUgLyB0aGlzLmlucHV0RnJhbWUubGVuZ3RoO1xuICAgICAgLy9jbGlwID0gTWF0aC5taW4oY2xpcCwgMS4pO1xuICAgICAgLy90aGlzLnBlcmlvZGljaXR5ID0gMS4wIC0gTWF0aC5zcXJ0KGNsaXApO1xuXG4gICAgICAvLyBwZXJpb2RpY2l0eSBpcyBub3JtYWxpemVkIGJhc2VkIG9uIGlucHV0IGZyYW1lIHNpemUuXG4gICAgICB0aGlzLnBlcmlvZGljaXR5ID0gMS4wIC0gTWF0aC5zcXJ0KHRoaXMucGVyaW9kU3RkRGV2IC8gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aCk7XG4gICAgICAvL3RoaXMucGVyaW9kaWNpdHkgPSAxLjAgLSBNYXRoLnBvdyh0aGlzLnBlcmlvZFN0ZERldiAvIHRoaXMuaW5wdXRGcmFtZS5sZW5ndGgsIDAuNyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGVyaW9kaWNpdHkgPSAwO1xuICAgIH1cblxuICAgIHRoaXMucmVzdWx0cy5hbXBsaXR1ZGUgPSB0aGlzLmFtcGxpdHVkZTtcbiAgICB0aGlzLnJlc3VsdHMuZnJlcXVlbmN5ID0gdGhpcy5mcmVxdWVuY3k7XG4gICAgdGhpcy5yZXN1bHRzLnBlcmlvZGljaXR5ID0gdGhpcy5wZXJpb2RpY2l0eTtcblxuICAgIHJldHVybiB0aGlzLnJlc3VsdHM7XG4gIH1cblxuICBfbWFpbkFsZ29yaXRobSgpIHtcblxuICAgIC8vIGNvbXB1dGUgbWluLCBtYXgsIG1lYW4gYW5kIG1hZ25pdHVkZVxuICAgIGxldCBtaW4sIG1heDtcbiAgICBtaW4gPSBtYXggPSB0aGlzLmlucHV0RnJhbWVbMF07XG4gICAgdGhpcy5tZWFuID0gMDtcbiAgICB0aGlzLm1hZ25pdHVkZSA9IDA7XG4gICAgZm9yIChsZXQgaSBpbiB0aGlzLmlucHV0RnJhbWUpIHtcbiAgICAgIGxldCB2YWwgPSB0aGlzLmlucHV0RnJhbWVbaV07XG4gICAgICB0aGlzLm1hZ25pdHVkZSArPSB2YWwgKiB2YWw7XG4gICAgICB0aGlzLm1lYW4gKz0gdmFsO1xuXG4gICAgICBpZiAodmFsID4gbWF4KSB7XG4gICAgICAgIG1heCA9IHZhbDtcbiAgICAgIH0gZWxzZSBpZiAodmFsIDwgbWluKSB7XG4gICAgICAgIG1pbiA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIDogbW9yZSB0ZXN0cyB0byBkZXRlcm1pbmUgd2hpY2ggbWVhbiAodHJ1ZSBtZWFuIG9yIChtYXgtbWluKS8yKSBpcyB0aGUgYmVzdFxuICAgIC8vdGhpcy5tZWFuIC89IHRoaXMuaW5wdXRGcmFtZS5sZW5ndGg7XG4gICAgdGhpcy5tZWFuID0gbWluICsgKG1heCAtIG1pbikgKiAwLjU7XG5cbiAgICB0aGlzLm1hZ25pdHVkZSAvPSB0aGlzLmlucHV0RnJhbWUubGVuZ3RoO1xuICAgIHRoaXMubWFnbml0dWRlID0gTWF0aC5zcXJ0KHRoaXMubWFnbml0dWRlKTtcblxuICAgIC8vIGNvbXB1dGUgc2lnbmFsIHN0ZERldiBhbmQgbnVtYmVyIG9mIG1lYW4tY3Jvc3NpbmdzXG4gICAgLy8gZGVzY2VuZGluZyBtZWFuIGNyb3NzaW5nIGlzIHVzZWQgaGVyZVxuICAgIC8vIG5vdyB1c2luZyBhc2NlbmRpbmcgQU5EIGRlc2NlbmRpbmcgZm9yIHRlc3QgLi4uXG4gICAgdGhpcy5jcm9zc2luZ3MgPSBbXTtcbiAgICB0aGlzLnN0ZERldiA9IDA7XG4gICAgbGV0IHByZXZEZWx0YSA9IHRoaXMuaW5wdXRGcmFtZVswXSAtIHRoaXMubWVhbjtcbiAgICAvL2ZvciAobGV0IGkgaW4gdGhpcy5pbnB1dEZyYW1lKSB7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLmlucHV0RnJhbWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBkZWx0YSA9IHRoaXMuaW5wdXRGcmFtZVtpXSAtIHRoaXMubWVhbjtcbiAgICAgIHRoaXMuc3RkRGV2ICs9IGRlbHRhICogZGVsdGE7XG4gICAgICBpZiAocHJldkRlbHRhID4gdGhpcy5ub2lzZVRocmVzaG9sZCAmJiBkZWx0YSA8IHRoaXMubm9pc2VUaHJlc2hvbGQpIHtcbiAgICAgICAgdGhpcy5jcm9zc2luZ3MucHVzaChpKTtcbiAgICAgIH0gXG4gICAgICBlbHNlIGlmIChwcmV2RGVsdGEgPCB0aGlzLm5vaXNlVGhyZXNob2xkICYmIGRlbHRhID4gdGhpcy5ub2lzZVRocmVzaG9sZCkge1xuICAgICAgICB0aGlzLmNyb3NzaW5ncy5wdXNoKGkpO1xuICAgICAgfVxuICAgICAgcHJldkRlbHRhID0gZGVsdGE7XG4gICAgfVxuICAgIHRoaXMuc3RkRGV2IC89ICh0aGlzLmlucHV0RnJhbWUubGVuZ3RoIC0gMSk7XG4gICAgdGhpcy5zdGREZXYgPSBNYXRoLnNxcnQodGhpcy5zdGREZXYpO1xuXG4gICAgLy8gY29tcHV0ZSBtZWFuIG9mIGRlbHRhLVQgYmV0d2VlbiBjcm9zc2luZ3NcbiAgICB0aGlzLnBlcmlvZE1lYW4gPSAwO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5jcm9zc2luZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucGVyaW9kTWVhbiArPSB0aGlzLmNyb3NzaW5nc1tpXSAtIHRoaXMuY3Jvc3NpbmdzW2kgLSAxXTtcbiAgICB9XG4gICAgLy8gaWYgd2UgaGF2ZSBhIE5hTiBoZXJlIHdlIGRvbid0IGNhcmUgYXMgd2Ugd29uJ3QgdXNlIHRoaXMucGVyaW9kTWVhbiBiZWxvd1xuICAgIHRoaXMucGVyaW9kTWVhbiAvPSAodGhpcy5jcm9zc2luZ3MubGVuZ3RoIC0gMSk7XG5cbiAgICAvLyBjb21wdXRlIHN0ZERldiBvZiBkZWx0YS1UIGJldHdlZW4gY3Jvc3NpbmdzXG4gICAgdGhpcy5wZXJpb2RTdGREZXYgPSAwO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5jcm9zc2luZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBkZWx0YVAgPSAodGhpcy5jcm9zc2luZ3NbaV0gLSB0aGlzLmNyb3NzaW5nc1tpIC0gMV0gLSB0aGlzLnBlcmlvZE1lYW4pXG4gICAgICB0aGlzLnBlcmlvZFN0ZERldiArPSBkZWx0YVAgKiBkZWx0YVA7XG4gICAgfVxuICAgIGlmICh0aGlzLmNyb3NzaW5ncy5sZW5ndGggPiAyKSB7XG4gICAgICB0aGlzLnBlcmlvZFN0ZERldiA9IE1hdGguc3FydCh0aGlzLnBlcmlvZFN0ZERldiAvICh0aGlzLmNyb3NzaW5ncy5sZW5ndGggLSAyKSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1lYW5Dcm9zc2luZ1JhdGU7Il19