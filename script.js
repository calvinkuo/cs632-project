const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
let drawing = false;
let paths = [];
let currentPath = [];
let currentColor = "#000000";
let currentSize = 2;
let eraserMode = false;

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    currentPath = [];
    draw(e);
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => {
    drawing = false;
    paths.push([...currentPath]);
});
canvas.addEventListener('mouseleave', () => drawing = false);

function draw(e) {
    if (!drawing) return;
    const x = e.offsetX;
    const y = e.offsetY;
    currentPath.push({x, y, color: currentColor, size: currentSize, eraser: eraserMode});
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = eraserMode ? "#FFFFFF" : currentColor;
    ctx.beginPath();
    ctx.moveTo(currentPath.length > 1 ? currentPath[currentPath.length - 2].x : x, currentPath.length > 1 ? currentPath[currentPath.length - 2].y : y);
    ctx.lineTo(x, y);
    ctx.stroke();
}

function changeColor(color) {
    currentColor = color;
    eraserMode = false;
}

function changeSize(size) {
    currentSize = size;
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
            ctx.beginPath();
            path.forEach((point, index) => {
                ctx.lineWidth = point.size;
                ctx.strokeStyle = point.eraser ? "#FFFFFF" : point.color;
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                    ctx.stroke();
                }
            });
        });
    }
}

function saveCanvas() {
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
}
