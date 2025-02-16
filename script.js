const canvas = document.getElementById('whiteboard');
const dpi = window.devicePixelRatio;
canvas.width = canvas.width * dpi;
canvas.height = canvas.height * dpi;
const ctx = canvas.getContext('2d');
ctx.lineCap = 'round';
let drawing = false;
let paths = [];
let currentPath = {};
let currentColor = "#000000";
let currentSize = 2 * dpi;
let eraserMode = false;

canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });
canvas.addEventListener('mousedown', (e) => { if (leftClick(e)) drawStart(e); });
canvas.addEventListener('mousemove', (e) => { if (leftClick(e)) draw(e); });
canvas.addEventListener('mouseup', (e) => { if (!leftClick(e)) drawEnd(); });
canvas.addEventListener('mouseleave', (e) => { draw(e); drawEnd(); });

// Check specifically for left click, and not middle click or right click
function leftClick(e) {
    return Boolean(e.buttons & 1);
}

function drawStart(e) {
    if (drawing) return;
    drawing = true;
    const x0 = e.offsetX * dpi;
    const y0 = e.offsetY * dpi;
    currentPath = {points: [{x0, y0}], color: currentColor, size: currentSize, eraser: eraserMode};
    ctx.lineWidth = currentPath.size;
    ctx.strokeStyle = currentPath.color;
    ctx.globalCompositeOperation = currentPath.eraser ? 'destination-out' : 'source-over';
    draw(e);
}

function draw(e) {
    if (!drawing) return;
    const x0 = currentPath.points[currentPath.points.length - 1].x;
    const y0 = currentPath.points[currentPath.points.length - 1].y;
    const x = e.offsetX * dpi;
    const y = e.offsetY * dpi;
    currentPath.points.push({x, y});
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x, y);
    ctx.stroke();
}

function drawEnd() {
    if (!drawing) return;
    drawing = false;
    paths.push(currentPath);
}

function changeColor(color) {
    currentColor = color;
    eraserMode = false;
}

function changeSize(size) {
    currentSize = size * dpi;
}

function toggleEraser() {
    eraserMode = !eraserMode;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths = [];
}

function undo() {
    if (paths.length > 0) {
        paths.pop();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        paths.forEach(path => {
            ctx.lineWidth = path.size;
            ctx.strokeStyle = path.color;
            ctx.globalCompositeOperation = path.eraser ? 'destination-out' : 'source-over';
            ctx.beginPath();
            ctx.moveTo(path.points[0].x, path.points[0].y)
            path.points.forEach((point) => ctx.lineTo(point.x, point.y));
            ctx.stroke();
        });
    }
}

function saveCanvas() {
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
}
