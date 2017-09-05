'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _core = require('waves-lfo/core');

var lfo = _interopRequireWildcard(_core);

var _ticker = require('@ircam/ticker');

var _ticker2 = _interopRequireDefault(_ticker);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Array.prototype.fill = function (val) {
  for (var i = 0; i < this.length; i++) {
    this[i] = val;
  }
};

var parameters = {
  frameRate: {
    type: 'integer',
    min: 0.015,
    max: +Infinity,
    default: 0.05,
    constant: true,
    metas: {
      unit: 's'
    }
  }
};

/**
 * Module that resample an incomming vector frame at a given framerate.
 * If 0 frame has been received since last tick, output last values.
 * If more than 1 frame since last tick, output the mean of all the frames.
 *
 * @todo - add option for output type (i.e. mean, max, min, last, median, etc.)
 *
 * @param {Object} options - override default parameters
 * @param {Number} [options.frameRate=20] - output sampling rate (in Hz)
 */

var Sampler = function (_lfo$BaseLfo) {
  (0, _inherits3.default)(Sampler, _lfo$BaseLfo);

  function Sampler() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Sampler);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Sampler.__proto__ || (0, _getPrototypeOf2.default)(Sampler)).call(this, parameters, options));

    _this.ticker = null;
    _this.buffer = null;
    _this.bufferIndex = 0;

    _this.propagateFrame = _this.propagateFrame.bind(_this);
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(Sampler, [{
    key: 'processStreamParams',
    value: function processStreamParams(prevStreamParams) {
      this.prepareStreamParams(prevStreamParams);

      var frameRate = this.params.get('frameRate'); // period is in ms

      this.streamParams.frameRate = frameRate;

      // build buffer
      var frameSize = this.streamParams.frameSize;
      var sourceFrameRate = prevStreamParams.frameRate;

      if (sourceFrameRate <= 0) sourceFrameRate = 10; // arbitrary value hoping that we won't loose data

      // max number of source frames to store
      var bufferSize = Math.ceil(sourceFrameRate / frameRate);

      this.maxBufferIndex = bufferSize;
      this.buffer = new Float32Array(bufferSize * frameSize);
      this.sums = new Float32Array(frameSize);

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'finalizeStream',
    value: function finalizeStream(endTime) {
      // @todo - output current data, compute proper endTime
      (0, _get3.default)(Sampler.prototype.__proto__ || (0, _getPrototypeOf2.default)(Sampler.prototype), 'finalizeStream', this).call(this, endTime);
      this.ticker.stop();
      this.ticker = null;
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      if (this.bufferIndex < this.maxBufferIndex) {
        var data = frame.data;
        var frameSize = this.streamParams.frameSize;

        for (var i = 0; i < frameSize; i++) {
          this.buffer[this.bufferIndex * frameSize + i] = data[i];
        }this.bufferIndex += 1;
      }
    }

    /** @private */

  }, {
    key: 'processScalar',
    value: function processScalar(value) {
      if (this.bufferIndex < this.maxBufferIndex) {
        var data = frame.data;
        var frameSize = this.streamParams.frameSize;

        this.buffer[this.bufferIndex * frameSize] = data[0];
        this.bufferIndex += 1;
      }
    }

    /** @private */

  }, {
    key: 'processFrame',
    value: function processFrame(frame) {
      this.prepareFrame();

      this.frame.metadata = frame.metadata;

      this.processFunction(frame);

      if (this.ticker === null) {
        var period = 1000 / this.params.get('frameRate'); // in ms
        this.ticker = new _ticker2.default(period, this.propagateFrame);
        this.ticker.start();
      }
    }

    /** @private */

  }, {
    key: 'propagateFrame',
    value: function propagateFrame(logicalTime) {
      this.frame.time = logicalTime / 1000;

      if (this.bufferIndex > 0) this._computeFrameData();

      (0, _get3.default)(Sampler.prototype.__proto__ || (0, _getPrototypeOf2.default)(Sampler.prototype), 'propagateFrame', this).call(this);
    }

    /** @private */

  }, {
    key: '_computeFrameData',
    value: function _computeFrameData() {
      var numFrames = this.bufferIndex;
      var frameSize = this.streamParams.frameSize;
      var buffer = this.buffer;
      var data = this.frame.data;

      // get means for each vector index
      var sums = this.sums;
      sums.fill(0);

      for (var frameIndex = 0; frameIndex < numFrames; frameIndex++) {
        for (var i = 0; i < frameSize; i++) {
          sums[i] += buffer[frameSize * frameIndex + i];
        }
      }

      for (var _i = 0; _i < frameSize; _i++) {
        data[_i] = sums[_i] / numFrames;
      }this.bufferIndex = 0;
    }
  }]);
  return Sampler;
}(lfo.BaseLfo);

exports.default = Sampler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJmaWxsIiwidmFsIiwiaSIsImxlbmd0aCIsInBhcmFtZXRlcnMiLCJmcmFtZVJhdGUiLCJ0eXBlIiwibWluIiwibWF4IiwiSW5maW5pdHkiLCJkZWZhdWx0IiwiY29uc3RhbnQiLCJtZXRhcyIsInVuaXQiLCJTYW1wbGVyIiwib3B0aW9ucyIsInRpY2tlciIsImJ1ZmZlciIsImJ1ZmZlckluZGV4IiwicHJvcGFnYXRlRnJhbWUiLCJiaW5kIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJwYXJhbXMiLCJnZXQiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVNpemUiLCJzb3VyY2VGcmFtZVJhdGUiLCJidWZmZXJTaXplIiwiTWF0aCIsImNlaWwiLCJtYXhCdWZmZXJJbmRleCIsIkZsb2F0MzJBcnJheSIsInN1bXMiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJlbmRUaW1lIiwic3RvcCIsImZyYW1lIiwiZGF0YSIsInZhbHVlIiwicHJlcGFyZUZyYW1lIiwibWV0YWRhdGEiLCJwcm9jZXNzRnVuY3Rpb24iLCJwZXJpb2QiLCJzdGFydCIsImxvZ2ljYWxUaW1lIiwidGltZSIsIl9jb21wdXRlRnJhbWVEYXRhIiwibnVtRnJhbWVzIiwiZnJhbWVJbmRleCIsIkJhc2VMZm8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOztBQUNaOzs7Ozs7OztBQUVBQyxNQUFNQyxTQUFOLENBQWdCQyxJQUFoQixHQUF1QixVQUFTQyxHQUFULEVBQWM7QUFDbkMsT0FBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS0MsTUFBekIsRUFBaUNELEdBQWpDLEVBQXNDO0FBQ3BDLFNBQUtBLENBQUwsSUFBVUQsR0FBVjtBQUNEO0FBQ0YsQ0FKRDs7QUFNQSxJQUFNRyxhQUFhO0FBQ2pCQyxhQUFXO0FBQ1RDLFVBQU0sU0FERztBQUVUQyxTQUFLLEtBRkk7QUFHVEMsU0FBSyxDQUFDQyxRQUhHO0FBSVRDLGFBQVMsSUFKQTtBQUtUQyxjQUFVLElBTEQ7QUFNVEMsV0FBTztBQUNMQyxZQUFNO0FBREQ7QUFORTtBQURNLENBQW5COztBQWFBOzs7Ozs7Ozs7OztJQVVNQyxPOzs7QUFDSixxQkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFBQSx3SUFDbEJYLFVBRGtCLEVBQ05XLE9BRE07O0FBR3hCLFVBQUtDLE1BQUwsR0FBYyxJQUFkO0FBQ0EsVUFBS0MsTUFBTCxHQUFjLElBQWQ7QUFDQSxVQUFLQyxXQUFMLEdBQW1CLENBQW5COztBQUVBLFVBQUtDLGNBQUwsR0FBc0IsTUFBS0EsY0FBTCxDQUFvQkMsSUFBcEIsT0FBdEI7QUFQd0I7QUFRekI7O0FBRUQ7Ozs7O3dDQUNvQkMsZ0IsRUFBa0I7QUFDcEMsV0FBS0MsbUJBQUwsQ0FBeUJELGdCQUF6Qjs7QUFFQSxVQUFNaEIsWUFBWSxLQUFLa0IsTUFBTCxDQUFZQyxHQUFaLENBQWdCLFdBQWhCLENBQWxCLENBSG9DLENBR1k7O0FBRWhELFdBQUtDLFlBQUwsQ0FBa0JwQixTQUFsQixHQUE4QkEsU0FBOUI7O0FBRUE7QUFDQSxVQUFNcUIsWUFBWSxLQUFLRCxZQUFMLENBQWtCQyxTQUFwQztBQUNBLFVBQUlDLGtCQUFrQk4saUJBQWlCaEIsU0FBdkM7O0FBRUEsVUFBSXNCLG1CQUFtQixDQUF2QixFQUNFQSxrQkFBa0IsRUFBbEIsQ0Faa0MsQ0FZWjs7QUFFeEI7QUFDQSxVQUFNQyxhQUFhQyxLQUFLQyxJQUFMLENBQVVILGtCQUFrQnRCLFNBQTVCLENBQW5COztBQUVBLFdBQUswQixjQUFMLEdBQXNCSCxVQUF0QjtBQUNBLFdBQUtYLE1BQUwsR0FBYyxJQUFJZSxZQUFKLENBQWlCSixhQUFhRixTQUE5QixDQUFkO0FBQ0EsV0FBS08sSUFBTCxHQUFZLElBQUlELFlBQUosQ0FBaUJOLFNBQWpCLENBQVo7O0FBRUEsV0FBS1EscUJBQUw7QUFDRDs7QUFFRDs7OzttQ0FDZUMsTyxFQUFTO0FBQ3RCO0FBQ0EsNklBQXFCQSxPQUFyQjtBQUNBLFdBQUtuQixNQUFMLENBQVlvQixJQUFaO0FBQ0EsV0FBS3BCLE1BQUwsR0FBYyxJQUFkO0FBQ0Q7O0FBRUQ7Ozs7a0NBQ2NxQixLLEVBQU87QUFDbkIsVUFBSSxLQUFLbkIsV0FBTCxHQUFtQixLQUFLYSxjQUE1QixFQUE0QztBQUMxQyxZQUFNTyxPQUFPRCxNQUFNQyxJQUFuQjtBQUNBLFlBQU1aLFlBQVksS0FBS0QsWUFBTCxDQUFrQkMsU0FBcEM7O0FBRUEsYUFBSyxJQUFJeEIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJd0IsU0FBcEIsRUFBK0J4QixHQUEvQjtBQUNFLGVBQUtlLE1BQUwsQ0FBWSxLQUFLQyxXQUFMLEdBQW1CUSxTQUFuQixHQUErQnhCLENBQTNDLElBQWdEb0MsS0FBS3BDLENBQUwsQ0FBaEQ7QUFERixTQUdBLEtBQUtnQixXQUFMLElBQW9CLENBQXBCO0FBQ0Q7QUFDRjs7QUFFRDs7OztrQ0FDY3FCLEssRUFBTztBQUNuQixVQUFJLEtBQUtyQixXQUFMLEdBQW1CLEtBQUthLGNBQTVCLEVBQTRDO0FBQzFDLFlBQU1PLE9BQU9ELE1BQU1DLElBQW5CO0FBQ0EsWUFBTVosWUFBWSxLQUFLRCxZQUFMLENBQWtCQyxTQUFwQzs7QUFFQSxhQUFLVCxNQUFMLENBQVksS0FBS0MsV0FBTCxHQUFtQlEsU0FBL0IsSUFBNENZLEtBQUssQ0FBTCxDQUE1QztBQUNBLGFBQUtwQixXQUFMLElBQW9CLENBQXBCO0FBQ0Q7QUFDRjs7QUFFRDs7OztpQ0FDYW1CLEssRUFBTztBQUNsQixXQUFLRyxZQUFMOztBQUVBLFdBQUtILEtBQUwsQ0FBV0ksUUFBWCxHQUFzQkosTUFBTUksUUFBNUI7O0FBRUEsV0FBS0MsZUFBTCxDQUFxQkwsS0FBckI7O0FBRUEsVUFBSSxLQUFLckIsTUFBTCxLQUFnQixJQUFwQixFQUEwQjtBQUN4QixZQUFNMkIsU0FBUyxPQUFPLEtBQUtwQixNQUFMLENBQVlDLEdBQVosQ0FBZ0IsV0FBaEIsQ0FBdEIsQ0FEd0IsQ0FDNEI7QUFDcEQsYUFBS1IsTUFBTCxHQUFjLHFCQUFXMkIsTUFBWCxFQUFtQixLQUFLeEIsY0FBeEIsQ0FBZDtBQUNBLGFBQUtILE1BQUwsQ0FBWTRCLEtBQVo7QUFDRDtBQUNGOztBQUVEOzs7O21DQUNlQyxXLEVBQWE7QUFDMUIsV0FBS1IsS0FBTCxDQUFXUyxJQUFYLEdBQWtCRCxjQUFjLElBQWhDOztBQUVBLFVBQUksS0FBSzNCLFdBQUwsR0FBbUIsQ0FBdkIsRUFDRSxLQUFLNkIsaUJBQUw7O0FBRUY7QUFDRDs7QUFFRDs7Ozt3Q0FDb0I7QUFDbEIsVUFBTUMsWUFBWSxLQUFLOUIsV0FBdkI7QUFDQSxVQUFNUSxZQUFZLEtBQUtELFlBQUwsQ0FBa0JDLFNBQXBDO0FBQ0EsVUFBTVQsU0FBUyxLQUFLQSxNQUFwQjtBQUNBLFVBQU1xQixPQUFPLEtBQUtELEtBQUwsQ0FBV0MsSUFBeEI7O0FBRUE7QUFDQSxVQUFNTCxPQUFPLEtBQUtBLElBQWxCO0FBQ0FBLFdBQUtqQyxJQUFMLENBQVUsQ0FBVjs7QUFFQSxXQUFLLElBQUlpRCxhQUFhLENBQXRCLEVBQXlCQSxhQUFhRCxTQUF0QyxFQUFpREMsWUFBakQsRUFBK0Q7QUFDN0QsYUFBSyxJQUFJL0MsSUFBSSxDQUFiLEVBQWdCQSxJQUFJd0IsU0FBcEIsRUFBK0J4QixHQUEvQjtBQUNFK0IsZUFBSy9CLENBQUwsS0FBV2UsT0FBT1MsWUFBWXVCLFVBQVosR0FBeUIvQyxDQUFoQyxDQUFYO0FBREY7QUFFRDs7QUFFRCxXQUFLLElBQUlBLEtBQUksQ0FBYixFQUFnQkEsS0FBSXdCLFNBQXBCLEVBQStCeEIsSUFBL0I7QUFDRW9DLGFBQUtwQyxFQUFMLElBQVUrQixLQUFLL0IsRUFBTCxJQUFVOEMsU0FBcEI7QUFERixPQUdBLEtBQUs5QixXQUFMLEdBQW1CLENBQW5CO0FBQ0Q7OztFQWpIbUJyQixJQUFJcUQsTzs7a0JBb0hYcEMsTyIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmby9jb3JlJztcbmltcG9ydCBUaWNrZXIgZnJvbSAnQGlyY2FtL3RpY2tlcic7XG5cbkFycmF5LnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24odmFsKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXNbaV0gPSB2YWw7XG4gIH1cbn1cblxuY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgZnJhbWVSYXRlOiB7XG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIG1pbjogMC4wMTUsXG4gICAgbWF4OiArSW5maW5pdHksXG4gICAgZGVmYXVsdDogMC4wNSxcbiAgICBjb25zdGFudDogdHJ1ZSxcbiAgICBtZXRhczoge1xuICAgICAgdW5pdDogJ3MnLFxuICAgIH0sXG4gIH0sXG59O1xuXG4vKipcbiAqIE1vZHVsZSB0aGF0IHJlc2FtcGxlIGFuIGluY29tbWluZyB2ZWN0b3IgZnJhbWUgYXQgYSBnaXZlbiBmcmFtZXJhdGUuXG4gKiBJZiAwIGZyYW1lIGhhcyBiZWVuIHJlY2VpdmVkIHNpbmNlIGxhc3QgdGljaywgb3V0cHV0IGxhc3QgdmFsdWVzLlxuICogSWYgbW9yZSB0aGFuIDEgZnJhbWUgc2luY2UgbGFzdCB0aWNrLCBvdXRwdXQgdGhlIG1lYW4gb2YgYWxsIHRoZSBmcmFtZXMuXG4gKlxuICogQHRvZG8gLSBhZGQgb3B0aW9uIGZvciBvdXRwdXQgdHlwZSAoaS5lLiBtZWFuLCBtYXgsIG1pbiwgbGFzdCwgbWVkaWFuLCBldGMuKVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gb3ZlcnJpZGUgZGVmYXVsdCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZnJhbWVSYXRlPTIwXSAtIG91dHB1dCBzYW1wbGluZyByYXRlIChpbiBIeilcbiAqL1xuY2xhc3MgU2FtcGxlciBleHRlbmRzIGxmby5CYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLnRpY2tlciA9IG51bGw7XG4gICAgdGhpcy5idWZmZXIgPSBudWxsO1xuICAgIHRoaXMuYnVmZmVySW5kZXggPSAwO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVGcmFtZSA9IHRoaXMucHJvcGFnYXRlRnJhbWUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICBjb25zdCBmcmFtZVJhdGUgPSB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lUmF0ZScpOyAvLyBwZXJpb2QgaXMgaW4gbXNcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSA9IGZyYW1lUmF0ZTtcblxuICAgIC8vIGJ1aWxkIGJ1ZmZlclxuICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcbiAgICBsZXQgc291cmNlRnJhbWVSYXRlID0gcHJldlN0cmVhbVBhcmFtcy5mcmFtZVJhdGU7XG5cbiAgICBpZiAoc291cmNlRnJhbWVSYXRlIDw9IDApXG4gICAgICBzb3VyY2VGcmFtZVJhdGUgPSAxMDsgLy8gYXJiaXRyYXJ5IHZhbHVlIGhvcGluZyB0aGF0IHdlIHdvbid0IGxvb3NlIGRhdGFcblxuICAgIC8vIG1heCBudW1iZXIgb2Ygc291cmNlIGZyYW1lcyB0byBzdG9yZVxuICAgIGNvbnN0IGJ1ZmZlclNpemUgPSBNYXRoLmNlaWwoc291cmNlRnJhbWVSYXRlIC8gZnJhbWVSYXRlKTtcblxuICAgIHRoaXMubWF4QnVmZmVySW5kZXggPSBidWZmZXJTaXplO1xuICAgIHRoaXMuYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheShidWZmZXJTaXplICogZnJhbWVTaXplKTtcbiAgICB0aGlzLnN1bXMgPSBuZXcgRmxvYXQzMkFycmF5KGZyYW1lU2l6ZSk7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIGZpbmFsaXplU3RyZWFtKGVuZFRpbWUpIHtcbiAgICAvLyBAdG9kbyAtIG91dHB1dCBjdXJyZW50IGRhdGEsIGNvbXB1dGUgcHJvcGVyIGVuZFRpbWVcbiAgICBzdXBlci5maW5hbGl6ZVN0cmVhbShlbmRUaW1lKTtcbiAgICB0aGlzLnRpY2tlci5zdG9wKCk7XG4gICAgdGhpcy50aWNrZXIgPSBudWxsO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBpZiAodGhpcy5idWZmZXJJbmRleCA8IHRoaXMubWF4QnVmZmVySW5kZXgpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBmcmFtZS5kYXRhO1xuICAgICAgY29uc3QgZnJhbWVTaXplID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYW1lU2l6ZTsgaSsrKVxuICAgICAgICB0aGlzLmJ1ZmZlclt0aGlzLmJ1ZmZlckluZGV4ICogZnJhbWVTaXplICsgaV0gPSBkYXRhW2ldO1xuXG4gICAgICB0aGlzLmJ1ZmZlckluZGV4ICs9IDE7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTY2FsYXIodmFsdWUpIHtcbiAgICBpZiAodGhpcy5idWZmZXJJbmRleCA8IHRoaXMubWF4QnVmZmVySW5kZXgpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBmcmFtZS5kYXRhO1xuICAgICAgY29uc3QgZnJhbWVTaXplID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuXG4gICAgICB0aGlzLmJ1ZmZlclt0aGlzLmJ1ZmZlckluZGV4ICogZnJhbWVTaXplXSA9IGRhdGFbMF07XG4gICAgICB0aGlzLmJ1ZmZlckluZGV4ICs9IDE7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NGcmFtZShmcmFtZSkge1xuICAgIHRoaXMucHJlcGFyZUZyYW1lKCk7XG5cbiAgICB0aGlzLmZyYW1lLm1ldGFkYXRhID0gZnJhbWUubWV0YWRhdGE7XG5cbiAgICB0aGlzLnByb2Nlc3NGdW5jdGlvbihmcmFtZSk7XG5cbiAgICBpZiAodGhpcy50aWNrZXIgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHBlcmlvZCA9IDEwMDAgLyB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lUmF0ZScpOyAvLyBpbiBtc1xuICAgICAgdGhpcy50aWNrZXIgPSBuZXcgVGlja2VyKHBlcmlvZCwgdGhpcy5wcm9wYWdhdGVGcmFtZSk7XG4gICAgICB0aGlzLnRpY2tlci5zdGFydCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9wYWdhdGVGcmFtZShsb2dpY2FsVGltZSkge1xuICAgIHRoaXMuZnJhbWUudGltZSA9IGxvZ2ljYWxUaW1lIC8gMTAwMDtcblxuICAgIGlmICh0aGlzLmJ1ZmZlckluZGV4ID4gMClcbiAgICAgIHRoaXMuX2NvbXB1dGVGcmFtZURhdGEoKTtcblxuICAgIHN1cGVyLnByb3BhZ2F0ZUZyYW1lKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2NvbXB1dGVGcmFtZURhdGEoKSB7XG4gICAgY29uc3QgbnVtRnJhbWVzID0gdGhpcy5idWZmZXJJbmRleDtcbiAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXI7XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcblxuICAgIC8vIGdldCBtZWFucyBmb3IgZWFjaCB2ZWN0b3IgaW5kZXhcbiAgICBjb25zdCBzdW1zID0gdGhpcy5zdW1zO1xuICAgIHN1bXMuZmlsbCgwKTtcblxuICAgIGZvciAobGV0IGZyYW1lSW5kZXggPSAwOyBmcmFtZUluZGV4IDwgbnVtRnJhbWVzOyBmcmFtZUluZGV4KyspIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhbWVTaXplOyBpKyspXG4gICAgICAgIHN1bXNbaV0gKz0gYnVmZmVyW2ZyYW1lU2l6ZSAqIGZyYW1lSW5kZXggKyBpXTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYW1lU2l6ZTsgaSsrKVxuICAgICAgZGF0YVtpXSA9IHN1bXNbaV0gLyBudW1GcmFtZXM7XG5cbiAgICB0aGlzLmJ1ZmZlckluZGV4ID0gMDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTYW1wbGVyO1xuIl19