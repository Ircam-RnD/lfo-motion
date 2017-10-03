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
   * @ignore
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJmZWF0dXJlcyIsInR5cGUiLCJkZWZhdWx0IiwiY29uc3RhbnQiLCJhY2NJbmRpY2VzIiwiZ3lySW5kaWNlcyIsIk1vdGlvbkZlYXR1cmVzIiwib3B0aW9ucyIsIl9mZWF0dXJlcyIsInBhcmFtcyIsImdldCIsInNwaW5UaHJlc2giLCJzdGlsbFRocmVzaCIsImFjY0ludGVuc2l0eVBhcmFtMSIsImFjY0ludGVuc2l0eVBhcmFtMiIsIl9mZWF0dXJlc0luZm8iLCJhY2NJbnRlbnNpdHkiLCJneXJJbnRlbnNpdHkiLCJmcmVlZmFsbCIsImtpY2siLCJzaGFrZSIsInNwaW4iLCJzdGlsbCIsImd5clpjciIsImFjY1pjciIsIm5hbWUiLCJ2YWx1ZSIsIm1ldGFzIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJsZW4iLCJkIiwibGVuZ3RoIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJjYWxsYmFjayIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwic2V0QWNjZWxlcm9tZXRlciIsInNldEd5cm9zY29wZSIsInZhbHVlcyIsInVwZGF0ZSIsImkiLCJzdWJEZXNjIiwic3ViVmFsdWVzIiwic3ViZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsSUFBTUEsY0FBYztBQUNsQkMsWUFBVTtBQUNSQyxVQUFNLEtBREU7QUFFUkMsYUFBUztBQUNQO0FBQ0E7QUFDQSxrQkFITyxFQUlQLGNBSk8sRUFLUCxVQUxPLEVBTVAsTUFOTyxFQU9QLE9BUE8sRUFRUCxNQVJPLEVBU1AsT0FUTyxDQUZEO0FBYVJDLGNBQVU7QUFiRixHQURRO0FBZ0JsQkMsY0FBWTtBQUNWSCxVQUFNLEtB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LCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuaW1wb3J0IF9Nb3Rpb25GZWF0dXJlcyBmcm9tICcuL19Nb3Rpb25GZWF0dXJlcyc7XG5cbi8vIG1vdGlvbi1pbnB1dCBpbmRpY2VzIDpcbi8vIDAsMSwyIC0+IGFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHlcbi8vIDMsNCw1IC0+IGFjY2VsZXJhdGlvblxuLy8gNiw3LDggLT4gcm90YXRpb25SYXRlXG5cbi8vIGJ1dCwgYXMgdGhleSBhcmUgcHJlcHJvY2Vzc2VkIGJ5IHBhcmVudCBjbGFzcyxcbi8vIGluZGljZXMgZm9yIGFjYyArIGd5cm8gYXJlIDAsIDEsIDIsIDMsIDQsIDUgKHNlZSBiZWxvdylcblxuY29uc3QgZGVmaW5pdGlvbnMgPSB7XG4gIGZlYXR1cmVzOiB7XG4gICAgdHlwZTogJ2FueScsXG4gICAgZGVmYXVsdDogW1xuICAgICAgLy8gJ2FjY1JhdycsXG4gICAgICAvLyAnZ3lyUmF3JyxcbiAgICAgICdhY2NJbnRlbnNpdHknLFxuICAgICAgJ2d5ckludGVuc2l0eScsXG4gICAgICAnZnJlZWZhbGwnLFxuICAgICAgJ2tpY2snLFxuICAgICAgJ3NoYWtlJyxcbiAgICAgICdzcGluJyxcbiAgICAgICdzdGlsbCcsXG4gICAgXSxcbiAgICBjb25zdGFudDogdHJ1ZSxcbiAgfSxcbiAgYWNjSW5kaWNlczoge1xuICAgIHR5cGU6ICdhbnknLFxuICAgIGRlZmF1bHQ6IFswLCAxLCAyXSxcbiAgICBjb25zdGFudDogdHJ1ZSxcbiAgfSxcbiAgZ3lySW5kaWNlczoge1xuICAgIHR5cGU6ICdhbnknLFxuICAgIGRlZmF1bHQ6IFszLCA0LCA1XSxcbiAgICBjb25zdGFudDogdHJ1ZSxcbiAgfSxcbiAgLy8gY2FsbGJhY2s6IHtcbiAgLy8gICB0eXBlOiAnYW55JyxcbiAgLy8gICBkZWZhdWx0OiBudWxsLFxuICAvLyAgIGNvbnN0YW50OiBmYWxzZSxcbiAgLy8gICBtZXRhczogeyBraW5kOiAnZHluYW1pYycgfSxcbiAgLy8gfVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKiBAaWdub3JlXG4gKi9cbmNsYXNzIE1vdGlvbkZlYXR1cmVzIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2ZlYXR1cmVzID0gbmV3IF9Nb3Rpb25GZWF0dXJlcyh7XG4gICAgICBmZWF0dXJlczogdGhpcy5wYXJhbXMuZ2V0KCdmZWF0dXJlcycpLFxuICAgICAgc3BpblRocmVzaDogMC41LCAvLyBvcmlnaW5hbCA6IDIwMFxuICAgICAgc3RpbGxUaHJlc2g6IDIsIC8vIG9yaWdpbmFsIDogNTAwMFxuICAgICAgYWNjSW50ZW5zaXR5UGFyYW0xOiAwLjgsXG4gICAgICBhY2NJbnRlbnNpdHlQYXJhbTI6IDAuMSxcbiAgICB9KTtcbiAgICAvLyB0aGlzLl9jYWxsYmFjayA9IHRoaXMucGFyYW1zLmdldCgnY2FsbGJhY2snKTtcblxuICAgIHRoaXMuX2ZlYXR1cmVzSW5mbyA9IHtcbiAgICAgIC8vIGFjY1JhdzogWyAneCcsICd5JywgJ3onIF0sXG4gICAgICAvLyBneXJSYXc6IFsgJ3gnLCAneScsICd6JyBdLFxuICAgICAgYWNjSW50ZW5zaXR5OiBbICdub3JtJywgJ3gnLCAneScsICd6JyBdLFxuICAgICAgZ3lySW50ZW5zaXR5OiBbICdub3JtJywgJ3gnLCAneScsICd6JyBdLFxuICAgICAgZnJlZWZhbGw6IFsgJ2FjY05vcm0nLCAnZmFsbGluZycsICdkdXJhdGlvbicgXSxcbiAgICAgIGtpY2s6IFsgJ2ludGVuc2l0eScsICdraWNraW5nJyBdLFxuICAgICAgc2hha2U6IFsgJ3NoYWtpbmcnIF0sXG4gICAgICBzcGluOiBbICdzcGlubmluZycsICdkdXJhdGlvbicsICdneXJOb3JtJyBdLFxuICAgICAgc3RpbGw6IFsgJ3N0aWxsJywgJ3NsaWRlJyBdLFxuICAgICAgZ3lyWmNyOiBbICdhbXBsaXR1ZGUnLCAnZnJlcXVlbmN5JywgJ3BlcmlvZGljaXR5JyBdLFxuICAgICAgYWNjWmNyOiBbICdhbXBsaXR1ZGUnLCAnZnJlcXVlbmN5JywgJ3BlcmlvZGljaXR5JyBdLFxuICAgIH07XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgb25QYXJhbVVwZGF0ZShuYW1lLCB2YWx1ZSwgbWV0YXMpIHtcbiAgICAvLyBkbyBzb21ldGhpbmcgPyBzaG91bGQgbm90IGhhcHBlbiBhcyBldmVyeWJvZHkgaXMgY29uc3RhbnRcbiAgICAvLyBleGNlcHQgdGhlIGNhbGxiYWNrIHdoaWNoIGlzIG1hbmFnZWQgaW4gdGhlIHByb2Nlc3NWZWN0b3IgbWV0aG9kXG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zID0ge30pIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICBjb25zdCBmZWF0dXJlcyA9IHRoaXMucGFyYW1zLmdldCgnZmVhdHVyZXMnKTtcblxuICAgIGxldCBsZW4gPSAwO1xuICAgIGZvciAobGV0IGQgb2YgZmVhdHVyZXMpIHtcbiAgICAgIGxlbiArPSB0aGlzLl9mZWF0dXJlc0luZm9bZF0ubGVuZ3RoO1xuICAgIH1cblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IGxlbjtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gdGhpcy5wYXJhbXMuZ2V0KCdmZWF0dXJlcycpO1xuICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5wYXJhbXMuZ2V0KCdjYWxsYmFjaycpO1xuICAgIGNvbnN0IGluRGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0RGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcbiAgICBjb25zdCBhY2NJbmRpY2VzID0gdGhpcy5wYXJhbXMuZ2V0KCdhY2NJbmRpY2VzJyk7XG4gICAgY29uc3QgZ3lySW5kaWNlcyA9IHRoaXMucGFyYW1zLmdldCgnZ3lySW5kaWNlcycpO1xuXG4gICAgdGhpcy5fZmVhdHVyZXMuc2V0QWNjZWxlcm9tZXRlcihcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzBdXSxcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzFdXSxcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzJdXVxuICAgICk7XG5cbiAgICB0aGlzLl9mZWF0dXJlcy5zZXRHeXJvc2NvcGUoXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1swXV0sXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1sxXV0sXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1syXV1cbiAgICApO1xuXG4gICAgY29uc3QgdmFsdWVzID0gdGhpcy5fZmVhdHVyZXMudXBkYXRlKCk7XG5cbiAgICBsZXQgaSA9IDA7XG5cbiAgICBmb3IgKGxldCBkIG9mIGZlYXR1cmVzKSB7XG4gICAgICBjb25zdCBzdWJEZXNjID0gdGhpcy5fZmVhdHVyZXNJbmZvW2RdOyAvLyB0aGUgYXJyYXkgb2YgdGhlIGN1cnJlbnQgZGVzY3JpcHRvcidzIGRpbWVuc2lvbnMgbmFtZXNcbiAgICAgIGNvbnN0IHN1YlZhbHVlcyA9IHZhbHVlc1tkXTtcblxuICAgICAgZm9yIChsZXQgc3ViZCBvZiBzdWJEZXNjKSB7XG4gICAgICAgIGlmIChzdWJkID09PSAnZHVyYXRpb24nIHx8IHN1YmQgPT09ICdzbGlkZScpIHtcbiAgICAgICAgICBzdWJWYWx1ZXNbc3ViZF0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgb3V0RGF0YVtpXSA9IHN1YlZhbHVlc1tzdWJkXTsgLy8gaGVyZSB3ZSBmaWxsIHRoZSBvdXRwdXQgZnJhbWUgKGRhdGEpXG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiAoY2FsbGJhY2spIHtcbiAgICAvLyAgIGNvbnN0IGRlc2MgPSBuZXcgQXJyYXkodGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplKTtcbiAgICAvLyAgIGZvciAobGV0IGogPSAwOyBqIDwgZGVzYy5sZW5ndGg7IGorKykge1xuICAgIC8vICAgICBkZXNjW2pdID0gb3V0RGF0YVtqXTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIGNhbGxiYWNrKGRlc2MpO1xuICAgIC8vIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNb3Rpb25GZWF0dXJlcztcbiJdfQ==