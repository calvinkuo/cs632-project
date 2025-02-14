/**
 * @type {HTMLCanvasElement}
 */
const whiteboard = document.getElementById("whiteboard");
const dpi = window.devicePixelRatio;
whiteboard.width = 1920 * dpi; // TODO: adapt to screen size
whiteboard.height = 1080 * dpi; // TODO: adapt to screen size

const ctx = whiteboard.getContext("2d");
ctx.clearRect(0, 0, whiteboard.width, whiteboard.height);
ctx.strokeStyle = "blue"; // TODO: add UI to change color
ctx.lineWidth = dpi * 10; // TODO: add UI to change size
ctx.lineCap = "round";

let isDrawing = false;
let isEnter = false;
let oldX = 0;
let oldY = 0;

/**
 * @param {number} clientX
 * @param {number} clientY
 * @returns {[number, number]}
 */
function convertCoords(clientX, clientY) {
  const boundingRect = whiteboard.getBoundingClientRect();
  const x = (clientX - boundingRect.x) * whiteboard.width / boundingRect.width;
  const y = (clientY - boundingRect.y) * whiteboard.height / boundingRect.height;
  return [x, y];
}

/**
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 */
function helperLine(x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

/**
 * @param {MouseEvent} ev
 * @returns {boolean}
 */
function leftClick(ev) {
  return Boolean(ev.buttons & 1);
}

/**
 * @param {MouseEvent} ev
 */
function drawStart(ev) {
  if (leftClick(ev)) {
    isDrawing = true;
    [oldX, oldY] = convertCoords(ev.clientX, ev.clientY);
  }
}

/**
 * @param {MouseEvent} ev
 */
function drawEnd(ev) {
  if (isDrawing) {
    const [newX, newY] = convertCoords(ev.clientX, ev.clientY);
    helperLine(oldX, oldY, newX, newY);
  }
  if (!leftClick(ev)) {
    isDrawing = false;
  }
}

/**
 * @param {MouseEvent} ev
 */
function draw(ev) {
  if (isDrawing && leftClick(ev)) {
    const [newX, newY] = convertCoords(ev.clientX, ev.clientY);
    helperLine(oldX, oldY, newX, newY);
    [oldX, oldY] = [newX, newY];
  }
}

window.addEventListener("mousedown", drawStart);
window.addEventListener("mouseup", drawEnd);
window.addEventListener("mousemove", draw);
