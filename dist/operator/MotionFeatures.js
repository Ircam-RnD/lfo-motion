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

//----------------------------------------------------------------------------//
//------------------------------ ORIGINAL CLASS ------------------------------//
//----------------------------------------------------------------------------//
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJmZWF0dXJlcyIsInR5cGUiLCJkZWZhdWx0IiwiY29uc3RhbnQiLCJhY2NJbmRpY2VzIiwiZ3lySW5kaWNlcyIsIk1vdGlvbkZlYXR1cmVzIiwib3B0aW9ucyIsIl9mZWF0dXJlcyIsInBhcmFtcyIsImdldCIsInNwaW5UaHJlc2giLCJzdGlsbFRocmVzaCIsImFjY0ludGVuc2l0eVBhcmFtMSIsImFjY0ludGVuc2l0eVBhcmFtMiIsIl9mZWF0dXJlc0luZm8iLCJhY2NJbnRlbnNpdHkiLCJneXJJbnRlbnNpdHkiLCJmcmVlZmFsbCIsImtpY2siLCJzaGFrZSIsInNwaW4iLCJzdGlsbCIsImd5clpjciIsImFjY1pjciIsIm5hbWUiLCJ2YWx1ZSIsIm1ldGFzIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJsZW4iLCJkIiwibGVuZ3RoIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJjYWxsYmFjayIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwic2V0QWNjZWxlcm9tZXRlciIsInNldEd5cm9zY29wZSIsInZhbHVlcyIsInVwZGF0ZSIsImkiLCJzdWJEZXNjIiwic3ViVmFsdWVzIiwic3ViZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsSUFBTUEsY0FBYztBQUNsQkMsWUFBVTtBQUNSQyxVQUFNLEtBREU7QUFFUkMsYUFBUztBQUNQO0FBQ0E7QUFDQSxrQkFITyxFQUlQLGNBSk8sRUFLUCxVQUxPLEVBTVAsTUFOTyxFQU9QLE9BUE8sRUFRUCxNQVJPLEVBU1AsT0FUTyxDQUZEO0FBYVJDLGNBQVU7QUFiRixHQURRO0FBZ0JsQkMsY0FBWTtBQUNWSCxVQUFNLEtB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OiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcbmltcG9ydCBfTW90aW9uRmVhdHVyZXMgZnJvbSAnLi9fTW90aW9uRmVhdHVyZXMnO1xuXG4vLyBtb3Rpb24taW5wdXQgaW5kaWNlcyA6XG4vLyAwLDEsMiAtPiBhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5XG4vLyAzLDQsNSAtPiBhY2NlbGVyYXRpb25cbi8vIDYsNyw4IC0+IHJvdGF0aW9uUmF0ZVxuXG4vLyBidXQsIGFzIHRoZXkgYXJlIHByZXByb2Nlc3NlZCBieSBwYXJlbnQgY2xhc3MsXG4vLyBpbmRpY2VzIGZvciBhY2MgKyBneXJvIGFyZSAwLCAxLCAyLCAzLCA0LCA1IChzZWUgYmVsb3cpXG5cbmNvbnN0IGRlZmluaXRpb25zID0ge1xuICBmZWF0dXJlczoge1xuICAgIHR5cGU6ICdhbnknLFxuICAgIGRlZmF1bHQ6IFtcbiAgICAgIC8vICdhY2NSYXcnLFxuICAgICAgLy8gJ2d5clJhdycsXG4gICAgICAnYWNjSW50ZW5zaXR5JyxcbiAgICAgICdneXJJbnRlbnNpdHknLFxuICAgICAgJ2ZyZWVmYWxsJyxcbiAgICAgICdraWNrJyxcbiAgICAgICdzaGFrZScsXG4gICAgICAnc3BpbicsXG4gICAgICAnc3RpbGwnLFxuICAgIF0sXG4gICAgY29uc3RhbnQ6IHRydWUsXG4gIH0sXG4gIGFjY0luZGljZXM6IHtcbiAgICB0eXBlOiAnYW55JyxcbiAgICBkZWZhdWx0OiBbMCwgMSwgMl0sXG4gICAgY29uc3RhbnQ6IHRydWUsXG4gIH0sXG4gIGd5ckluZGljZXM6IHtcbiAgICB0eXBlOiAnYW55JyxcbiAgICBkZWZhdWx0OiBbMywgNCwgNV0sXG4gICAgY29uc3RhbnQ6IHRydWUsXG4gIH0sXG4gIC8vIGNhbGxiYWNrOiB7XG4gIC8vICAgdHlwZTogJ2FueScsXG4gIC8vICAgZGVmYXVsdDogbnVsbCxcbiAgLy8gICBjb25zdGFudDogZmFsc2UsXG4gIC8vICAgbWV0YXM6IHsga2luZDogJ2R5bmFtaWMnIH0sXG4gIC8vIH1cbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZFxuICogQGlnbm9yZVxuICovXG5jbGFzcyBNb3Rpb25GZWF0dXJlcyBleHRlbmRzIEJhc2VMZm8ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihkZWZpbml0aW9ucywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9mZWF0dXJlcyA9IG5ldyBfTW90aW9uRmVhdHVyZXMoe1xuICAgICAgZmVhdHVyZXM6IHRoaXMucGFyYW1zLmdldCgnZmVhdHVyZXMnKSxcbiAgICAgIHNwaW5UaHJlc2g6IDAuNSwgLy8gb3JpZ2luYWwgOiAyMDBcbiAgICAgIHN0aWxsVGhyZXNoOiAyLCAvLyBvcmlnaW5hbCA6IDUwMDBcbiAgICAgIGFjY0ludGVuc2l0eVBhcmFtMTogMC44LFxuICAgICAgYWNjSW50ZW5zaXR5UGFyYW0yOiAwLjEsXG4gICAgfSk7XG4gICAgLy8gdGhpcy5fY2FsbGJhY2sgPSB0aGlzLnBhcmFtcy5nZXQoJ2NhbGxiYWNrJyk7XG5cbiAgICB0aGlzLl9mZWF0dXJlc0luZm8gPSB7XG4gICAgICAvLyBhY2NSYXc6IFsgJ3gnLCAneScsICd6JyBdLFxuICAgICAgLy8gZ3lyUmF3OiBbICd4JywgJ3knLCAneicgXSxcbiAgICAgIGFjY0ludGVuc2l0eTogWyAnbm9ybScsICd4JywgJ3knLCAneicgXSxcbiAgICAgIGd5ckludGVuc2l0eTogWyAnbm9ybScsICd4JywgJ3knLCAneicgXSxcbiAgICAgIGZyZWVmYWxsOiBbICdhY2NOb3JtJywgJ2ZhbGxpbmcnLCAnZHVyYXRpb24nIF0sXG4gICAgICBraWNrOiBbICdpbnRlbnNpdHknLCAna2lja2luZycgXSxcbiAgICAgIHNoYWtlOiBbICdzaGFraW5nJyBdLFxuICAgICAgc3BpbjogWyAnc3Bpbm5pbmcnLCAnZHVyYXRpb24nLCAnZ3lyTm9ybScgXSxcbiAgICAgIHN0aWxsOiBbICdzdGlsbCcsICdzbGlkZScgXSxcbiAgICAgIGd5clpjcjogWyAnYW1wbGl0dWRlJywgJ2ZyZXF1ZW5jeScsICdwZXJpb2RpY2l0eScgXSxcbiAgICAgIGFjY1pjcjogWyAnYW1wbGl0dWRlJywgJ2ZyZXF1ZW5jeScsICdwZXJpb2RpY2l0eScgXSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIG9uUGFyYW1VcGRhdGUobmFtZSwgdmFsdWUsIG1ldGFzKSB7XG4gICAgLy8gZG8gc29tZXRoaW5nID8gc2hvdWxkIG5vdCBoYXBwZW4gYXMgZXZlcnlib2R5IGlzIGNvbnN0YW50XG4gICAgLy8gZXhjZXB0IHRoZSBjYWxsYmFjayB3aGljaCBpcyBtYW5hZ2VkIGluIHRoZSBwcm9jZXNzVmVjdG9yIG1ldGhvZFxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgY29uc3QgZmVhdHVyZXMgPSB0aGlzLnBhcmFtcy5nZXQoJ2ZlYXR1cmVzJyk7XG5cbiAgICBsZXQgbGVuID0gMDtcbiAgICBmb3IgKGxldCBkIG9mIGZlYXR1cmVzKSB7XG4gICAgICBsZW4gKz0gdGhpcy5fZmVhdHVyZXNJbmZvW2RdLmxlbmd0aDtcbiAgICB9XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSBsZW47XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCBmZWF0dXJlcyA9IHRoaXMucGFyYW1zLmdldCgnZmVhdHVyZXMnKTtcbiAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMucGFyYW1zLmdldCgnY2FsbGJhY2snKTtcbiAgICBjb25zdCBpbkRhdGEgPSBmcmFtZS5kYXRhO1xuICAgIGNvbnN0IG91dERhdGEgPSB0aGlzLmZyYW1lLmRhdGE7XG4gICAgY29uc3QgYWNjSW5kaWNlcyA9IHRoaXMucGFyYW1zLmdldCgnYWNjSW5kaWNlcycpO1xuICAgIGNvbnN0IGd5ckluZGljZXMgPSB0aGlzLnBhcmFtcy5nZXQoJ2d5ckluZGljZXMnKTtcblxuICAgIHRoaXMuX2ZlYXR1cmVzLnNldEFjY2VsZXJvbWV0ZXIoXG4gICAgICBpbkRhdGFbYWNjSW5kaWNlc1swXV0sXG4gICAgICBpbkRhdGFbYWNjSW5kaWNlc1sxXV0sXG4gICAgICBpbkRhdGFbYWNjSW5kaWNlc1syXV1cbiAgICApO1xuXG4gICAgdGhpcy5fZmVhdHVyZXMuc2V0R3lyb3Njb3BlKFxuICAgICAgaW5EYXRhW2d5ckluZGljZXNbMF1dLFxuICAgICAgaW5EYXRhW2d5ckluZGljZXNbMV1dLFxuICAgICAgaW5EYXRhW2d5ckluZGljZXNbMl1dXG4gICAgKTtcblxuICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMuX2ZlYXR1cmVzLnVwZGF0ZSgpO1xuXG4gICAgbGV0IGkgPSAwO1xuXG4gICAgZm9yIChsZXQgZCBvZiBmZWF0dXJlcykge1xuICAgICAgY29uc3Qgc3ViRGVzYyA9IHRoaXMuX2ZlYXR1cmVzSW5mb1tkXTsgLy8gdGhlIGFycmF5IG9mIHRoZSBjdXJyZW50IGRlc2NyaXB0b3IncyBkaW1lbnNpb25zIG5hbWVzXG4gICAgICBjb25zdCBzdWJWYWx1ZXMgPSB2YWx1ZXNbZF07XG5cbiAgICAgIGZvciAobGV0IHN1YmQgb2Ygc3ViRGVzYykge1xuICAgICAgICBpZiAoc3ViZCA9PT0gJ2R1cmF0aW9uJyB8fCBzdWJkID09PSAnc2xpZGUnKSB7XG4gICAgICAgICAgc3ViVmFsdWVzW3N1YmRdID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIG91dERhdGFbaV0gPSBzdWJWYWx1ZXNbc3ViZF07IC8vIGhlcmUgd2UgZmlsbCB0aGUgb3V0cHV0IGZyYW1lIChkYXRhKVxuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgKGNhbGxiYWNrKSB7XG4gICAgLy8gICBjb25zdCBkZXNjID0gbmV3IEFycmF5KHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSk7XG4gICAgLy8gICBmb3IgKGxldCBqID0gMDsgaiA8IGRlc2MubGVuZ3RoOyBqKyspIHtcbiAgICAvLyAgICAgZGVzY1tqXSA9IG91dERhdGFbal07XG4gICAgLy8gICB9XG4gICAgLy8gICBjYWxsYmFjayhkZXNjKTtcbiAgICAvLyB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTW90aW9uRmVhdHVyZXM7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBPUklHSU5BTCBDTEFTUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cbiJdfQ==