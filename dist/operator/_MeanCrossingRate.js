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
  hopSize: 5
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmYXVsdHMiLCJub2lzZVRocmVzaG9sZCIsImZyYW1lU2l6ZSIsImhvcFNpemUiLCJNZWFuQ3Jvc3NpbmdSYXRlIiwib3B0aW9ucyIsIm1lYW4iLCJtYWduaXR1ZGUiLCJzdGREZXYiLCJjcm9zc2luZ3MiLCJwZXJpb2RNZWFuIiwicGVyaW9kU3RkRGV2IiwiaW5wdXRGcmFtZSIsInNldENvbmZpZyIsImNmZyIsImlucHV0QnVmZmVyIiwiQXJyYXkiLCJpIiwiaG9wQ291bnRlciIsImJ1ZmZlckluZGV4IiwicmVzdWx0cyIsImFtcGxpdHVkZSIsImZyZXF1ZW5jeSIsInBlcmlvZGljaXR5IiwidmFsdWUiLCJwcm9jZXNzRnJhbWUiLCJmcmFtZSIsIm9mZnNldCIsIl9tYWluQWxnb3JpdGhtIiwibGVuZ3RoIiwiTWF0aCIsInNxcnQiLCJtaW4iLCJtYXgiLCJ2YWwiLCJwcmV2RGVsdGEiLCJkZWx0YSIsInB1c2giLCJkZWx0YVAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBRUEsSUFBTUEsV0FBVztBQUNmQyxrQkFBZ0IsR0FERDtBQUVmO0FBQ0FDLGFBQVcsRUFISTtBQUlmQyxXQUFTO0FBSk0sQ0FBakI7O0lBT01DLGdCO0FBRUosOEJBQTBCO0FBQUEsUUFBZEMsT0FBYyx1RUFBSixFQUFJO0FBQUE7O0FBQ3hCLDBCQUFjQSxPQUFkLEVBQXVCTCxRQUF2Qjs7QUFFQSxTQUFLTSxJQUFMLEdBQVksQ0FBWjtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsQ0FBakI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsQ0FBZDtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxTQUFLQyxVQUFMLEdBQWtCLENBQWxCO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixDQUFwQjtBQUNBLFNBQUtDLFVBQUwsR0FBa0IsRUFBbEI7O0FBRUEsU0FBS0MsU0FBTCxDQUFlUixPQUFmOztBQUVBO0FBQ0Q7Ozs7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Q0Q7QUFDRCxXQUFLNUIsTUFBTCxJQUFnQixLQUFLSSxVQUFMLENBQWdCaUIsTUFBaEIsR0FBeUIsQ0FBekM7QUFDQSxXQUFLckIsTUFBTCxHQUFjc0IsS0FBS0MsSUFBTCxDQUFVLEtBQUt2QixNQUFmLENBQWQ7O0FBRUE7QUFDQSxXQUFLRSxVQUFMLEdBQWtCLENBQWxCO0FBQ0EsV0FBSyxJQUFJTyxNQUFJLENBQWIsRUFBZ0JBLE1BQUksS0FBS1IsU0FBTCxDQUFlb0IsTUFBbkMsRUFBMkNaLEtBQTNDLEVBQWdEO0FBQzlDLGFBQUtQLFVBQUwsSUFBbUIsS0FBS0QsU0FBTCxDQUFlUSxHQUFmLElBQW9CLEtBQUtSLFNBQUwsQ0FBZVEsTUFBSSxDQUFuQixDQUF2QztBQUNEO0FBQ0Q7QUFDQSxXQUFLUCxVQUFMLElBQW9CLEtBQUtELFNBQUwsQ0FBZW9CLE1BQWYsR0FBd0IsQ0FBNUM7O0FBRUE7QUFDQSxXQUFLbEIsWUFBTCxHQUFvQixDQUFwQjtBQUNBLFdBQUssSUFBSU0sTUFBSSxDQUFiLEVBQWdCQSxNQUFJLEtBQUtSLFNBQUwsQ0FBZW9CLE1BQW5DLEVBQTJDWixLQUEzQyxFQUFnRDtBQUM5QyxZQUFJcUIsU0FBVSxLQUFLN0IsU0FBTCxDQUFlUSxHQUFmLElBQW9CLEtBQUtSLFNBQUwsQ0FBZVEsTUFBSSxDQUFuQixDQUFwQixHQUE0QyxLQUFLUCxVQUEvRDtBQUNBLGFBQUtDLFlBQUwsSUFBcUIyQixTQUFTQSxNQUE5QjtBQUNEO0FBQ0QsVUFBSSxLQUFLN0IsU0FBTCxDQUFlb0IsTUFBZixHQUF3QixDQUE1QixFQUErQjtBQUM3QixhQUFLbEIsWUFBTCxHQUFvQm1CLEtBQUtDLElBQUwsQ0FBVSxLQUFLcEIsWUFBTCxJQUFxQixLQUFLRixTQUFMLENBQWVvQixNQUFmLEdBQXdCLENBQTdDLENBQVYsQ0FBcEI7QUFDRDtBQUNGOzs7OztrQkFHWXpCLGdCIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQHRvZG8gOiBhZGQgaW50ZWdyYXRlZCBidWZmZXIgaGVyZSBmb3Igb3B0aW1pemVkIHN0YXRpc3RpY3MgY29tcHV0aW5nICovXG5cbmNvbnN0IGRlZmF1bHRzID0ge1xuICBub2lzZVRocmVzaG9sZDogMC4xLFxuICAvLyB0aGlzIGlzIHVzZWQgb25seSB3aXRoIGludGVybmFsIGNpcmN1bGFyIGJ1ZmZlciAoZmVkIHNhbXBsZSBieSBzYW1wbGUpXG4gIGZyYW1lU2l6ZTogNTAsXG4gIGhvcFNpemU6IDVcbn07XG5cbmNsYXNzIE1lYW5Dcm9zc2luZ1JhdGUge1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIE9iamVjdC5hc3NpZ24ob3B0aW9ucywgZGVmYXVsdHMpO1xuXG4gICAgdGhpcy5tZWFuID0gMDtcbiAgICB0aGlzLm1hZ25pdHVkZSA9IDA7XG4gICAgdGhpcy5zdGREZXYgPSAwO1xuICAgIHRoaXMuY3Jvc3NpbmdzID0gW107XG4gICAgdGhpcy5wZXJpb2RNZWFuID0gMDtcbiAgICB0aGlzLnBlcmlvZFN0ZERldiA9IDA7XG4gICAgdGhpcy5pbnB1dEZyYW1lID0gW107XG5cbiAgICB0aGlzLnNldENvbmZpZyhvcHRpb25zKTtcblxuICAgIC8vdGhpcy5tYXhGcmVxID0gdGhpcy5pbnB1dFJhdGUgLyAwLjU7ICAgIFxuICB9XG5cbiAgc2V0Q29uZmlnKGNmZykge1xuICAgIGlmIChjZmcubm9pc2VUaHJlc2hvbGQpIHtcbiAgICAgIHRoaXMubm9pc2VUaHJlc2hvbGQgPSBjZmcubm9pc2VUaHJlc2hvbGQ7XG4gICAgfVxuXG4gICAgaWYgKGNmZy5mcmFtZVNpemUpIHtcbiAgICAgIHRoaXMuZnJhbWVTaXplID0gY2ZnLmZyYW1lU2l6ZTtcbiAgICB9XG5cbiAgICBpZiAoY2ZnLmhvcFNpemUpIHtcbiAgICAgIHRoaXMuaG9wU2l6ZSA9IGNmZy5ob3BTaXplO1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXRCdWZmZXIgPSBuZXcgQXJyYXkodGhpcy5mcmFtZVNpemUpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mcmFtZVNpemU7IGkrKykge1xuICAgICAgdGhpcy5pbnB1dEJ1ZmZlcltpXSA9IDA7XG4gICAgfVxuXG4gICAgdGhpcy5ob3BDb3VudGVyID0gMDtcbiAgICB0aGlzLmJ1ZmZlckluZGV4ID0gMDtcblxuICAgIHRoaXMucmVzdWx0cyA9IHtcbiAgICAgIGFtcGxpdHVkZTogMCxcbiAgICAgIGZyZXF1ZW5jeTogMCxcbiAgICAgIHBlcmlvZGljaXR5OiAwXG4gICAgfTtcbiAgfVxuXG4gIHByb2Nlc3ModmFsdWUpIHtcbiAgICAvLyB1cGRhdGUgaW50ZXJuYWwgY2lyY3VsYXIgYnVmZmVyXG4gICAgLy8gdGhlbiBjYWxsIHByb2Nlc3NGcmFtZSh0aGlzLmlucHV0QnVmZmVyKSBpZiBuZWVkZWRcbiAgICB0aGlzLmlucHV0QnVmZmVyW3RoaXMuYnVmZmVySW5kZXhdID0gdmFsdWU7XG4gICAgdGhpcy5idWZmZXJJbmRleCA9ICh0aGlzLmJ1ZmZlckluZGV4ICsgMSkgJSB0aGlzLmZyYW1lU2l6ZTtcblxuICAgIGlmICh0aGlzLmhvcENvdW50ZXIgPT09IHRoaXMuaG9wU2l6ZSAtIDEpIHtcbiAgICAgIHRoaXMuaG9wQ291bnRlciA9IDA7XG4gICAgICB0aGlzLnByb2Nlc3NGcmFtZSh0aGlzLmlucHV0QnVmZmVyLCB0aGlzLmJ1ZmZlckluZGV4KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhvcENvdW50ZXIrKztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZXN1bHRzO1xuICB9XG5cbiAgLy8gY29tcHV0ZSBtYWduaXR1ZGUsIHplcm8gY3Jvc3NpbmcgcmF0ZSwgYW5kIHBlcmlvZGljaXR5XG4gIHByb2Nlc3NGcmFtZShmcmFtZSwgb2Zmc2V0ID0gMCkge1xuICAgIHRoaXMuaW5wdXRGcmFtZSA9IGZyYW1lO1xuXG4gICAgdGhpcy5fbWFpbkFsZ29yaXRobSgpO1xuXG4gICAgLy8gVE9ETzogaW1wcm92ZSB0aGlzICgyLjAgaXMgZW1waXJpY2FsIGZhY3RvciBiZWNhdXNlIHdlIGRvbid0IGtub3cgYSBwcmlvcmkgc2Vuc29yIHJhbmdlKVxuICAgIHRoaXMuYW1wbGl0dWRlID0gdGhpcy5zdGREZXYgKiAyLjA7XG5cbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmNyb3NzaW5ncy5sZW5ndGgpO1xuICAgIC8vIG5vdCB1c2VkIGFueW1vcmUgKHJlbW92ZSA/KVxuICAgIC8vIHRoaXMuZnJlcXVlbmN5ID0gTWF0aC5zcXJ0KHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCAqIDIuMCAvIHRoaXMuaW5wdXRGcmFtZS5sZW5ndGgpOyAvLyBzcXJ0J2VkIG5vcm1hbGl6ZWQgYnkgbnlxdWlzdCBmcmVxXG5cbiAgICAvLyB0aGlzIG9uZSBpcyB3b3JraW5nIHd0aCBvbmUgZGlyZWN0aW9uIGNyb3NzaW5ncyBkZXRlY3Rpb24gdmVyc2lvblxuICAgIC8vIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5jcm9zc2luZ3MubGVuZ3RoICogMi4wIC8gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDsgLy8gbm9ybWFsaXplZCBieSBueXF1aXN0IGZyZXFcblxuICAgIC8vIHRoaXMgb25lIGlzIHdvcmtpbmcgd2l0aCB0d28gZGlyZWN0aW9uIGNyb3NzaW5ncyBkZXRlY3Rpb24gdmVyc2lvblxuICAgIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5jcm9zc2luZ3MubGVuZ3RoIC8gKHRoaXMuaW5wdXRGcmFtZS5sZW5ndGggLSAxKTsgLy8gYmV3YXJlIG9mIGRpdmlzaW9uIGJ5IHplcm9cbiAgICBcbiAgICBpZih0aGlzLmNyb3NzaW5ncy5sZW5ndGggPiAyKSB7XG4gICAgICAvL2xldCBjbGlwID0gdGhpcy5wZXJpb2RTdGREZXYgKiA1IC8gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDtcbiAgICAgIC8vY2xpcCA9IE1hdGgubWluKGNsaXAsIDEuKTtcbiAgICAgIC8vdGhpcy5wZXJpb2RpY2l0eSA9IDEuMCAtIE1hdGguc3FydChjbGlwKTtcblxuICAgICAgLy8gcGVyaW9kaWNpdHkgaXMgbm9ybWFsaXplZCBiYXNlZCBvbiBpbnB1dCBmcmFtZSBzaXplLlxuICAgICAgdGhpcy5wZXJpb2RpY2l0eSA9IDEuMCAtIE1hdGguc3FydCh0aGlzLnBlcmlvZFN0ZERldiAvIHRoaXMuaW5wdXRGcmFtZS5sZW5ndGgpO1xuICAgICAgLy90aGlzLnBlcmlvZGljaXR5ID0gMS4wIC0gTWF0aC5wb3codGhpcy5wZXJpb2RTdGREZXYgLyB0aGlzLmlucHV0RnJhbWUubGVuZ3RoLCAwLjcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBlcmlvZGljaXR5ID0gMDtcbiAgICB9XG5cbiAgICB0aGlzLnJlc3VsdHMuYW1wbGl0dWRlID0gdGhpcy5hbXBsaXR1ZGU7XG4gICAgdGhpcy5yZXN1bHRzLmZyZXF1ZW5jeSA9IHRoaXMuZnJlcXVlbmN5O1xuICAgIHRoaXMucmVzdWx0cy5wZXJpb2RpY2l0eSA9IHRoaXMucGVyaW9kaWNpdHk7XG5cbiAgICByZXR1cm4gdGhpcy5yZXN1bHRzO1xuICB9XG5cbiAgX21haW5BbGdvcml0aG0oKSB7XG5cbiAgICAvLyBjb21wdXRlIG1pbiwgbWF4LCBtZWFuIGFuZCBtYWduaXR1ZGVcbiAgICBsZXQgbWluLCBtYXg7XG4gICAgbWluID0gbWF4ID0gdGhpcy5pbnB1dEZyYW1lWzBdO1xuICAgIHRoaXMubWVhbiA9IDA7XG4gICAgdGhpcy5tYWduaXR1ZGUgPSAwO1xuICAgIGZvcihsZXQgaSBpbiB0aGlzLmlucHV0RnJhbWUpIHtcbiAgICAgIGxldCB2YWwgPSB0aGlzLmlucHV0RnJhbWVbaV07XG4gICAgICB0aGlzLm1hZ25pdHVkZSArPSB2YWwgKiB2YWw7XG4gICAgICB0aGlzLm1lYW4gKz0gdmFsO1xuICAgICAgaWYodmFsID4gbWF4KSB7XG4gICAgICAgIG1heCA9IHZhbDtcbiAgICAgIH0gZWxzZSBpZih2YWwgPCBtaW4pIHtcbiAgICAgICAgbWluID0gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE8gOiBtb3JlIHRlc3RzIHRvIGRldGVybWluZSB3aGljaCBtZWFuICh0cnVlIG1lYW4gb3IgKG1heC1taW4pLzIpIGlzIHRoZSBiZXN0XG4gICAgLy90aGlzLm1lYW4gLz0gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDtcbiAgICB0aGlzLm1lYW4gPSBtaW4gKyAobWF4IC0gbWluKSAqIDAuNTtcblxuICAgIHRoaXMubWFnbml0dWRlIC89IHRoaXMuaW5wdXRGcmFtZS5sZW5ndGg7XG4gICAgdGhpcy5tYWduaXR1ZGUgPSBNYXRoLnNxcnQodGhpcy5tYWduaXR1ZGUpO1xuXG4gICAgLy8gY29tcHV0ZSBzaWduYWwgc3RkRGV2IGFuZCBudW1iZXIgb2YgbWVhbi1jcm9zc2luZ3NcbiAgICAvLyBkZXNjZW5kaW5nIG1lYW4gY3Jvc3NpbmcgaXMgdXNlZCBoZXJlXG4gICAgLy8gbm93IHVzaW5nIGFzY2VuZGluZyBBTkQgZGVzY2VuZGluZyBmb3IgdGVzdCAuLi5cbiAgICB0aGlzLmNyb3NzaW5ncyA9IFtdO1xuICAgIHRoaXMuc3RkRGV2ID0gMDtcbiAgICBsZXQgcHJldkRlbHRhID0gdGhpcy5pbnB1dEZyYW1lWzBdIC0gdGhpcy5tZWFuO1xuICAgIC8vZm9yIChsZXQgaSBpbiB0aGlzLmlucHV0RnJhbWUpIHtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMuaW5wdXRGcmFtZS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGRlbHRhID0gdGhpcy5pbnB1dEZyYW1lW2ldIC0gdGhpcy5tZWFuO1xuICAgICAgdGhpcy5zdGREZXYgKz0gZGVsdGEgKiBkZWx0YTtcbiAgICAgIGlmIChwcmV2RGVsdGEgPiB0aGlzLm5vaXNlVGhyZXNob2xkICYmIGRlbHRhIDwgdGhpcy5ub2lzZVRocmVzaG9sZCkge1xuICAgICAgICB0aGlzLmNyb3NzaW5ncy5wdXNoKGkpO1xuICAgICAgfSBcbiAgICAgIGVsc2UgaWYgKHByZXZEZWx0YSA8IHRoaXMubm9pc2VUaHJlc2hvbGQgJiYgZGVsdGEgPiB0aGlzLm5vaXNlVGhyZXNob2xkKSB7XG4gICAgICAgIHRoaXMuY3Jvc3NpbmdzLnB1c2goaSk7XG4gICAgICB9XG4gICAgICBwcmV2RGVsdGEgPSBkZWx0YTtcbiAgICB9XG4gICAgdGhpcy5zdGREZXYgLz0gKHRoaXMuaW5wdXRGcmFtZS5sZW5ndGggLSAxKTtcbiAgICB0aGlzLnN0ZERldiA9IE1hdGguc3FydCh0aGlzLnN0ZERldik7XG5cbiAgICAvLyBjb21wdXRlIG1lYW4gb2YgZGVsdGEtVCBiZXR3ZWVuIGNyb3NzaW5nc1xuICAgIHRoaXMucGVyaW9kTWVhbiA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLmNyb3NzaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5wZXJpb2RNZWFuICs9IHRoaXMuY3Jvc3NpbmdzW2ldIC0gdGhpcy5jcm9zc2luZ3NbaSAtIDFdO1xuICAgIH1cbiAgICAvLyBpZiB3ZSBoYXZlIGEgTmFOIGhlcmUgd2UgZG9uJ3QgY2FyZSBhcyB3ZSB3b24ndCB1c2UgdGhpcy5wZXJpb2RNZWFuIGJlbG93XG4gICAgdGhpcy5wZXJpb2RNZWFuIC89ICh0aGlzLmNyb3NzaW5ncy5sZW5ndGggLSAxKTtcblxuICAgIC8vIGNvbXB1dGUgc3RkRGV2IG9mIGRlbHRhLVQgYmV0d2VlbiBjcm9zc2luZ3NcbiAgICB0aGlzLnBlcmlvZFN0ZERldiA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLmNyb3NzaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGRlbHRhUCA9ICh0aGlzLmNyb3NzaW5nc1tpXSAtIHRoaXMuY3Jvc3NpbmdzW2kgLSAxXSAtIHRoaXMucGVyaW9kTWVhbilcbiAgICAgIHRoaXMucGVyaW9kU3RkRGV2ICs9IGRlbHRhUCAqIGRlbHRhUDtcbiAgICB9XG4gICAgaWYgKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCA+IDIpIHtcbiAgICAgIHRoaXMucGVyaW9kU3RkRGV2ID0gTWF0aC5zcXJ0KHRoaXMucGVyaW9kU3RkRGV2IC8gKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCAtIDIpKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTWVhbkNyb3NzaW5nUmF0ZTsiXX0=