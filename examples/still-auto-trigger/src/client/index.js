import * as lfo from '../../../../node_modules/waves-lfo/client';
import * as controllers from 'basic-controllers';
import * as lfoMotion from '../../../../dist';

/**
 * from Phone (motion-input):
 *
 * 0 - acc x
 * 1 - acc y
 * 2 - acc z
 * 3 - yaw      => deg / s
 * 4 - pitch
 * 6 - roll
 */
const socketReceive = new lfo.source.SocketReceive({ port: 5010 });
socketReceive.processStreamParams({
  frameType: 'vector',
  frameSize: 6,
  frameRate: 0,
});

const intensity = new lfoMotion.operator.Intensity({
  feedback: 0.7,
  gain: 0.07,
});

const select = new lfo.operator.Select({ index: 0 });
const multiplier = new lfo.operator.Multiplier({ factor: 100 });

const logger = new lfo.sink.Logger({ time: false, data: true });

const stillAutoTrigger = new lfoMotion.operator.StillAutoTrigger({
  onThreshold: 0.5,
  offThreshold: 0.01,
  offDelay: 500,
});

const triggerBridge = new lfo.sink.Bridge({
  processFrame: frame => displayTriggerOutput(frame),
});

socketReceive.connect(intensity);
intensity.connect(select);
select.connect(multiplier);
// multiplier.connect(logger);
multiplier.connect(stillAutoTrigger);
stillAutoTrigger.connect(triggerBridge);

const body = document.querySelector('body');
const info = document.querySelector('#info');

const displayTriggerOutput = frame => {
  if (frame.data[0] === 1) {
    body.classList.add('active');
    info.innerHTML = `1 (date : ${frame.time})`;
  } else {
    body.classList.remove('active');
    info.innerHTML = `0 (date : ${frame.time})`;
  }
};

// ---------------------------------------------------------------
// CONTROLS
// ---------------------------------------------------------------

const onThresholdSlider = new controllers.NumberBox({
  label: 'on threshold',
  active: true,
  min: 0,
  max: 1,
  step: 0.01,
  default: 0.5,
  container: '#controls',
  callback: value => stillAutoTrigger.params.set('onThreshold', value),
});

const offThresholdSlider = new controllers.NumberBox({
  label: 'off threshold',
  active: true,
  min: 0,
  max: 1,
  step: 0.01,
  default: 0.01,
  container: '#controls',
  callback: value => stillAutoTrigger.params.set('offThreshold', value),
});

const offDelaySlider = new controllers.NumberBox({
  label: 'off delay',
  active: true,
  min: 0,
  max: 5000,
  step: 0.01,
  default: 500,
  container: '#controls',
  callback: value => stillAutoTrigger.params.set('offDelay', value),
});
