const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const dpi = window.devicePixelRatio || 1;

function fixCanvasSize() {
  const styleWidth = 1000;
  const styleHeight = 600;
  canvas.style.width = `${styleWidth}px`;
  canvas.style.height = `${styleHeight}px`;
  canvas.width = styleWidth * dpi;
  canvas.height = styleHeight * dpi;
  ctx.scale(dpi, dpi);
  ctx.lineWidth = 2;
}

fixCanvasSize();
ctx.lineCap = 'round';
ctx.strokeStyle = "#000000";

let drawing = false;
let paths = [];
let redoStack = [];
let currentPath = {};
let eraserMode = false;

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

function getCoordinates(e) {
  let rect = canvas.getBoundingClientRect();
  if (e.touches) e = e.touches[0];
  let x = (e.clientX - rect.left) * (canvas.width / rect.width) / dpi;
  let y = (e.clientY - rect.top) * (canvas.height / rect.height) / dpi;
  return { x, y };
}

function startDrawing(e) {
  if (drawing) return;
  drawing = true;
  const { x, y } = getCoordinates(e);
  currentPath = { points: [{ x, y }], color: ctx.strokeStyle, size: ctx.lineWidth, eraser: eraserMode };
  ctx.globalCompositeOperation = eraserMode ? 'destination-out' : 'source-over';
  draw(e);
}

function draw(e) {
  if (!drawing) return;
  const { x, y } = getCoordinates(e);
  const lastPoint = currentPath.points[currentPath.points.length - 1];
  currentPath.points.push({ x, y });
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function stopDrawing() {
  if (!drawing) return;
  drawing = false;
  paths.push(currentPath);
  redoStack = [];
}

function changeColor(color) {
  ctx.strokeStyle = color;
  eraserMode = false;
  document.getElementById('eraserBtn').classList.remove('active');
  document.getElementById('eraserStatus').textContent = '';
}

function changeSize(size) {
  ctx.lineWidth = size;
}

function changeEraserSize(size) {
  if (eraserMode) {
    ctx.lineWidth = size;
  }
}

function toggleEraser() {
  eraserMode = !eraserMode;
  document.getElementById('eraserBtn').classList.toggle('active', eraserMode);
  document.getElementById('eraserStatus').textContent = eraserMode ? '(Active)' : '';
}

function clearCanvas() {
  const confirmClear = confirm("Are you sure you want to clear the canvas? This action cannot be undone.\nTip: You can undo this action with the Undo button.");
  if (!confirmClear) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths = [];
  redoStack = [];
}

function undo() {
  if (paths.length > 0) {
    redoStack.push(paths.pop());
    redraw();
  }
}

function redo() {
  if (redoStack.length > 0) {
    paths.push(redoStack.pop());
    redraw();
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths.forEach(path => {
    ctx.lineWidth = path.size;
    ctx.strokeStyle = path.color;
    ctx.globalCompositeOperation = path.eraser ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    path.points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
  });
}

function saveCanvas() {
  const format = document.getElementById('fileFormat').value;
  const confirmSave = confirm(`Do you want to save the drawing as a ${format.toUpperCase()} file?`);
  if (!confirmSave) return;

  const link = document.createElement('a');
  link.download = `whiteboard.${format}`;
  link.href = canvas.toDataURL(`image/${format}`);
  link.click();

  alert(`Saved as ${format.toUpperCase()} successfully!`);
}
