import * as lfo from 'waves-lfo/client';
import * as controllers from 'basic-controllers'
import * as loaders from 'waves-loaders';
import MotionInput from '../../../../dist/source/MotionInput';
import Intensity from '../../../../dist/operator/Intensity';
import Kick from '../../../../dist/operator/Kick';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const loader = new loaders.AudioBufferLoader();
// ugly global, sorry for that
let audioBuffer =  null;
// let audioContext = null;

function init() {
  let lastState = 0;

  const motionInput = new MotionInput();
  const intensity = new Intensity();
  const kick = new Kick();
  const bridge = new lfo.sink.Bridge({
    processFrame: frame => {
      const state = frame.data[0];
      console.log(frame.data);

      if (lastState !== state) {
        lastState = state;

        if (state === 1) {
          const src = audioContext.createBufferSource();
          src.connect(audioContext.destination);
          src.buffer = audioBuffer;
          src.start();

          console.log('heho', audioBuffer);
        }
      }
    }
  });

  const onOff = new lfo.operator.OnOff({ state: 'on' });
  const socketSend = new lfo.sink.SocketSend({ port: 5000 });

  motionInput.connect(intensity);
  intensity.connect(kick);
  kick.connect(bridge);
  // kick.connect(onOff);
  // onOff.connect(socketSend);

  motionInput.init()
    .then(() => motionInput.start())
    .catch(err => console.error(err.stack));
}

// ---------------------------------------------------------------
// CONTROLS
// ---------------------------------------------------------------

loader.load('./woodblock.wav')
  .then(buffer => audioBuffer = buffer)
  .catch(err => console.error(err.stack));

// safari requirement
const $start = document.querySelector('#start');
$start.addEventListener('touchstart', start);

function start() {
  const g = audioContext.createGain();
  g.connect(audioContext.destination);
  g.gain.value = 0.000000001; // -180dB ?

  const o = audioContext.createOscillator();
  o.connect(g);
  o.frequency.value = 20;
  o.start(0);

  // prevent android to stop audio by keeping the oscillator active
  o.stop(audioContext.currentTime + 0.01);

  init();
  $start.removeEventListener('touchstart', start);
}

const toggleStream = new controllers.Toggle({
  label: 'On / Off',
  active: true,
  container: '#controls',
  callback: value => {
    if (value)
      onOff.setState('on');
    else
      onOff.setState('off');
  }
});
