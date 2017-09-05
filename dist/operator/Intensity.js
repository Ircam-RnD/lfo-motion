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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var definitions = {
  param1: {
    type: 'float',
    default: 0.9
  },
  param2: {
    type: 'float',
    default: 0.1
  }
};

var Intensity = function (_BaseLfo) {
  (0, _inherits3.default)(Intensity, _BaseLfo);

  function Intensity() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Intensity);
    return (0, _possibleConstructorReturn3.default)(this, (Intensity.__proto__ || (0, _getPrototypeOf2.default)(Intensity)).call(this, definitions, options));
  }

  /** @private */


  (0, _createClass3.default)(Intensity, [{
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
  }, {
    key: 'processVector',
    value: function processVector(frame) {
      //this._norm = this._magnitude3D(this.acc);
      this._norm = 0;
      for (var i in frame) {
        this._norm += frame[i] * frame[i];
      }
      this._norm = Math.sqrt(this._norm);

      this._intensityNorm = 0;

      for (var _i = 0; _i < 3; _i++) {
        this._accLast[_i][this._loopIndex % 3] = this.acc[_i];

        this._accIntensity[_i] = this._intensity1D(this.acc[_i], this._accLast[_i][(this._loopIndex + 1) % 3], this._accIntensityLast[_i][(this._loopIndex + 1) % 2], this._params.accIntensityParam1, this._params.accIntensityParam2, 1);

        this._accIntensityLast[_i][this._loopIndex % 2] = this._accIntensity[_i];

        this._accIntensityNorm += this._accIntensity[_i];
      }

      res.accIntensity = {
        norm: this._accIntensityNorm,
        x: this._accIntensity[0],
        y: this._accIntensity[1],
        z: this._accIntensity[2]
      };
    }

    //==========================================================================//
    //================================ UTILITIES ===============================//
    //==========================================================================//
    /** @private */

  }, {
    key: '_delta',
    value: function _delta(prev, next, dt) {
      return (next - prev) / (2 * dt);
    }

    /** @private */

  }, {
    key: '_intensity1D',
    value: function _intensity1D(nextX, prevX, prevIntensity, param1, param2, dt) {
      var dx = this._delta(nextX, prevX, dt); //(nextX - prevX) / (2 * dt);
      return param2 * dx * dx + param1 * prevIntensity;
    }

    /** @private */

  }, {
    key: '_magnitude3D',
    value: function _magnitude3D(xyzArray) {
      return Math.sqrt(xyzArray[0] * xyzArray[0] + xyzArray[1] * xyzArray[1] + xyzArray[2] * xyzArray[2]);
    }

    /** @private */

  }, {
    key: '_lcm',
    value: function _lcm(a, b) {
      var a1 = a,
          b1 = b;

      while (a1 != b1) {
        if (a1 < b1) {
          a1 += a;
        } else {
          b1 += b;
        }
      }

      return a1;
    }

    /** @private */

  }, {
    key: '_slide',
    value: function _slide(prevSlide, currentVal, slideFactor) {
      return prevSlide + (currentVal - prevSlide) / slideFactor;
    }

    /** @private */

  }, {
    key: '_stillCrossProduct',
    value: function _stillCrossProduct(xyzArray) {
      return (xyzArray[1] - xyzArray[2]) * (xyzArray[1] - xyzArray[2]) + (xyzArray[0] - xyzArray[1]) * (xyzArray[0] - xyzArray[1]) + (xyzArray[2] - xyzArray[0]) * (xyzArray[2] - xyzArray[0]);
    }
  }]);
  return Intensity;
}(_core.BaseLfo);

;

exports.default = Intensity;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJwYXJhbTEiLCJ0eXBlIiwiZGVmYXVsdCIsInBhcmFtMiIsIkludGVuc2l0eSIsIm9wdGlvbnMiLCJuYW1lIiwidmFsdWUiLCJtZXRhcyIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwiZmVhdHVyZXMiLCJwYXJhbXMiLCJnZXQiLCJsZW4iLCJkIiwiX2ZlYXR1cmVzSW5mbyIsImxlbmd0aCIsInN0cmVhbVBhcmFtcyIsImZyYW1lU2l6ZSIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsImZyYW1lIiwiX25vcm0iLCJpIiwiTWF0aCIsInNxcnQiLCJfaW50ZW5zaXR5Tm9ybSIsIl9hY2NMYXN0IiwiX2xvb3BJbmRleCIsImFjYyIsIl9hY2NJbnRlbnNpdHkiLCJfaW50ZW5zaXR5MUQiLCJfYWNjSW50ZW5zaXR5TGFzdCIsIl9wYXJhbXMiLCJhY2NJbnRlbnNpdHlQYXJhbTEiLCJhY2NJbnRlbnNpdHlQYXJhbTIiLCJfYWNjSW50ZW5zaXR5Tm9ybSIsInJlcyIsImFjY0ludGVuc2l0eSIsIm5vcm0iLCJ4IiwieSIsInoiLCJwcmV2IiwibmV4dCIsImR0IiwibmV4dFgiLCJwcmV2WCIsInByZXZJbnRlbnNpdHkiLCJkeCIsIl9kZWx0YSIsInh5ekFycmF5IiwiYSIsImIiLCJhMSIsImIxIiwicHJldlNsaWRlIiwiY3VycmVudFZhbCIsInNsaWRlRmFjdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUVBLElBQU1BLGNBQWM7QUFDbEJDLFVBQVE7QUFDTkMsVUFBTSxPQURBO0FBRU5DLGFBQVM7QUFGSCxHQURVO0FBS2xCQyxVQUFRO0FBQ05GLFVBQU0sT0FEQTtBQUVOQyxhQUFTO0FBRkg7QUFMVSxDQUFwQjs7SUFXTUUsUzs7O0FBQ0osdUJBQTBCO0FBQUEsUUFBZEMsT0FBYyx1RUFBSixFQUFJO0FBQUE7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IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcblxuY29uc3QgZGVmaW5pdGlvbnMgPSB7XG4gIHBhcmFtMToge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC45LFxuICB9LFxuICBwYXJhbTI6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIGRlZmF1bHQ6IDAuMSxcbiAgfVxufVxuXG5jbGFzcyBJbnRlbnNpdHkgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoZGVmaW5pdGlvbnMsIG9wdGlvbnMpOyAgICBcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBvblBhcmFtVXBkYXRlKG5hbWUsIHZhbHVlLCBtZXRhcykge1xuICAgIC8vIGRvIHNvbWV0aGluZyA/IHNob3VsZCBub3QgaGFwcGVuIGFzIGV2ZXJ5Ym9keSBpcyBjb25zdGFudFxuICAgIC8vIGV4Y2VwdCB0aGUgY2FsbGJhY2sgd2hpY2ggaXMgbWFuYWdlZCBpbiB0aGUgcHJvY2Vzc1ZlY3RvciBtZXRob2RcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMgPSB7fSkge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIGNvbnN0IGZlYXR1cmVzID0gdGhpcy5wYXJhbXMuZ2V0KCdmZWF0dXJlcycpO1xuXG4gICAgbGV0IGxlbiA9IDA7XG4gICAgZm9yIChsZXQgZCBvZiBmZWF0dXJlcykge1xuICAgICAgbGVuICs9IHRoaXMuX2ZlYXR1cmVzSW5mb1tkXS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gbGVuO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICAvL3RoaXMuX25vcm0gPSB0aGlzLl9tYWduaXR1ZGUzRCh0aGlzLmFjYyk7XG4gICAgdGhpcy5fbm9ybSA9IDA7XG4gICAgZm9yIChsZXQgaSBpbiBmcmFtZSkge1xuICAgICAgdGhpcy5fbm9ybSArPSBmcmFtZVtpXSAqIGZyYW1lW2ldO1xuICAgIH1cbiAgICB0aGlzLl9ub3JtID0gTWF0aC5zcXJ0KHRoaXMuX25vcm0pO1xuXG4gICAgdGhpcy5faW50ZW5zaXR5Tm9ybSA9IDA7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgdGhpcy5fYWNjTGFzdFtpXVt0aGlzLl9sb29wSW5kZXggJSAzXSA9IHRoaXMuYWNjW2ldO1xuXG4gICAgICB0aGlzLl9hY2NJbnRlbnNpdHlbaV0gPSB0aGlzLl9pbnRlbnNpdHkxRChcbiAgICAgICAgdGhpcy5hY2NbaV0sXG4gICAgICAgIHRoaXMuX2FjY0xhc3RbaV1bKHRoaXMuX2xvb3BJbmRleCArIDEpICUgM10sXG4gICAgICAgIHRoaXMuX2FjY0ludGVuc2l0eUxhc3RbaV1bKHRoaXMuX2xvb3BJbmRleCArIDEpICUgMl0sXG4gICAgICAgIHRoaXMuX3BhcmFtcy5hY2NJbnRlbnNpdHlQYXJhbTEsXG4gICAgICAgIHRoaXMuX3BhcmFtcy5hY2NJbnRlbnNpdHlQYXJhbTIsXG4gICAgICAgIDFcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuX2FjY0ludGVuc2l0eUxhc3RbaV1bdGhpcy5fbG9vcEluZGV4ICUgMl0gPSB0aGlzLl9hY2NJbnRlbnNpdHlbaV07XG5cbiAgICAgIHRoaXMuX2FjY0ludGVuc2l0eU5vcm0gKz0gdGhpcy5fYWNjSW50ZW5zaXR5W2ldO1xuICAgIH1cblxuICAgIHJlcy5hY2NJbnRlbnNpdHkgPSB7XG4gICAgICBub3JtOiB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtLFxuICAgICAgeDogdGhpcy5fYWNjSW50ZW5zaXR5WzBdLFxuICAgICAgeTogdGhpcy5fYWNjSW50ZW5zaXR5WzFdLFxuICAgICAgejogdGhpcy5fYWNjSW50ZW5zaXR5WzJdXG4gICAgfTtcbiAgfSAgXG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gVVRJTElUSUVTID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cbiAgLyoqIEBwcml2YXRlICovXG4gIF9kZWx0YShwcmV2LCBuZXh0LCBkdCkge1xuICAgIHJldHVybiAobmV4dCAtIHByZXYpIC8gKDIgKiBkdCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2ludGVuc2l0eTFEKG5leHRYLCBwcmV2WCwgcHJldkludGVuc2l0eSwgcGFyYW0xLCBwYXJhbTIsIGR0KSB7XG4gICAgY29uc3QgZHggPSB0aGlzLl9kZWx0YShuZXh0WCwgcHJldlgsIGR0KTsvLyhuZXh0WCAtIHByZXZYKSAvICgyICogZHQpO1xuICAgIHJldHVybiBwYXJhbTIgKiBkeCAqIGR4ICsgcGFyYW0xICogcHJldkludGVuc2l0eTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfbWFnbml0dWRlM0QoeHl6QXJyYXkpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHh5ekFycmF5WzBdICogeHl6QXJyYXlbMF0gKyBcbiAgICAgICAgICAgICAgICAgICAgIHh5ekFycmF5WzFdICogeHl6QXJyYXlbMV0gK1xuICAgICAgICAgICAgICAgICAgICAgeHl6QXJyYXlbMl0gKiB4eXpBcnJheVsyXSk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2xjbShhLCBiKSB7XG4gICAgbGV0IGExID0gYSwgYjEgPSBiO1xuXG4gICAgd2hpbGUgKGExICE9IGIxKSB7XG4gICAgICBpZiAoYTEgPCBiMSkge1xuICAgICAgICBhMSArPSBhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYjEgKz0gYjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYTE7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3NsaWRlKHByZXZTbGlkZSwgY3VycmVudFZhbCwgc2xpZGVGYWN0b3IpIHtcbiAgICByZXR1cm4gcHJldlNsaWRlICsgKGN1cnJlbnRWYWwgLSBwcmV2U2xpZGUpIC8gc2xpZGVGYWN0b3I7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3N0aWxsQ3Jvc3NQcm9kdWN0KHh5ekFycmF5KSB7XG4gICAgcmV0dXJuICh4eXpBcnJheVsxXSAtIHh5ekFycmF5WzJdKSAqICh4eXpBcnJheVsxXSAtIHh5ekFycmF5WzJdKSArXG4gICAgICAgICAgICh4eXpBcnJheVswXSAtIHh5ekFycmF5WzFdKSAqICh4eXpBcnJheVswXSAtIHh5ekFycmF5WzFdKSArXG4gICAgICAgICAgICh4eXpBcnJheVsyXSAtIHh5ekFycmF5WzBdKSAqICh4eXpBcnJheVsyXSAtIHh5ekFycmF5WzBdKTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgSW50ZW5zaXR5OyJdfQ==