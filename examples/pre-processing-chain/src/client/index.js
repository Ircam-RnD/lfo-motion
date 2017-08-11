import * as lfo from 'waves-lfo/client';
import * as controllers from 'basic-controllers';
import Orientation from '../../../../dist/operator/Orientation';
import Sampler from '../../../../dist/operator/Sampler';
// import MotionFeatures from '../../../../dist/operator/MotionFeatures';

/**
 * -----------------------------------------------------
 * lfo chain
 * -----------------------------------------------------
 */

/**
 * from Phone (motion-input):
 *
 * 0 - acc x
 * 1 - acc y
 * 2 - acc z
 * 5 - yaw
 * 4 - pitch
 * 3 - roll
 */
const socketReceive = new lfo.source.SocketReceive({ port: 5010 });
socketReceive.processStreamParams({
  frameType: 'vector',
  frameSize: 6,
  frameRate: 0,
});

const sampler = new Sampler({ frameRate: 50 });
const logger = new lfo.sink.Logger({ time: false, data: true });


const defaultK = 0.84;
const orientation = new Orientation({ k: defaultK });

// display
// ---------------------------------------------

const muteDisplayFactors = [1, 1, 1]; // [1, 0, 1] would be only filter output and raw gyros
const bpfColors = ['blue', 'green', 'orange'];
const canvasIds = [
  '#raw-x-display',
  '#raw-y-display',
  '#raw-z-display',
  '#resampled-x-display',
  '#resampled-y-display',
  '#resampled-z-display',
  '#filtered-x-display',
  '#filtered-y-display',
  '#filtered-z-display',
];

const displayDefaults = {
  min: -1,
  max: 1,
  duration: 5,
  width: 300,
  height: 150,
};

socketReceive.connect(sampler);
sampler.connect(orientation);

//  Raw values
// ---------------------------------------------

// loop through x, y, z
for (let i = 0; i < 3; i++) {
  const remapGyros = new lfo.operator.Select({ indexes: [0, 1, 2, 4, 5, 3] });
  const displayScaler = new lfo.operator.Scaler({
    factor: [
      1 / 9.81,
      1 / 9.81,
      1 / 9.81,
      1 / 360,
      1 / 360,
      1 / 360,
    ]
  });
  const select = new lfo.operator.Select({ indexes: [i, i + 3]})
  const muteDisplay = new lfo.operator.Scaler({ factor: muteDisplayFactors });
  const display = new lfo.sink.BpfDisplay(Object.assign(displayDefaults, {
    canvas: canvasIds[i],
    colors: bpfColors,
  }));

  socketReceive.connect(remapGyros);
  remapGyros.connect(displayScaler);
  displayScaler.connect(select);

  select.connect(muteDisplay);
  muteDisplay.connect(display);
}

//  Resampled values
// ---------------------------------------------

// loop through x, y, z
for (let i = 0; i < 3; i++) {
  const remapGyros = new lfo.operator.Select({ indexes: [0, 1, 2, 4, 5, 3] });
  const displayScaler = new lfo.operator.Scaler({
    factor: [
      1 / 9.81,
      1 / 9.81,
      1 / 9.81,
      1 / 360,
      1 / 360,
      1 / 360,
    ]
  });
  const select = new lfo.operator.Select({ indexes: [i, i + 3]})
  const muteDisplay = new lfo.operator.Scaler({ factor: muteDisplayFactors });
  const display = new lfo.sink.BpfDisplay(Object.assign(displayDefaults, {
    canvas: canvasIds[i + 3],
    colors: bpfColors,
  }));

  sampler.connect(remapGyros);
  remapGyros.connect(displayScaler);
  displayScaler.connect(select);

  select.connect(muteDisplay);
  muteDisplay.connect(display);
}

//  Resampled values
// ---------------------------------------------

// loop through x, y, z
for (let i = 0; i < 3; i++) {
  const select = new lfo.operator.Select({ indexes: [i]})
  const muteDisplay = new lfo.operator.Scaler({ factor: muteDisplayFactors });
  const display = new lfo.sink.BpfDisplay(Object.assign(displayDefaults, {
    canvas: canvasIds[i + 6],
    colors: bpfColors,
  }));

  orientation.connect(select);
  select.connect(muteDisplay);
  muteDisplay.connect(display);
}

/**
 * -----------------------------------------------------
 * controllers
 * -----------------------------------------------------
 */

const kslider = new controllers.Slider({
  label: 'orientation k factor',
  min: 0,
  max: 1,
  step: 0.01,
  default: defaultK,
  size: 'large',
  container: '#controls',
  callback: value => orientation.params.set('k', value),
});




