'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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

var _MotionFeatures2 = require('./_MotionFeatures');

var _MotionFeatures3 = _interopRequireDefault(_MotionFeatures2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// motion-input indices :
// 0,1,2 -> accelerationIncludingGravity
// 3,4,5 -> acceleration
// 6,7,8 -> rotationRate

// but, as they are preprocessed by parent class,
// indices for acc + gyro are 0, 1, 2, 3, 4, 5 (see below)

var definitions = {
  features: {
    type: 'any',
    default: ['accRaw', 'gyrRaw', 'accIntensity', 'gyrIntensity', 'freefall', 'kick', 'shake', 'spin', 'still'],
    constant: true
  },
  accIndices: {
    type: 'any',
    default: [0, 1, 2],
    constant: true
  },
  gyrIndices: {
    type: 'any',
    default: [3, 4, 5],
    constant: true
  },
  callback: {
    type: 'any',
    default: null,
    constant: false,
    metas: { kind: 'dynamic' }
  }
};

var MotionFeatures = function (_BaseLfo) {
  (0, _inherits3.default)(MotionFeatures, _BaseLfo);

  function MotionFeatures() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MotionFeatures);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MotionFeatures.__proto__ || (0, _getPrototypeOf2.default)(MotionFeatures)).call(this, definitions, options));

    _this._features = new _MotionFeatures3.default({
      features: _this.params.get('features'),
      spinThresh: 0.5, // original : 200
      stillThresh: 2, // original : 5000
      accIntensityParam1: 0.8,
      accIntensityParam2: 0.1
    });
    // this._callback = this.params.get('callback');

    _this._featuresInfo = {
      accRaw: ['x', 'y', 'z'],
      gyrRaw: ['x', 'y', 'z'],
      accIntensity: ['norm', 'x', 'y', 'z'],
      gyrIntensity: ['norm', 'x', 'y', 'z'],
      freefall: ['accNorm', 'falling', 'duration'],
      kick: ['intensity', 'kicking'],
      shake: ['shaking'],
      spin: ['spinning', 'duration', 'gyrNorm'],
      still: ['still', 'slide'],
      gyrZcr: ['amplitude', 'frequency', 'periodicity'],
      accZcr: ['amplitude', 'frequency', 'periodicity']
    };
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(MotionFeatures, [{
    key: 'onParamUpdate',
    value: function onParamUpdate(name, value, metas) {}
    // do something ? should not happen as everybody is constant
    // except the callback which is managed in the processVector method


    /** @private */

  }, {
    key: 'processStreamParams',
    value: function processStreamParams() {
      var prevStreamParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.prepareStreamParams(prevStreamParams);

      var features = this.params.get('features');

      var len = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(features), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var d = _step.value;

          len += this._featuresInfo[d].length;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.streamParams.frameSize = len;

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      var features = this.params.get('features');
      var callback = this.params.get('callback');
      var inData = frame.data;
      var outData = this.frame.data;
      var accIndices = this.params.get('accIndices');
      var gyrIndices = this.params.get('gyrIndices');

      this._features.setAccelerometer(inData[accIndices[0]], inData[accIndices[1]], inData[accIndices[2]]);

      this._features.setGyroscope(inData[gyrIndices[0]], inData[gyrIndices[1]], inData[gyrIndices[2]]);

      var values = this._features.update();

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(features), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var d = _step2.value;

          var subDesc = this._featuresInfo[d]; // the array of the current descriptor's dimensions names
          var subValues = values[d];

          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = (0, _getIterator3.default)(subDesc), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var subd = _step3.value;

              if (subd === 'duration' || subd === 'slide') {
                subValues[subd] = 0;
              }
              outData[i] = subValues[subd]; // here we fill the output frame (data)
              i++;
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      if (callback) {
        var desc = new Array(this.streamParams.frameSize);
        for (var j = 0; j < desc.length; j++) {
          desc[j] = outData[j];
        }
        callback(desc);
      }
    }

    /** @private */
    // processFrame(frame) {
    //   this.prepareFrame(frame);
    //   this.processFunction(frame);
    // }

  }]);
  return MotionFeatures;
}(_core.BaseLfo);

exports.default = MotionFeatures;
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJmZWF0dXJlcyIsInR5cGUiLCJkZWZhdWx0IiwiY29uc3RhbnQiLCJhY2NJbmRpY2VzIiwiZ3lySW5kaWNlcyIsImNhbGxiYWNrIiwibWV0YXMiLCJraW5kIiwiTW90aW9uRmVhdHVyZXMiLCJvcHRpb25zIiwiX2ZlYXR1cmVzIiwicGFyYW1zIiwiZ2V0Iiwic3BpblRocmVzaCIsInN0aWxsVGhyZXNoIiwiYWNjSW50ZW5zaXR5UGFyYW0xIiwiYWNjSW50ZW5zaXR5UGFyYW0yIiwiX2ZlYXR1cmVzSW5mbyIsImFjY1JhdyIsImd5clJhdyIsImFjY0ludGVuc2l0eSIsImd5ckludGVuc2l0eSIsImZyZWVmYWxsIiwia2ljayIsInNoYWtlIiwic3BpbiIsInN0aWxsIiwiZ3lyWmNyIiwiYWNjWmNyIiwibmFtZSIsInZhbHVlIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJsZW4iLCJkIiwibGVuZ3RoIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJpbkRhdGEiLCJkYXRhIiwib3V0RGF0YSIsInNldEFjY2VsZXJvbWV0ZXIiLCJzZXRHeXJvc2NvcGUiLCJ2YWx1ZXMiLCJ1cGRhdGUiLCJpIiwic3ViRGVzYyIsInN1YlZhbHVlcyIsInN1YmQiLCJkZXNjIiwiQXJyYXkiLCJqIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxJQUFNQSxjQUFjO0FBQ2xCQyxZQUFVO0FBQ1JDLFVBQU0sS0FERTtBQUVSQyxhQUFTLENBQ1AsUUFETyxFQUVQLFFBRk8sRUFHUCxjQUhPLEVBSVAsY0FKTyxFQUtQLFVBTE8sRUFNUCxNQU5PLEVBT1AsT0FQTyxFQVFQLE1BUk8sRUFTUCxPQVRP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QUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVd2QjtBQWxDa0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFvQ25CLFVBQUkxQyxRQUFKLEVBQWM7QUFDWixZQUFNOEMsT0FBTyxJQUFJQyxLQUFKLENBQVUsS0FBS2hCLFlBQUwsQ0FBa0JDLFNBQTVCLENBQWI7QUFDQSxhQUFLLElBQUlnQixJQUFJLENBQWIsRUFBZ0JBLElBQUlGLEtBQUtoQixNQUF6QixFQUFpQ2tCLEdBQWpDLEVBQXNDO0FBQ3BDRixlQUFLRSxDQUFMLElBQVVYLFFBQVFXLENBQVIsQ0FBVjtBQUNEO0FBQ0RoRCxpQkFBUzhDLElBQVQ7QUFDRDtBQUNGOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztrQkFwR21CM0MsYztBQXFHcEIiLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VMZm8gfSBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5pbXBvcnQgX01vdGlvbkZlYXR1cmVzIGZyb20gJy4vX01vdGlvbkZlYXR1cmVzJztcblxuLy8gbW90aW9uLWlucHV0IGluZGljZXMgOlxuLy8gMCwxLDIgLT4gYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eVxuLy8gMyw0LDUgLT4gYWNjZWxlcmF0aW9uXG4vLyA2LDcsOCAtPiByb3RhdGlvblJhdGVcblxuLy8gYnV0LCBhcyB0aGV5IGFyZSBwcmVwcm9jZXNzZWQgYnkgcGFyZW50IGNsYXNzLFxuLy8gaW5kaWNlcyBmb3IgYWNjICsgZ3lybyBhcmUgMCwgMSwgMiwgMywgNCwgNSAoc2VlIGJlbG93KVxuXG5jb25zdCBkZWZpbml0aW9ucyA9IHtcbiAgZmVhdHVyZXM6IHtcbiAgICB0eXBlOiAnYW55JyxcbiAgICBkZWZhdWx0OiBbXG4gICAgICAnYWNjUmF3JyxcbiAgICAgICdneXJSYXcnLFxuICAgICAgJ2FjY0ludGVuc2l0eScsXG4gICAgICAnZ3lySW50ZW5zaXR5JyxcbiAgICAgICdmcmVlZmFsbCcsXG4gICAgICAna2ljaycsXG4gICAgICAnc2hha2UnLFxuICAgICAgJ3NwaW4nLFxuICAgICAgJ3N0aWxsJyxcbiAgICBdLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICB9LFxuICBhY2NJbmRpY2VzOiB7XG4gICAgdHlwZTogJ2FueScsXG4gICAgZGVmYXVsdDogWzAsIDEsIDJdLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICB9LFxuICBneXJJbmRpY2VzOiB7XG4gICAgdHlwZTogJ2FueScsXG4gICAgZGVmYXVsdDogWzMsIDQsIDVdLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICB9LFxuICBjYWxsYmFjazoge1xuICAgIHR5cGU6ICdhbnknLFxuICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgY29uc3RhbnQ6IGZhbHNlLFxuICAgIG1ldGFzOiB7IGtpbmQ6ICdkeW5hbWljJyB9LFxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vdGlvbkZlYXR1cmVzIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2ZlYXR1cmVzID0gbmV3IF9Nb3Rpb25GZWF0dXJlcyh7XG4gICAgICBmZWF0dXJlczogdGhpcy5wYXJhbXMuZ2V0KCdmZWF0dXJlcycpLFxuICAgICAgc3BpblRocmVzaDogMC41LCAvLyBvcmlnaW5hbCA6IDIwMFxuICAgICAgc3RpbGxUaHJlc2g6IDIsIC8vIG9yaWdpbmFsIDogNTAwMFxuICAgICAgYWNjSW50ZW5zaXR5UGFyYW0xOiAwLjgsXG4gICAgICBhY2NJbnRlbnNpdHlQYXJhbTI6IDAuMSxcbiAgICB9KTtcbiAgICAvLyB0aGlzLl9jYWxsYmFjayA9IHRoaXMucGFyYW1zLmdldCgnY2FsbGJhY2snKTtcblxuICAgIHRoaXMuX2ZlYXR1cmVzSW5mbyA9IHtcbiAgICAgIGFjY1JhdzogWyAneCcsICd5JywgJ3onIF0sXG4gICAgICBneXJSYXc6IFsgJ3gnLCAneScsICd6JyBdLFxuICAgICAgYWNjSW50ZW5zaXR5OiBbICdub3JtJywgJ3gnLCAneScsICd6JyBdLFxuICAgICAgZ3lySW50ZW5zaXR5OiBbICdub3JtJywgJ3gnLCAneScsICd6JyBdLFxuICAgICAgZnJlZWZhbGw6IFsgJ2FjY05vcm0nLCAnZmFsbGluZycsICdkdXJhdGlvbicgXSxcbiAgICAgIGtpY2s6IFsgJ2ludGVuc2l0eScsICdraWNraW5nJyBdLFxuICAgICAgc2hha2U6IFsgJ3NoYWtpbmcnIF0sXG4gICAgICBzcGluOiBbICdzcGlubmluZycsICdkdXJhdGlvbicsICdneXJOb3JtJyBdLFxuICAgICAgc3RpbGw6IFsgJ3N0aWxsJywgJ3NsaWRlJyBdLFxuICAgICAgZ3lyWmNyOiBbICdhbXBsaXR1ZGUnLCAnZnJlcXVlbmN5JywgJ3BlcmlvZGljaXR5JyBdLFxuICAgICAgYWNjWmNyOiBbICdhbXBsaXR1ZGUnLCAnZnJlcXVlbmN5JywgJ3BlcmlvZGljaXR5JyBdLFxuICAgIH07XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgb25QYXJhbVVwZGF0ZShuYW1lLCB2YWx1ZSwgbWV0YXMpIHtcbiAgICAvLyBkbyBzb21ldGhpbmcgPyBzaG91bGQgbm90IGhhcHBlbiBhcyBldmVyeWJvZHkgaXMgY29uc3RhbnRcbiAgICAvLyBleGNlcHQgdGhlIGNhbGxiYWNrIHdoaWNoIGlzIG1hbmFnZWQgaW4gdGhlIHByb2Nlc3NWZWN0b3IgbWV0aG9kXG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zID0ge30pIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICBjb25zdCBmZWF0dXJlcyA9IHRoaXMucGFyYW1zLmdldCgnZmVhdHVyZXMnKTtcblxuICAgIGxldCBsZW4gPSAwO1xuICAgIGZvciAobGV0IGQgb2YgZmVhdHVyZXMpIHtcbiAgICAgIGxlbiArPSB0aGlzLl9mZWF0dXJlc0luZm9bZF0ubGVuZ3RoO1xuICAgIH1cblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IGxlbjtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gdGhpcy5wYXJhbXMuZ2V0KCdmZWF0dXJlcycpO1xuICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5wYXJhbXMuZ2V0KCdjYWxsYmFjaycpO1xuICAgIGNvbnN0IGluRGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0RGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcbiAgICBjb25zdCBhY2NJbmRpY2VzID0gdGhpcy5wYXJhbXMuZ2V0KCdhY2NJbmRpY2VzJyk7XG4gICAgY29uc3QgZ3lySW5kaWNlcyA9IHRoaXMucGFyYW1zLmdldCgnZ3lySW5kaWNlcycpO1xuICAgIFxuICAgIHRoaXMuX2ZlYXR1cmVzLnNldEFjY2VsZXJvbWV0ZXIoXG4gICAgICBpbkRhdGFbYWNjSW5kaWNlc1swXV0sXG4gICAgICBpbkRhdGFbYWNjSW5kaWNlc1sxXV0sXG4gICAgICBpbkRhdGFbYWNjSW5kaWNlc1syXV1cbiAgICApO1xuXG4gICAgdGhpcy5fZmVhdHVyZXMuc2V0R3lyb3Njb3BlKFxuICAgICAgaW5EYXRhW2d5ckluZGljZXNbMF1dLFxuICAgICAgaW5EYXRhW2d5ckluZGljZXNbMV1dLFxuICAgICAgaW5EYXRhW2d5ckluZGljZXNbMl1dXG4gICAgKTtcblxuICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMuX2ZlYXR1cmVzLnVwZGF0ZSgpO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAobGV0IGQgb2YgZmVhdHVyZXMpIHtcbiAgICAgIGNvbnN0IHN1YkRlc2MgPSB0aGlzLl9mZWF0dXJlc0luZm9bZF07IC8vIHRoZSBhcnJheSBvZiB0aGUgY3VycmVudCBkZXNjcmlwdG9yJ3MgZGltZW5zaW9ucyBuYW1lc1xuICAgICAgY29uc3Qgc3ViVmFsdWVzID0gdmFsdWVzW2RdO1xuXG4gICAgICBmb3IgKGxldCBzdWJkIG9mIHN1YkRlc2MpIHtcbiAgICAgICAgaWYgKHN1YmQgPT09ICdkdXJhdGlvbicgfHwgc3ViZCA9PT0gJ3NsaWRlJykge1xuICAgICAgICAgIHN1YlZhbHVlc1tzdWJkXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgb3V0RGF0YVtpXSA9IHN1YlZhbHVlc1tzdWJkXTsgLy8gaGVyZSB3ZSBmaWxsIHRoZSBvdXRwdXQgZnJhbWUgKGRhdGEpXG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNvbnN0IGRlc2MgPSBuZXcgQXJyYXkodGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplKTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGVzYy5sZW5ndGg7IGorKykge1xuICAgICAgICBkZXNjW2pdID0gb3V0RGF0YVtqXTtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKGRlc2MpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICAvLyBwcm9jZXNzRnJhbWUoZnJhbWUpIHtcbiAgLy8gICB0aGlzLnByZXBhcmVGcmFtZShmcmFtZSk7XG4gIC8vICAgdGhpcy5wcm9jZXNzRnVuY3Rpb24oZnJhbWUpO1xuICAvLyB9XG59OyJdfQ==