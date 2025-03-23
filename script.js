const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const dpi = window.devicePixelRatio || 1;


function fixCanvasSize() {
    const styleWidth = 800;
    const styleHeight = 500;

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
let brushWidth = +document.getElementById('sizePicker').getAttribute('value');
let eraserWidth = +document.getElementById('eraserSizePicker').getAttribute('value');


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

function updateUndoRedoButtons() {
    document.getElementById('clear').toggleAttribute('disabled', undoStack.length === 0 || undoStack[undoStack.length - 1].action === 'clear')
    document.getElementById('undo').toggleAttribute('disabled', undoStack.length === 0);
    document.getElementById('redo').toggleAttribute('disabled', redoStack.length === 0);
}

updateUndoRedoButtons();

function startDrawing(e) {
    if (drawing) return;
    drawing = true;
    const { x, y } = getCoordinates(e);
    ctx.lineWidth = eraserMode ? eraserWidth : brushWidth;
    ctx.globalCompositeOperation = eraserMode ? 'destination-out' : 'source-over';
    currentPath = { points: [{ x, y }], color: ctx.strokeStyle, size: ctx.lineWidth, eraser: eraserMode };
    draw(e);

    e.preventDefault();
    e.stopPropagation();
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

    e.preventDefault();
    e.stopPropagation();
}

function stopDrawing(e) {
    if (!drawing) return;
    drawing = false;
    undoStack.push(currentPath);
    redoStack = [];
    updateUndoRedoButtons();

    e.preventDefault();
    e.stopPropagation();
}

function changeColor(color) {
    ctx.strokeStyle = color;
}

function changeSize(size) {
    brushWidth = size;
}

function changeEraserSize(size) {
    eraserWidth = size;
}

function toggleEraser(value = !eraserMode) {
    eraserMode = value;
    document.getElementById('toolbar').classList.toggle('brushView', !value);
    document.getElementById('toolbar').classList.toggle('eraserView', value);
}

function clearCanvas() {
    const confirmClear = confirm("Are you sure you want to clear the canvas? (If you change your mind, you can undo clearing the canvas later.)");
    if (!confirmClear) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStack.push({ action: 'clear' });
    redoStack = [];
    updateUndoRedoButtons();
}

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(undoStack.pop());
        redraw();
        updateUndoRedoButtons();
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(redoStack.pop());
        redraw();
        updateUndoRedoButtons();
    }
}

function redraw(clear = true) {
    if (clear)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find index of last clear action
    let lastClear = -1;
    for (let index = undoStack.length - 1; index >= 0; index--) {
        if (undoStack[index].action === 'clear') {
            lastClear = index;
            break;
        }
    }

    undoStack.forEach((path, index) => {
        if (index <= lastClear)
            return;
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

    if (format === 'jpeg') {
        // JPEG does not support transparency
        const saved = ctx.fillStyle;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = saved;
        redraw(false);
    }

    const filename = `whiteboard.${format}`;
    const mimeType = `image/${format}`;
    if ((/iPad|iPhone|iPod/.test(navigator.userAgent) || /Android/i.test(navigator.userAgent)) && 'share' in navigator) {
        canvas.toBlob((blob) => {
            navigator.share({
                title: "Whiteboard",
                files: [new File([blob], filename, { type: mimeType })],
            }).then(() => {
                if (format === 'jpeg') {
                    redraw();
                }
            });
        }, mimeType);
        return;
    }

    const confirmSave = confirm(`Do you want to save the drawing as a ${format.toUpperCase()} file?`);
    if (!confirmSave) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL(mimeType);
    link.click();

    if (format === 'jpeg') {
        redraw();
    }

    setTimeout(() => {
        window.alert("The file has been saved.");
    }, 500);
}
