# xmm-lfo

### `waves-lfo` wrappers of `xmm-client` classes

See [waves-lfo](https://github.com/wavesjs/waves-lfo) from the wavesjs library
and [xmm-client](https://github.com/Ircam-RnD/xmm-client).

#### installation :

`npm install [--save] wavesjs/waves-lfo`  

The application consuming the `xmm-lfo` module (aka plugin) must also import the `waves-lfo` library

`npm install [--save] wavesjs/waves-lfo`

#### es6 example :

```js
import * as lfo from 'waves-lfo/client';
import { PhraseRecorderLfo, HhmmRecorderLfo } from 'xmm-lfo';

const eventIn = new lfo.source.EventIn({
  frameSize: 6,
  frameType: 'vector',
  frameRate: 0,
});

const xmmRecorder = new PhraseRecorderLfo({
  columnNames: [
    'accelX', 'accelY', 'accelZ',
    'rotAlpha', 'rotBeta', 'rotGamma'
  ],
});

const hhmmDecoder = new HhmmDecoderLfo({
  likelihoodWindow: 3
});

eventIn.connect(xmmRecorder);
eventIn.connect(hhmmDecoder);

if (window.DeviceMotionEvent) {
  window.addEventListener('devicemotion', function(e) {
    eventIn.process(Date.now(), [
      e.acceleration.x, e.acceleration.y, e.acceleration.z,
      e.rotationRate.alpha, e.rotationRate.beta, e.rotationRate.gamma
    ]);
  });
}

eventIn.start();

// to start / stop recording :
xmmRecorder.start();
xmmRecorder.stop();

// when stop() is called, a promise updates the internal phrase that can
// be obtained by calling getRecordedPhrase() :
let phrase = xmmRecorder.getRecordedPhrase();

// once a model has been trained by xmm-node from the recorded phrases, it can
// be passed to the decoder like this :
hhmmDecoder.params.set('model', someModelFromXmmLibrary);
```

#### credits :

This library has been developed by the ISMM team at IRCAM, within the context of the RAPID-MIX project, funded by the European Union’s Horizon 2020 research and innovation programme.  
Original XMM code authored by Jules Françoise, ported to JS and wrapped into LFO operators by Joseph Larralde.  
See [waves-lfo](https://github.com/wavejs/waves-lfo) and [XMM](https://github.com/Ircam-RnD/xmm) for detailed credits.
