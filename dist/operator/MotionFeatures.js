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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk1vdGlvbkZlYXR1cmVzLmpzIl0sIm5hbWVzIjpbImRlZmluaXRpb25zIiwiZmVhdHVyZXMiLCJ0eXBlIiwiZGVmYXVsdCIsImNvbnN0YW50IiwiYWNjSW5kaWNlcyIsImd5ckluZGljZXMiLCJNb3Rpb25GZWF0dXJlcyIsIm9wdGlvbnMiLCJfZmVhdHVyZXMiLCJwYXJhbXMiLCJnZXQiLCJzcGluVGhyZXNoIiwic3RpbGxUaHJlc2giLCJhY2NJbnRlbnNpdHlQYXJhbTEiLCJhY2NJbnRlbnNpdHlQYXJhbTIiLCJfZmVhdHVyZXNJbmZvIiwiYWNjSW50ZW5zaXR5IiwiZ3lySW50ZW5zaXR5IiwiZnJlZWZhbGwiLCJraWNrIiwic2hha2UiLCJzcGluIiwic3RpbGwiLCJneXJaY3IiLCJhY2NaY3IiLCJuYW1lIiwidmFsdWUiLCJtZXRhcyIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwibGVuIiwiZCIsImxlbmd0aCIsInN0cmVhbVBhcmFtcyIsImZyYW1lU2l6ZSIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsImZyYW1lIiwiY2FsbGJhY2siLCJpbkRhdGEiLCJkYXRhIiwib3V0RGF0YSIsInNldEFjY2VsZXJvbWV0ZXIiLCJzZXRHeXJvc2NvcGUiLCJ2YWx1ZXMiLCJ1cGRhdGUiLCJpIiwic3ViRGVzYyIsInN1YlZhbHVlcyIsInN1YmQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLElBQU1BLGNBQWM7QUFDbEJDLFlBQVU7QUFDUkMsVUFBTSxLQURFO0FBRVJDLGFBQVM7QUFDUDtBQUNBO0FBQ0Esa0JBSE8sRUFJUCxjQUpPLEVBS1AsVUFMTyxFQU1QLE1BTk8sRUFPUCxPQVBPLEVBUVAsTUFSTyxFQVNQLE9BVE8sQ0FGRDtBQWFSQyxjQUFVO0FBYkYsR0FEUTtBQWdCbEJDLGNBQVk7QUFDVkgsVUFB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InNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VMZm8gfSBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5pbXBvcnQgX01vdGlvbkZlYXR1cmVzIGZyb20gJy4vX01vdGlvbkZlYXR1cmVzJztcblxuLy8gbW90aW9uLWlucHV0IGluZGljZXMgOlxuLy8gMCwxLDIgLT4gYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eVxuLy8gMyw0LDUgLT4gYWNjZWxlcmF0aW9uXG4vLyA2LDcsOCAtPiByb3RhdGlvblJhdGVcblxuLy8gYnV0LCBhcyB0aGV5IGFyZSBwcmVwcm9jZXNzZWQgYnkgcGFyZW50IGNsYXNzLFxuLy8gaW5kaWNlcyBmb3IgYWNjICsgZ3lybyBhcmUgMCwgMSwgMiwgMywgNCwgNSAoc2VlIGJlbG93KVxuXG5jb25zdCBkZWZpbml0aW9ucyA9IHtcbiAgZmVhdHVyZXM6IHtcbiAgICB0eXBlOiAnYW55JyxcbiAgICBkZWZhdWx0OiBbXG4gICAgICAvLyAnYWNjUmF3JyxcbiAgICAgIC8vICdneXJSYXcnLFxuICAgICAgJ2FjY0ludGVuc2l0eScsXG4gICAgICAnZ3lySW50ZW5zaXR5JyxcbiAgICAgICdmcmVlZmFsbCcsXG4gICAgICAna2ljaycsXG4gICAgICAnc2hha2UnLFxuICAgICAgJ3NwaW4nLFxuICAgICAgJ3N0aWxsJyxcbiAgICBdLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICB9LFxuICBhY2NJbmRpY2VzOiB7XG4gICAgdHlwZTogJ2FueScsXG4gICAgZGVmYXVsdDogWzAsIDEsIDJdLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICB9LFxuICBneXJJbmRpY2VzOiB7XG4gICAgdHlwZTogJ2FueScsXG4gICAgZGVmYXVsdDogWzMsIDQsIDVdLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICB9LFxuICAvLyBjYWxsYmFjazoge1xuICAvLyAgIHR5cGU6ICdhbnknLFxuICAvLyAgIGRlZmF1bHQ6IG51bGwsXG4gIC8vICAgY29uc3RhbnQ6IGZhbHNlLFxuICAvLyAgIG1ldGFzOiB7IGtpbmQ6ICdkeW5hbWljJyB9LFxuICAvLyB9XG59XG5cbmNsYXNzIE1vdGlvbkZlYXR1cmVzIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2ZlYXR1cmVzID0gbmV3IF9Nb3Rpb25GZWF0dXJlcyh7XG4gICAgICBmZWF0dXJlczogdGhpcy5wYXJhbXMuZ2V0KCdmZWF0dXJlcycpLFxuICAgICAgc3BpblRocmVzaDogMC41LCAvLyBvcmlnaW5hbCA6IDIwMFxuICAgICAgc3RpbGxUaHJlc2g6IDIsIC8vIG9yaWdpbmFsIDogNTAwMFxuICAgICAgYWNjSW50ZW5zaXR5UGFyYW0xOiAwLjgsXG4gICAgICBhY2NJbnRlbnNpdHlQYXJhbTI6IDAuMSxcbiAgICB9KTtcbiAgICAvLyB0aGlzLl9jYWxsYmFjayA9IHRoaXMucGFyYW1zLmdldCgnY2FsbGJhY2snKTtcblxuICAgIHRoaXMuX2ZlYXR1cmVzSW5mbyA9IHtcbiAgICAgIC8vIGFjY1JhdzogWyAneCcsICd5JywgJ3onIF0sXG4gICAgICAvLyBneXJSYXc6IFsgJ3gnLCAneScsICd6JyBdLFxuICAgICAgYWNjSW50ZW5zaXR5OiBbICdub3JtJywgJ3gnLCAneScsICd6JyBdLFxuICAgICAgZ3lySW50ZW5zaXR5OiBbICdub3JtJywgJ3gnLCAneScsICd6JyBdLFxuICAgICAgZnJlZWZhbGw6IFsgJ2FjY05vcm0nLCAnZmFsbGluZycsICdkdXJhdGlvbicgXSxcbiAgICAgIGtpY2s6IFsgJ2ludGVuc2l0eScsICdraWNraW5nJyBdLFxuICAgICAgc2hha2U6IFsgJ3NoYWtpbmcnIF0sXG4gICAgICBzcGluOiBbICdzcGlubmluZycsICdkdXJhdGlvbicsICdneXJOb3JtJyBdLFxuICAgICAgc3RpbGw6IFsgJ3N0aWxsJywgJ3NsaWRlJyBdLFxuICAgICAgZ3lyWmNyOiBbICdhbXBsaXR1ZGUnLCAnZnJlcXVlbmN5JywgJ3BlcmlvZGljaXR5JyBdLFxuICAgICAgYWNjWmNyOiBbICdhbXBsaXR1ZGUnLCAnZnJlcXVlbmN5JywgJ3BlcmlvZGljaXR5JyBdLFxuICAgIH07XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgb25QYXJhbVVwZGF0ZShuYW1lLCB2YWx1ZSwgbWV0YXMpIHtcbiAgICAvLyBkbyBzb21ldGhpbmcgPyBzaG91bGQgbm90IGhhcHBlbiBhcyBldmVyeWJvZHkgaXMgY29uc3RhbnRcbiAgICAvLyBleGNlcHQgdGhlIGNhbGxiYWNrIHdoaWNoIGlzIG1hbmFnZWQgaW4gdGhlIHByb2Nlc3NWZWN0b3IgbWV0aG9kXG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zID0ge30pIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICBjb25zdCBmZWF0dXJlcyA9IHRoaXMucGFyYW1zLmdldCgnZmVhdHVyZXMnKTtcblxuICAgIGxldCBsZW4gPSAwO1xuICAgIGZvciAobGV0IGQgb2YgZmVhdHVyZXMpIHtcbiAgICAgIGxlbiArPSB0aGlzLl9mZWF0dXJlc0luZm9bZF0ubGVuZ3RoO1xuICAgIH1cblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IGxlbjtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gdGhpcy5wYXJhbXMuZ2V0KCdmZWF0dXJlcycpO1xuICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5wYXJhbXMuZ2V0KCdjYWxsYmFjaycpO1xuICAgIGNvbnN0IGluRGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0RGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcbiAgICBjb25zdCBhY2NJbmRpY2VzID0gdGhpcy5wYXJhbXMuZ2V0KCdhY2NJbmRpY2VzJyk7XG4gICAgY29uc3QgZ3lySW5kaWNlcyA9IHRoaXMucGFyYW1zLmdldCgnZ3lySW5kaWNlcycpO1xuXG4gICAgdGhpcy5fZmVhdHVyZXMuc2V0QWNjZWxlcm9tZXRlcihcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzBdXSxcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzFdXSxcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzJdXVxuICAgICk7XG5cbiAgICB0aGlzLl9mZWF0dXJlcy5zZXRHeXJvc2NvcGUoXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1swXV0sXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1sxXV0sXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1syXV1cbiAgICApO1xuXG4gICAgY29uc3QgdmFsdWVzID0gdGhpcy5fZmVhdHVyZXMudXBkYXRlKCk7XG5cbiAgICBsZXQgaSA9IDA7XG5cbiAgICBmb3IgKGxldCBkIG9mIGZlYXR1cmVzKSB7XG4gICAgICBjb25zdCBzdWJEZXNjID0gdGhpcy5fZmVhdHVyZXNJbmZvW2RdOyAvLyB0aGUgYXJyYXkgb2YgdGhlIGN1cnJlbnQgZGVzY3JpcHRvcidzIGRpbWVuc2lvbnMgbmFtZXNcbiAgICAgIGNvbnN0IHN1YlZhbHVlcyA9IHZhbHVlc1tkXTtcblxuICAgICAgZm9yIChsZXQgc3ViZCBvZiBzdWJEZXNjKSB7XG4gICAgICAgIGlmIChzdWJkID09PSAnZHVyYXRpb24nIHx8IHN1YmQgPT09ICdzbGlkZScpIHtcbiAgICAgICAgICBzdWJWYWx1ZXNbc3ViZF0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgb3V0RGF0YVtpXSA9IHN1YlZhbHVlc1tzdWJkXTsgLy8gaGVyZSB3ZSBmaWxsIHRoZSBvdXRwdXQgZnJhbWUgKGRhdGEpXG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiAoY2FsbGJhY2spIHtcbiAgICAvLyAgIGNvbnN0IGRlc2MgPSBuZXcgQXJyYXkodGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplKTtcbiAgICAvLyAgIGZvciAobGV0IGogPSAwOyBqIDwgZGVzYy5sZW5ndGg7IGorKykge1xuICAgIC8vICAgICBkZXNjW2pdID0gb3V0RGF0YVtqXTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIGNhbGxiYWNrKGRlc2MpO1xuICAgIC8vIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNb3Rpb25GZWF0dXJlcztcbiJdfQ==