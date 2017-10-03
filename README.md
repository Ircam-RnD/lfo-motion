# lfo-motion

> `lfo` modules dedicated to sensors capture, filtering and movement analysis
> _see [waves-lfo](https://github.com/wavesjs/waves-lfo)_

## Install

The final application must import the `lfo-motion` modules (aka the plugin) _and_ the `waves-lfo` library

```sh
npm install [--save --save-exact] waves-lfo
npm install [--save --save-exact] ircam-rnd/lfo-motion
```

## @TODOS

Split `MotionFeatures` into :
- src/operator/Freefall.js
- src/operator/Shake.js
- src/operator/Spin.js
- src/operator/Still.js

Already done for :
- src/operator/Intensity.js
- src/operator/Kick.js
