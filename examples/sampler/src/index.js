import * as lfo from 'waves-lfo/client';
import * as controllers from '@ircam/basic-controllers';
import Ticker from '@ircam/ticker';
import Sampler from '../../../dist/operator/Sampler';

class Sine {
  constructor(freq, sampleRate) {
    this.sampleRate = sampleRate;
    this.phase = 0;
    this.phaseIncr = freq / sampleRate;
  }

  set frequency(freq) {
    this.phaseIncr = freq / this.sampleRate;
  }

  generateSample() {
    const sample = Math.sin(this.phase * 2 * Math.PI);

    this.phase = (this.phase + this.phaseIncr) % 1;

    return sample;
  }
}


const sampleRate = 50;
const samplePeriod = 1 / sampleRate;
const sine = new Sine(1, sampleRate);

const eventIn = new lfo.source.EventIn({
  frameSize: 1,
  frameRate: 0,
  frameType: 'vector',
});

// display raw
const rawDisplay = new lfo.sink.BpfDisplay({
  duration: 1,
  canvas: '#raw',
});

// resampled display
const sampler = new Sampler({
  frameRate: 46,
});

const resampledDisplay = new lfo.sink.BpfDisplay({
  duration: 1,
  colors: ['red'],
  canvas: '#resampled',
});

eventIn.connect(rawDisplay);

eventIn.connect(sampler);
sampler.connect(resampledDisplay);

const ticker = new Ticker(samplePeriod * 1000, (logicalTime) => {
  const sample = sine.generateSample();

  eventIn.process(logicalTime / 1000, [sample]);
});

eventIn.init().then(() => {
  eventIn.start();
  ticker.start();
});

const freqController = new controllers.Slider({
  label: 'frequency',
  min: 1,
  max: 10,
  step: 1,
  default: 1,
  container: '#controllers',
  callback: value => sine.frequency = value,
});
