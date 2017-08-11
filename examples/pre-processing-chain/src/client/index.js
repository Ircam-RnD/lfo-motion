import * as lfo from 'waves-lfo/client';
import * as controllers from 'basic-controllers';
import * as THREE from 'three';
import ComplementaryFilter from './lib/ComplementaryFilter';
import OrientationFilter from './lib/OrientationFilter';

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
const phoneReceive = new lfo.source.SocketReceive({ port: 5010 });
phoneReceive.processStreamParams({
  frameType: 'vector',
  frameSize: 6,
  frameRate: 0,
});

/**
 * from R-ioT:
 *
 * 0 - filter x
 * 1 - filter y
 * 2 - filter z
 * 3 - acc x
 * 4 - acc y
 * 5 - acc z
 * 6 - roll
 * 7 - pitch
 * 8 - yaw
 */
const riotReceive = new lfo.source.SocketReceive({ port: 5011 });
riotReceive.processStreamParams({
  frameType: 'vector',
  frameSize: 9,
  frameRate: 0,
});

/**
 * mapping from phone to R-ioT:
 *
 * 0 - filter x * 1
 * 1 - filter y * 1
 * 2 - filter z * 1
 * 3 - acc x * - 1 / 9.81
 * 4 - acc y * 1 / 9.81
 * 5 - acc z * - 1 / 9.81
 * 8 - roll * -1
 * 7 - pitch * -1
 * 6 - yaw * -1
 */
const defaultK = 0.84;
const filter = new OrientationFilter({ k: defaultK });

// process input for coherent rendering with R-ioT data
// must reflect what is done in the filter
const reMapper = new lfo.operator.Select({
  indexes: [
    0,
    1,
    2,
    5,
    4, // switch 5 and 3
    3,
  ],
});

const inputScaler = new lfo.operator.Scaler({
  factor: [
    -1 / 9.81,
     1 / 9.81,
    -1 / 9.81,
    -1 / 360,
    -1 / 360,
    -1 / 360,
  ]
});

// map display
const muteDisplayFactors = [1, 1, 1]; // [1, 0, 1] would be only filter output and raw gyros
const bpfColors = ['blue', 'green', 'orange'];
const canvasIds = [
  '#x-display',
  '#y-display',
  '#z-display',
  '#riot-x-display',
  '#riot-y-display',
  '#riot-z-display',
];

const displayDefaults = {
  min: -1,
  max: 1,
  duration: 5,
  width: 300,
  height: 150,
};

// common part of the graph
phoneReceive.connect(filter);
phoneReceive.connect(reMapper);
reMapper.connect(inputScaler);

const logger = new lfo.sink.Logger({
  time: false,
  data: true,
});

/** Phone
  * ----------------------------------------------------- */

// loop through x, y, z
for (let i = 0; i < 3; i++) {
  const filterSelect = new lfo.operator.Select({ index: i });
  // pick `acc` and `gyro` (cf. reMapper)
  const selectRawInput = new lfo.operator.Select({ indexes: [i, i + 3] });

  const merger = new lfo.operator.Merger({ frameSizes: [1, 2] });
  const muteDisplay = new lfo.operator.Scaler({ factor: muteDisplayFactors });
  const display = new lfo.sink.BpfDisplay(Object.assign(displayDefaults, {
    canvas: canvasIds[i],
    colors: bpfColors,
  }));

  filter.connect(filterSelect);
  filterSelect.connect(merger);

  inputScaler.connect(selectRawInput);
  selectRawInput.connect(merger);

  merger.connect(muteDisplay);
  muteDisplay.connect(display);
}

/** R-ioT
  * ----------------------------------------------------- */

// loop through x, y, z
for (let i = 0; i < 3; i++) {
  const select = new lfo.operator.Select({ indexes: [i, i + 3, i + 6] });
  const muteDisplay = new lfo.operator.Scaler({ factor: muteDisplayFactors });
    const display = new lfo.sink.BpfDisplay(Object.assign(displayDefaults, {
    canvas: canvasIds[i + 3],
    colors: bpfColors,
  }));

  riotReceive.connect(select);
  select.connect(muteDisplay);
  muteDisplay.connect(display);
}

/**
 * -----------------------------------------------------
 * controllers
 * -----------------------------------------------------
 */

const selectFilter = new controllers.Toggle({
  label: 'display filter',
  active: true,
  container: '#controls',
  callback: value => muteDisplayFactors[0] = value + 0,
});

const selectAcc = new controllers.Toggle({
  label: 'display acc',
  active: true,
  container: '#controls',
  callback: value => muteDisplayFactors[1] = value + 0,
});

const selectGyro = new controllers.Toggle({
  label: 'display gyro',
  active: true,
  container: '#controls',
  callback: value => muteDisplayFactors[2] = value + 0,
});

const kslider = new controllers.Slider({
  label: 'filter k factor',
  min: 0,
  max: 1,
  step: 0.01,
  default: defaultK,
  size: 'large',
  container: '#controls',
  callback: value => filter.params.set('k', value),
});




