/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tfvis from '@tensorflow/tfjs-vis';

const statusElement = document.getElementById('status');
const messageElement = document.getElementById('message');
const imagesElement = document.getElementById('images');
const canvasResultElement = document.getElementById('test-canvas-result');
const canvasElement = document.getElementById('draw-canvas');

export function logStatus(message) {
    statusElement.innerText = message;
}

export function trainingLog(message) {
    messageElement.innerText = `${message}\n`;
    console.log(message);
}

export function showTestResults(batch, predictions, labels) {
    const testExamples = batch.xs.shape[0];
    imagesElement.innerHTML = '';
    for (let i = 0; i < testExamples; i++) {
        const image = batch.xs.slice([i, 0], [1, batch.xs.shape[1]]);

        const div = document.createElement('div');
        div.className = 'pred-container';

        const canvas = document.createElement('canvas');
        canvas.className = 'prediction-canvas';
        draw(image.flatten(), canvas);

        const pred = document.createElement('div');

        const prediction = predictions[i];
        const label = labels[i];
        const correct = prediction === label;

        pred.className = `pred ${(correct ? 'pred-correct' : 'pred-incorrect')}`;
        pred.innerText = `pred: ${prediction}`;

        div.appendChild(pred);
        div.appendChild(canvas);

        imagesElement.appendChild(div);
    }
}

const lossLabelElement = document.getElementById('loss-label');
const accuracyLabelElement = document.getElementById('accuracy-label');
const lossValues = [[], []];
export function plotLoss(batch, loss, set) {
    const series = set === 'train' ? 0 : 1;
    lossValues[series].push({ x: batch, y: loss });
    const lossContainer = document.getElementById('loss-canvas');
    tfvis.render.linechart(
        lossContainer, { values: lossValues, series: ['train', 'validation'] }, {
        xLabel: 'Batch #',
        yLabel: 'Loss',
        width: 400,
        height: 300,
    });
    lossLabelElement.innerText = `last loss: ${loss.toFixed(3)}`;
}

const accuracyValues = [[], []];
export function plotAccuracy(batch, accuracy, set) {
    const accuracyContainer = document.getElementById('accuracy-canvas');
    const series = set === 'train' ? 0 : 1;
    accuracyValues[series].push({ x: batch, y: accuracy });
    tfvis.render.linechart(
        accuracyContainer,
        { values: accuracyValues, series: ['train', 'validation'] }, {
        xLabel: 'Batch #',
        yLabel: 'Accuracy',
        width: 400,
        height: 300,
    });
    accuracyLabelElement.innerText =
        `last accuracy: ${(accuracy * 100).toFixed(1)}%`;
}

export function draw(image, canvas) {
    const [width, height] = [28, 28];
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(width, height);
    const data = image.dataSync();
    for (let i = 0; i < height * width; ++i) {
        const j = i * 4;
        imageData.data[j + 0] = data[i] * 255;
        imageData.data[j + 1] = data[i] * 255;
        imageData.data[j + 2] = data[i] * 255;
        imageData.data[j + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
}

export function getModelTypeId() {
    return document.getElementById('model-type').value;
}

export function getTrainEpochs() {
    return Number.parseInt(document.getElementById('train-epochs').value);
}

export function setTrainButtonCallback(callback) {
    const trainButton = document.getElementById('train');
    const modelType = document.getElementById('model-type');
    trainButton.addEventListener('click', () => {
        trainButton.setAttribute('disabled', true);
        modelType.setAttribute('disabled', true);
        callback();
    });
}

function cleanCanvas(canvas) {
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function cleanAllCanvas() {
    cleanCanvas(canvasElement);
};

export function setCanvasResult(result) {
    canvasResultElement.innerText = result;
}

export function setCleanCanvasButtonCallback(callback) {
    const cleanButton = document.getElementById('clean-canvas');
    cleanButton.addEventListener('click', () => {
        cleanAllCanvas();
        callback();
    });
}

export function setDrawCanvasCallback(callback) {
    let ctx = canvasElement.getContext("2d");
    let cssWidth = 280;
    let cssHeight = 280;
    let rateX = canvasElement.width / cssWidth;
    let rateY = canvasElement.height / cssHeight;

    let onoff = false;
    let oldx;
    let oldy;
    // color
    let linecolor = "white";
    // line width
    let DEFAULT_LINE_WIDTH = 10 * rateX;
    let MAX_LINE_WIDTH = 20 * rateX;
    let PERIOD_LINE_WIDTH_CHANGE = 1 * rateX;
    let linw = DEFAULT_LINE_WIDTH;

    let isTouch = false;
    let downEvent = 'mousedown';
    let moveEvent = 'mousemove';
    let upEvent = 'mouseup';
    if ('ontouchstart' in window) {
        downEvent = 'touchstart';
        moveEvent = 'touchmove';
        upEvent = 'touchend';
        isTouch = true;
        console.log('touch')
    }

    canvasElement.addEventListener(moveEvent, draw);
    canvasElement.addEventListener(downEvent, down);
    canvasElement.addEventListener(upEvent, up);

    function down(event) {
        event.preventDefault();
        onoff = true;
        linw = DEFAULT_LINE_WIDTH;
        if (!isTouch) {
            oldx = event.offsetX * rateX;
            oldy = event.offsetY * rateY;
        } else {
            oldx = (event.changedTouches[0].pageX - canvasElement.offsetLeft) * rateX;
            oldy = (event.changedTouches[0].pageY - canvasElement.offsetTop) * rateY;
        }
    }
    function up() {
        event.preventDefault();
        onoff = false;
        callback();
    }
    function draw(event) {
        event.preventDefault();
        if (onoff == true) {
            let newx, newy;
            if (!isTouch) {
                newx = event.offsetX * rateX;
                newy = event.offsetY * rateY;
            } else {
                newx = (event.changedTouches[0].pageX - canvasElement.offsetLeft) * rateX;
                newy = (event.changedTouches[0].pageY - canvasElement.offsetTop) * rateY;
            }

            if (linw < MAX_LINE_WIDTH) {
                linw += PERIOD_LINE_WIDTH_CHANGE;
            } else {
                linw = MAX_LINE_WIDTH;
            }

            ctx.beginPath();
            ctx.moveTo(oldx, oldy);
            ctx.lineTo(newx, newy);
            ctx.strokeStyle = linecolor;
            ctx.lineWidth = linw;
            ctx.lineCap = "round";
            ctx.stroke();

            oldx = newx;
            oldy = newy;
        }
    }
}

export function getCanvasImageData() {
    return canvasElement.getContext("2d").getImageData(0, 0, 28, 28).data;
}