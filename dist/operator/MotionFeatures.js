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
    default: [
    // 'accRaw',
    // 'gyrRaw',
    'accIntensity', 'gyrIntensity', 'freefall', 'kick', 'shake', 'spin', 'still'],
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
  }
  // callback: {
  //   type: 'any',
  //   default: null,
  //   constant: false,
  //   metas: { kind: 'dynamic' },
  // }


  /**
   * @deprecated
   */
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
      // accRaw: [ 'x', 'y', 'z' ],
      // gyrRaw: [ 'x', 'y', 'z' ],
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

        // if (callback) {
        //   const desc = new Array(this.streamParams.frameSize);
        //   for (let j = 0; j < desc.length; j++) {
        //     desc[j] = outData[j];
        //   }
        //   callback(desc);
        // }
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
    }
  }]);
  return MotionFeatures;
}(_core.BaseLfo);

exports.default = MotionFeatures;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJmZWF0dXJlcyIsInR5cGUiLCJkZWZhdWx0IiwiY29uc3RhbnQiLCJhY2NJbmRpY2VzIiwiZ3lySW5kaWNlcyIsIk1vdGlvbkZlYXR1cmVzIiwib3B0aW9ucyIsIl9mZWF0dXJlcyIsInBhcmFtcyIsImdldCIsInNwaW5UaHJlc2giLCJzdGlsbFRocmVzaCIsImFjY0ludGVuc2l0eVBhcmFtMSIsImFjY0ludGVuc2l0eVBhcmFtMiIsIl9mZWF0dXJlc0luZm8iLCJhY2NJbnRlbnNpdHkiLCJneXJJbnRlbnNpdHkiLCJmcmVlZmFsbCIsImtpY2siLCJzaGFrZSIsInNwaW4iLCJzdGlsbCIsImd5clpjciIsImFjY1pjciIsIm5hbWUiLCJ2YWx1ZSIsIm1ldGFzIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJsZW4iLCJkIiwibGVuZ3RoIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJjYWxsYmFjayIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwic2V0QWNjZWxlcm9tZXRlciIsInNldEd5cm9zY29wZSIsInZhbHVlcyIsInVwZGF0ZSIsImkiLCJzdWJEZXNjIiwic3ViVmFsdWVzIiwic3ViZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsSUFBTUEsY0FBYztBQUNsQkMsWUFBVTtBQUNSQyxVQUFNLEtBREU7QUFFUkMsYUFBUztBQUNQO0FBQ0E7QUFDQSxrQkFITyxFQUlQLGNBSk8sRUFLUCxVQUxPLEVBTVAsTUFOTyxFQU9QLE9BUE8sRUFRUCxNQVJPLEVBU1AsT0FUTyxDQUZEO0FBYVJDLGNBQVU7QUFiRixHQURRO0FBZ0JsQkMsY0FBWTtBQUNWSCxVQUFNLEtB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InNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VMZm8gfSBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5pbXBvcnQgX01vdGlvbkZlYXR1cmVzIGZyb20gJy4vX01vdGlvbkZlYXR1cmVzJztcblxuLy8gbW90aW9uLWlucHV0IGluZGljZXMgOlxuLy8gMCwxLDIgLT4gYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eVxuLy8gMyw0LDUgLT4gYWNjZWxlcmF0aW9uXG4vLyA2LDcsOCAtPiByb3RhdGlvblJhdGVcblxuLy8gYnV0LCBhcyB0aGV5IGFyZSBwcmVwcm9jZXNzZWQgYnkgcGFyZW50IGNsYXNzLFxuLy8gaW5kaWNlcyBmb3IgYWNjICsgZ3lybyBhcmUgMCwgMSwgMiwgMywgNCwgNSAoc2VlIGJlbG93KVxuXG5jb25zdCBkZWZpbml0aW9ucyA9IHtcbiAgZmVhdHVyZXM6IHtcbiAgICB0eXBlOiAnYW55JyxcbiAgICBkZWZhdWx0OiBbXG4gICAgICAvLyAnYWNjUmF3JyxcbiAgICAgIC8vICdneXJSYXcnLFxuICAgICAgJ2FjY0ludGVuc2l0eScsXG4gICAgICAnZ3lySW50ZW5zaXR5JyxcbiAgICAgICdmcmVlZmFsbCcsXG4gICAgICAna2ljaycsXG4gICAgICAnc2hha2UnLFxuICAgICAgJ3NwaW4nLFxuICAgICAgJ3N0aWxsJyxcbiAgICBdLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICB9LFxuICBhY2NJbmRpY2VzOiB7XG4gICAgdHlwZTogJ2FueScsXG4gICAgZGVmYXVsdDogWzAsIDEsIDJdLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICB9LFxuICBneXJJbmRpY2VzOiB7XG4gICAgdHlwZTogJ2FueScsXG4gICAgZGVmYXVsdDogWzMsIDQsIDVdLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICB9LFxuICAvLyBjYWxsYmFjazoge1xuICAvLyAgIHR5cGU6ICdhbnknLFxuICAvLyAgIGRlZmF1bHQ6IG51bGwsXG4gIC8vICAgY29uc3RhbnQ6IGZhbHNlLFxuICAvLyAgIG1ldGFzOiB7IGtpbmQ6ICdkeW5hbWljJyB9LFxuICAvLyB9XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWRcbiAqL1xuY2xhc3MgTW90aW9uRmVhdHVyZXMgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoZGVmaW5pdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5fZmVhdHVyZXMgPSBuZXcgX01vdGlvbkZlYXR1cmVzKHtcbiAgICAgIGZlYXR1cmVzOiB0aGlzLnBhcmFtcy5nZXQoJ2ZlYXR1cmVzJyksXG4gICAgICBzcGluVGhyZXNoOiAwLjUsIC8vIG9yaWdpbmFsIDogMjAwXG4gICAgICBzdGlsbFRocmVzaDogMiwgLy8gb3JpZ2luYWwgOiA1MDAwXG4gICAgICBhY2NJbnRlbnNpdHlQYXJhbTE6IDAuOCxcbiAgICAgIGFjY0ludGVuc2l0eVBhcmFtMjogMC4xLFxuICAgIH0pO1xuICAgIC8vIHRoaXMuX2NhbGxiYWNrID0gdGhpcy5wYXJhbXMuZ2V0KCdjYWxsYmFjaycpO1xuXG4gICAgdGhpcy5fZmVhdHVyZXNJbmZvID0ge1xuICAgICAgLy8gYWNjUmF3OiBbICd4JywgJ3knLCAneicgXSxcbiAgICAgIC8vIGd5clJhdzogWyAneCcsICd5JywgJ3onIF0sXG4gICAgICBhY2NJbnRlbnNpdHk6IFsgJ25vcm0nLCAneCcsICd5JywgJ3onIF0sXG4gICAgICBneXJJbnRlbnNpdHk6IFsgJ25vcm0nLCAneCcsICd5JywgJ3onIF0sXG4gICAgICBmcmVlZmFsbDogWyAnYWNjTm9ybScsICdmYWxsaW5nJywgJ2R1cmF0aW9uJyBdLFxuICAgICAga2ljazogWyAnaW50ZW5zaXR5JywgJ2tpY2tpbmcnIF0sXG4gICAgICBzaGFrZTogWyAnc2hha2luZycgXSxcbiAgICAgIHNwaW46IFsgJ3NwaW5uaW5nJywgJ2R1cmF0aW9uJywgJ2d5ck5vcm0nIF0sXG4gICAgICBzdGlsbDogWyAnc3RpbGwnLCAnc2xpZGUnIF0sXG4gICAgICBneXJaY3I6IFsgJ2FtcGxpdHVkZScsICdmcmVxdWVuY3knLCAncGVyaW9kaWNpdHknIF0sXG4gICAgICBhY2NaY3I6IFsgJ2FtcGxpdHVkZScsICdmcmVxdWVuY3knLCAncGVyaW9kaWNpdHknIF0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBvblBhcmFtVXBkYXRlKG5hbWUsIHZhbHVlLCBtZXRhcykge1xuICAgIC8vIGRvIHNvbWV0aGluZyA/IHNob3VsZCBub3QgaGFwcGVuIGFzIGV2ZXJ5Ym9keSBpcyBjb25zdGFudFxuICAgIC8vIGV4Y2VwdCB0aGUgY2FsbGJhY2sgd2hpY2ggaXMgbWFuYWdlZCBpbiB0aGUgcHJvY2Vzc1ZlY3RvciBtZXRob2RcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMgPSB7fSkge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIGNvbnN0IGZlYXR1cmVzID0gdGhpcy5wYXJhbXMuZ2V0KCdmZWF0dXJlcycpO1xuXG4gICAgbGV0IGxlbiA9IDA7XG4gICAgZm9yIChsZXQgZCBvZiBmZWF0dXJlcykge1xuICAgICAgbGVuICs9IHRoaXMuX2ZlYXR1cmVzSW5mb1tkXS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gbGVuO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgY29uc3QgZmVhdHVyZXMgPSB0aGlzLnBhcmFtcy5nZXQoJ2ZlYXR1cmVzJyk7XG4gICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLnBhcmFtcy5nZXQoJ2NhbGxiYWNrJyk7XG4gICAgY29uc3QgaW5EYXRhID0gZnJhbWUuZGF0YTtcbiAgICBjb25zdCBvdXREYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGFjY0luZGljZXMgPSB0aGlzLnBhcmFtcy5nZXQoJ2FjY0luZGljZXMnKTtcbiAgICBjb25zdCBneXJJbmRpY2VzID0gdGhpcy5wYXJhbXMuZ2V0KCdneXJJbmRpY2VzJyk7XG5cbiAgICB0aGlzLl9mZWF0dXJlcy5zZXRBY2NlbGVyb21ldGVyKFxuICAgICAgaW5EYXRhW2FjY0luZGljZXNbMF1dLFxuICAgICAgaW5EYXRhW2FjY0luZGljZXNbMV1dLFxuICAgICAgaW5EYXRhW2FjY0luZGljZXNbMl1dXG4gICAgKTtcblxuICAgIHRoaXMuX2ZlYXR1cmVzLnNldEd5cm9zY29wZShcbiAgICAgIGluRGF0YVtneXJJbmRpY2VzWzBdXSxcbiAgICAgIGluRGF0YVtneXJJbmRpY2VzWzFdXSxcbiAgICAgIGluRGF0YVtneXJJbmRpY2VzWzJdXVxuICAgICk7XG5cbiAgICBjb25zdCB2YWx1ZXMgPSB0aGlzLl9mZWF0dXJlcy51cGRhdGUoKTtcblxuICAgIGxldCBpID0gMDtcblxuICAgIGZvciAobGV0IGQgb2YgZmVhdHVyZXMpIHtcbiAgICAgIGNvbnN0IHN1YkRlc2MgPSB0aGlzLl9mZWF0dXJlc0luZm9bZF07IC8vIHRoZSBhcnJheSBvZiB0aGUgY3VycmVudCBkZXNjcmlwdG9yJ3MgZGltZW5zaW9ucyBuYW1lc1xuICAgICAgY29uc3Qgc3ViVmFsdWVzID0gdmFsdWVzW2RdO1xuXG4gICAgICBmb3IgKGxldCBzdWJkIG9mIHN1YkRlc2MpIHtcbiAgICAgICAgaWYgKHN1YmQgPT09ICdkdXJhdGlvbicgfHwgc3ViZCA9PT0gJ3NsaWRlJykge1xuICAgICAgICAgIHN1YlZhbHVlc1tzdWJkXSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBvdXREYXRhW2ldID0gc3ViVmFsdWVzW3N1YmRdOyAvLyBoZXJlIHdlIGZpbGwgdGhlIG91dHB1dCBmcmFtZSAoZGF0YSlcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGlmIChjYWxsYmFjaykge1xuICAgIC8vICAgY29uc3QgZGVzYyA9IG5ldyBBcnJheSh0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUpO1xuICAgIC8vICAgZm9yIChsZXQgaiA9IDA7IGogPCBkZXNjLmxlbmd0aDsgaisrKSB7XG4gICAgLy8gICAgIGRlc2Nbal0gPSBvdXREYXRhW2pdO1xuICAgIC8vICAgfVxuICAgIC8vICAgY2FsbGJhY2soZGVzYyk7XG4gICAgLy8gfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1vdGlvbkZlYXR1cmVzO1xuIl19