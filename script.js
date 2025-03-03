const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const dpi = window.devicePixelRatio || 1;


function fixCanvasSize() {
    const styleWidth = 800;
    const styleHeight = 500;

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
let undoStack = [];
let redoStack = [];
let currentPath = {};
let eraserMode = false;


canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);


canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

function getCoordinates(e) {
    let rect = canvas.getBoundingClientRect();
    let x, y;

    if (e.touches) {
        e = e.touches[0];
    }

    x = (e.clientX - rect.left) * (canvas.width / rect.width) / dpi;
    y = (e.clientY - rect.top) * (canvas.height / rect.height) / dpi;

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
    undoStack.push(currentPath);
    redoStack = [];
}

function changeColor(color) {
    ctx.strokeStyle = color;
    eraserMode = false;
    document.getElementById('eraserBtn').classList.remove('active');
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
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStack.push({ action: 'clear' });
    redoStack = [];
}


function undo() {
    if (undoStack.length > 0) {
        redoStack.push(undoStack.pop());
        redraw();
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(redoStack.pop());
        redraw();
    }
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStack.forEach(path => {
        if (path.action === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        else {
            ctx.lineWidth = path.size;
            ctx.strokeStyle = path.color;
            ctx.globalCompositeOperation = path.eraser ? 'destination-out' : 'source-over';
            ctx.beginPath();
            ctx.moveTo(path.points[0].x, path.points[0].y);
            path.points.forEach((point) => ctx.lineTo(point.x, point.y));
            ctx.stroke();
        }
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
}
