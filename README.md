# lfo-motion

> `lfo` modules dedicated to sensors capture, filtering and movement analysis
> _see [waves-lfo](https://github.com/wavesjs/waves-lfo)_

## Install

The final application must import the `lfo-motion` modules (aka the plugin) _and_ the `waves-lfo` library

```sh
npm install [--save --save-exact] waves-lfo
npm install [--save --save-exact] ircam-rnd/lfo-motion
```


```js
const trainingData = new TrainingData();
const imlMotion = new ImlMotion('hmm');

imlMotion.setConfig({ 
  // ...
});

const preprocessing = new Preprocessing({
  callback: (frame) => trainingData.addElement(frame.data),
});

$start.addListener('click', () => {
  preprocessing.start();
  trainingData.startRecording('label');
});

$stop.addListener('click', () => {
  preprocessing.stop();
  trainingData.stopRecording();

  // training set is RapidMix compliant
  const trainingSet = trainingData.getTrainingSet();
  imlMotion
    .train(trainingSet)
    .then(model => {
      // model is RapidMix compliant
      console.log('model updated');
    });
});


// offline API (with Reader)
// given some trainingSet

```

```js

class TrainingSetReader {
  constructor() {
    // use lfo reader internally
  }

  play(exampleIndex) {

  }

  pause() {

  }

  stop() {
    
  }
}

class PreProcessingChain() {
  constructor() {

  }

  start() {

  }

  stop() {

  }
}

class TrainingData {
  constructor(inputDimension = null, outputDimension = null) {}

  addElement(inputVector, outputVector) {}

  startRecording(label = null) {}

  stopRecording() {}

  /**
   * @return - RapidMix compliant JSON format
   * // trainingSet
   */
  getTrainingSet() {}
}

class ImlMotion {
  constructor(type) {
    // RapidMix config object
    this.config = null;
    this.apiEndPoint = 'como.ircam.fr/api';
  }

  /**
   * @param {JSON} trainingSet - RapidMix compliant JSON
   *
   * @return {Promise} - resolve on the train model (allow async / ajax)
   */
  train(trainingSet) {
    // REST request / response - RapidMix
  }

  /**
   * @param {Float32Array|Array} vector - input vector for decoding
   * @return {Object} 
   */
  run(vector) {

  }

  /**
   * @param {Object} config - RapidMix configuration object or payload
   * // configuration ?
   */
  setConfig(config) {
    if (!config.docType) {
      config = {
        docType
        version
        payload: Object.assign({}, defaultConfig, config),
      };
    }
    // ...    

    this.config = rapidMixConfigObject  
  }

  /**
   * @return {Object} - RapidMix Configuration object
   */
  getConfig() {
    return this.config; // 
  }

  /**
   * @param {Object} model - RapidMix Model object
   */
  setModel(model) {

  }

  /**
   * @return {Object} - current RapidMix Model object
   */
  getModel() {

  }
}
```


























































