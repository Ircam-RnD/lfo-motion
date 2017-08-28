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

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _core = require('waves-lfo/core');

var _MeanCrossingRate2 = require('./_MeanCrossingRate');

var _MeanCrossingRate3 = _interopRequireDefault(_MeanCrossingRate2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var parameters = {
  noiseThreshold: {
    type: 'float',
    default: 0.1
  },
  frameSize: {
    type: 'integer',
    default: 512,
    metas: { kind: 'static' }
  },
  hopSize: { // should be nullable
    type: 'integer',
    default: null,
    nullable: true,
    metas: { kind: 'static' }
  }
  // centeredTimeTags: {
  //   type: 'boolean',
  //   default: false,
  // }


  /**
   * Mean Crossing Rate operator : estimates energy, frequency and periodicity of
   * a (n-dimension) signal, either on an input stream of signal frames, or by
   * using its own sliding window on an input stream of vectors.
   *
   * The mean is estimated on each new analyzed window using the following equation :
   * `mean = min + (max - min) * 0.5;`
   *
   * @param {Object} options - Override default options
   * @param {Number} [options.noiseThreshold=0.1] - Threshold added to the mean to
   *  avoid confusion between noise and real signal.
   * @param {Number} [options.frameSize=512] - Size of the internal sliding window.
   * @param {Number} [options.hopSize=null] - Number of samples between
   *  two computations on the internal sliding window.
   */

  // We don't use centered time tags for signal input, as we don't know if it's
  // already been done by a previous slicer.
  // So we don't implement it for now.
  // would be :
  // @param {Boolean} [options.centeredTimeTags=false] - Move the time tag to the
  // middle of the frame.

};
var MeanCrossingRate = function (_BaseLfo) {
  (0, _inherits3.default)(MeanCrossingRate, _BaseLfo);

  function MeanCrossingRate() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MeanCrossingRate);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MeanCrossingRate.__proto__ || (0, _getPrototypeOf2.default)(MeanCrossingRate)).call(this, parameters, options));

    _this._mcrs = [];
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(MeanCrossingRate, [{
    key: 'onParamUpdate',
    value: function onParamUpdate(name, value, metas) {
      if (!this.params.hopSize) {
        this.params.set('hopSize', frameSize);
      }
    }

    /** @private */

  }, {
    key: 'processStreamParams',
    value: function processStreamParams() {
      var prevStreamParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.prepareStreamParams(prevStreamParams);

      // TODO : set output samplerate according to input samplerate + hopSize (?)
      this._mcrs = [];

      for (var i = 0; i < prevStreamParams.frameSize; i++) {
        this._mcrs.push(new _MeanCrossingRate3.default({
          noiseThreshold: this.params.get('noiseThreshold'),
          frameSize: this.params.get('frameSize'),
          hopSize: this.params.get('hopSize'),
          sampleRate: prevStreamParams.sourceSampleRate
        }));
      }

      // if input frames are of type "signal", input dimension is 1
      this.streamParams.frameSize = 3;
      this.streamParams.description = ['energy', 'frequency', 'periodicity'];
      this._mcrs.push(new _MeanCrossingRate3.default({
        noiseThreshold: this.params.get('noiseThreshold'),
        frameSize: this.params.get('frameSize'),
        hopSize: this.params.get('hopSize'),
        sampleRate: prevStreamParams.sourceSampleRate
      }));

      // otherwise we have to parallelize :
      if (this.streamParams.frameType === 'vector') {
        this.streamParams.frameSize *= prevStreamParams.frameSize;

        for (var _i = 1; _i < prevStreamParams.frameSize; _i++) {
          this.streamParams.description.concat(this.streamParams.description);
          this._mcrs.push(new _MeanCrossingRate3.default({
            noiseThreshold: this.params.get('noiseThreshold'),
            frameSize: this.params.get('frameSize'),
            hopSize: this.params.get('hopSize'),
            sampleRate: prevStreamParams.sourceSampleRate
          }));
        }
      }

      // not divided by hopSize, we just duplicate frames between.
      // this means we can comment the following line :
      // this.streamParams.frameRate = prevStreamParams.sourceSampleRate;

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      var inData = frame.data;
      var outData = this.frame.data;

      for (var i = 0; i < this._mcrs.length; i++) {
        var r = this._mcrs[i].process(inData[i]);
        outData[i * 3] = r.amplitude;
        outData[i * 3 + 1] = r.frequency;
        outData[i * 3 + 2] = r.periodicity;
      }
    }

    /** @private */

  }, {
    key: 'processSignal',
    value: function processSignal(frame) {
      this.frame.data = this._mcrs[0].processFrame(frame.data);
    }
  }]);
  return MeanCrossingRate;
}(_core.BaseLfo);

exports.default = MeanCrossingRate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm5vaXNlVGhyZXNob2xkIiwidHlwZSIsImRlZmF1bHQiLCJmcmFtZVNpemUiLCJtZXRhcyIsImtpbmQiLCJob3BTaXplIiwibnVsbGFibGUiLCJNZWFuQ3Jvc3NpbmdSYXRlIiwib3B0aW9ucyIsIl9tY3JzIiwibmFtZSIsInZhbHVlIiwicGFyYW1zIiwic2V0IiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJpIiwicHVzaCIsImdldCIsInNhbXBsZVJhdGUiLCJzb3VyY2VTYW1wbGVSYXRlIiwic3RyZWFtUGFyYW1zIiwiZGVzY3JpcHRpb24iLCJmcmFtZVR5cGUiLCJjb25jYXQiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwibGVuZ3RoIiwiciIsInByb2Nlc3MiLCJhbXBsaXR1ZGUiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSIsInByb2Nlc3NGcmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7O0FBRUEsSUFBTUEsYUFBYTtBQUNqQkMsa0JBQWdCO0FBQ2RDLFVBQU0sT0FEUTtBQUVkQyxhQUFTO0FBRkssR0FEQztBQUtqQkMsYUFBVztBQUNURixVQUFNLFNBREc7QUFFVEMsYUFBUyxHQUZBO0FBR1RFLFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSEUsR0FMTTtBQVVqQkMsV0FBUyxFQUFFO0FBQ1RMLFVBQU0sU0FEQztBQUVQQyxhQUFTLElBRkY7QUFHUEssY0FBVSxJQUhIO0FBSVBILFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSkE7QUFNVDtBQUNBO0FBQ0E7QUFDQTs7O0FBR0Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQTNDbUIsQ0FBbkI7SUE2Q01HLGdCOzs7QUFDSiw4QkFBMEI7QUFB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Q0FBWCxFQUFjZ0IsT0FBZCxDQUFzQkwsT0FBT1gsQ0FBUCxDQUF0QixDQUFWO0FBQ0FhLGdCQUFRYixJQUFJLENBQVosSUFBc0JlLEVBQUVFLFNBQXhCO0FBQ0FKLGdCQUFRYixJQUFJLENBQUosR0FBUSxDQUFoQixJQUFzQmUsRUFBRUcsU0FBeEI7QUFDQUwsZ0JBQVFiLElBQUksQ0FBSixHQUFRLENBQWhCLElBQXNCZSxFQUFFSSxXQUF4QjtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7a0NBQ2NULEssRUFBTztBQUNuQixXQUFLQSxLQUFMLENBQVdFLElBQVgsR0FBa0IsS0FBS25CLEtBQUwsQ0FBVyxDQUFYLEVBQWMyQixZQUFkLENBQTJCVixNQUFNRSxJQUFqQyxDQUFsQjtBQUNEOzs7OztrQkFHWXJCLGdCIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuaW1wb3J0IF9NZWFuQ3Jvc3NpbmdSYXRlIGZyb20gJy4vX01lYW5Dcm9zc2luZ1JhdGUnO1xuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBub2lzZVRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4xLFxuICB9LFxuICBmcmFtZVNpemU6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogNTEyLFxuICAgIG1ldGFzOiB7IGtpbmQ6ICdzdGF0aWMnIH0sXG4gIH0sXG4gIGhvcFNpemU6IHsgLy8gc2hvdWxkIGJlIG51bGxhYmxlXG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgbnVsbGFibGU6IHRydWUsXG4gICAgbWV0YXM6IHsga2luZDogJ3N0YXRpYycgfSxcbiAgfSxcbiAgLy8gY2VudGVyZWRUaW1lVGFnczoge1xuICAvLyAgIHR5cGU6ICdib29sZWFuJyxcbiAgLy8gICBkZWZhdWx0OiBmYWxzZSxcbiAgLy8gfVxufVxuXG4vKipcbiAqIE1lYW4gQ3Jvc3NpbmcgUmF0ZSBvcGVyYXRvciA6IGVzdGltYXRlcyBlbmVyZ3ksIGZyZXF1ZW5jeSBhbmQgcGVyaW9kaWNpdHkgb2ZcbiAqIGEgKG4tZGltZW5zaW9uKSBzaWduYWwsIGVpdGhlciBvbiBhbiBpbnB1dCBzdHJlYW0gb2Ygc2lnbmFsIGZyYW1lcywgb3IgYnlcbiAqIHVzaW5nIGl0cyBvd24gc2xpZGluZyB3aW5kb3cgb24gYW4gaW5wdXQgc3RyZWFtIG9mIHZlY3RvcnMuXG4gKlxuICogVGhlIG1lYW4gaXMgZXN0aW1hdGVkIG9uIGVhY2ggbmV3IGFuYWx5emVkIHdpbmRvdyB1c2luZyB0aGUgZm9sbG93aW5nIGVxdWF0aW9uIDpcbiAqIGBtZWFuID0gbWluICsgKG1heCAtIG1pbikgKiAwLjU7YFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMubm9pc2VUaHJlc2hvbGQ9MC4xXSAtIFRocmVzaG9sZCBhZGRlZCB0byB0aGUgbWVhbiB0b1xuICogIGF2b2lkIGNvbmZ1c2lvbiBiZXR3ZWVuIG5vaXNlIGFuZCByZWFsIHNpZ25hbC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5mcmFtZVNpemU9NTEyXSAtIFNpemUgb2YgdGhlIGludGVybmFsIHNsaWRpbmcgd2luZG93LlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmhvcFNpemU9bnVsbF0gLSBOdW1iZXIgb2Ygc2FtcGxlcyBiZXR3ZWVuXG4gKiAgdHdvIGNvbXB1dGF0aW9ucyBvbiB0aGUgaW50ZXJuYWwgc2xpZGluZyB3aW5kb3cuXG4gKi9cblxuLy8gV2UgZG9uJ3QgdXNlIGNlbnRlcmVkIHRpbWUgdGFncyBmb3Igc2lnbmFsIGlucHV0LCBhcyB3ZSBkb24ndCBrbm93IGlmIGl0J3Ncbi8vIGFscmVhZHkgYmVlbiBkb25lIGJ5IGEgcHJldmlvdXMgc2xpY2VyLlxuLy8gU28gd2UgZG9uJ3QgaW1wbGVtZW50IGl0IGZvciBub3cuXG4vLyB3b3VsZCBiZSA6XG4vLyBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLmNlbnRlcmVkVGltZVRhZ3M9ZmFsc2VdIC0gTW92ZSB0aGUgdGltZSB0YWcgdG8gdGhlXG4vLyBtaWRkbGUgb2YgdGhlIGZyYW1lLlxuXG5jbGFzcyBNZWFuQ3Jvc3NpbmdSYXRlIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5fbWNycyA9IFtdO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIG9uUGFyYW1VcGRhdGUobmFtZSwgdmFsdWUsIG1ldGFzKSB7XG4gICAgaWYgKCF0aGlzLnBhcmFtcy5ob3BTaXplKSB7XG4gICAgICB0aGlzLnBhcmFtcy5zZXQoJ2hvcFNpemUnLCBmcmFtZVNpemUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMgPSB7fSkge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIC8vIFRPRE8gOiBzZXQgb3V0cHV0IHNhbXBsZXJhdGUgYWNjb3JkaW5nIHRvIGlucHV0IHNhbXBsZXJhdGUgKyBob3BTaXplICg/KVxuICAgIHRoaXMuX21jcnMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJldlN0cmVhbVBhcmFtcy5mcmFtZVNpemU7IGkrKykge1xuICAgICAgdGhpcy5fbWNycy5wdXNoKG5ldyBfTWVhbkNyb3NzaW5nUmF0ZSh7XG4gICAgICAgIG5vaXNlVGhyZXNob2xkOiB0aGlzLnBhcmFtcy5nZXQoJ25vaXNlVGhyZXNob2xkJyksXG4gICAgICAgIGZyYW1lU2l6ZTogdGhpcy5wYXJhbXMuZ2V0KCdmcmFtZVNpemUnKSxcbiAgICAgICAgaG9wU2l6ZTogdGhpcy5wYXJhbXMuZ2V0KCdob3BTaXplJyksXG4gICAgICAgIHNhbXBsZVJhdGU6IHByZXZTdHJlYW1QYXJhbXMuc291cmNlU2FtcGxlUmF0ZSxcbiAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvLyBpZiBpbnB1dCBmcmFtZXMgYXJlIG9mIHR5cGUgXCJzaWduYWxcIiwgaW5wdXQgZGltZW5zaW9uIGlzIDFcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAzO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uID0gWyAnZW5lcmd5JywgJ2ZyZXF1ZW5jeScsICdwZXJpb2RpY2l0eScgXTtcbiAgICB0aGlzLl9tY3JzLnB1c2gobmV3IF9NZWFuQ3Jvc3NpbmdSYXRlKHtcbiAgICAgIG5vaXNlVGhyZXNob2xkOiB0aGlzLnBhcmFtcy5nZXQoJ25vaXNlVGhyZXNob2xkJyksXG4gICAgICBmcmFtZVNpemU6IHRoaXMucGFyYW1zLmdldCgnZnJhbWVTaXplJyksXG4gICAgICBob3BTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2hvcFNpemUnKSxcbiAgICAgIHNhbXBsZVJhdGU6IHByZXZTdHJlYW1QYXJhbXMuc291cmNlU2FtcGxlUmF0ZSxcbiAgICB9KSk7XG5cbiAgICAvLyBvdGhlcndpc2Ugd2UgaGF2ZSB0byBwYXJhbGxlbGl6ZSA6XG4gICAgaWYgKHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lVHlwZSA9PT0gJ3ZlY3RvcicpIHtcbiAgICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSAqPSBwcmV2U3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcblxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwcmV2U3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTsgaSsrKSB7XG4gICAgICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uLmNvbmNhdCh0aGlzLnN0cmVhbVBhcmFtcy5kZXNjcmlwdGlvbik7XG4gICAgICAgIHRoaXMuX21jcnMucHVzaChuZXcgX01lYW5Dcm9zc2luZ1JhdGUoe1xuICAgICAgICAgIG5vaXNlVGhyZXNob2xkOiB0aGlzLnBhcmFtcy5nZXQoJ25vaXNlVGhyZXNob2xkJyksXG4gICAgICAgICAgZnJhbWVTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lU2l6ZScpLFxuICAgICAgICAgIGhvcFNpemU6IHRoaXMucGFyYW1zLmdldCgnaG9wU2l6ZScpLFxuICAgICAgICAgIHNhbXBsZVJhdGU6IHByZXZTdHJlYW1QYXJhbXMuc291cmNlU2FtcGxlUmF0ZSxcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG5vdCBkaXZpZGVkIGJ5IGhvcFNpemUsIHdlIGp1c3QgZHVwbGljYXRlIGZyYW1lcyBiZXR3ZWVuLlxuICAgIC8vIHRoaXMgbWVhbnMgd2UgY2FuIGNvbW1lbnQgdGhlIGZvbGxvd2luZyBsaW5lIDpcbiAgICAvLyB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSBwcmV2U3RyZWFtUGFyYW1zLnNvdXJjZVNhbXBsZVJhdGU7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCBpbkRhdGEgPSBmcmFtZS5kYXRhO1xuICAgIGNvbnN0IG91dERhdGEgPSB0aGlzLmZyYW1lLmRhdGE7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX21jcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHIgPSB0aGlzLl9tY3JzW2ldLnByb2Nlc3MoaW5EYXRhW2ldKTtcbiAgICAgIG91dERhdGFbaSAqIDNdICAgICAgPSByLmFtcGxpdHVkZTtcbiAgICAgIG91dERhdGFbaSAqIDMgKyAxXSAgPSByLmZyZXF1ZW5jeTtcbiAgICAgIG91dERhdGFbaSAqIDMgKyAyXSAgPSByLnBlcmlvZGljaXR5O1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU2lnbmFsKGZyYW1lKSB7XG4gICAgdGhpcy5mcmFtZS5kYXRhID0gdGhpcy5fbWNyc1swXS5wcm9jZXNzRnJhbWUoZnJhbWUuZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTWVhbkNyb3NzaW5nUmF0ZTtcbiJdfQ==