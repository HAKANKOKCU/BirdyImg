//const { ipcRenderer } = require("electron");

const editorMain = document.querySelector("main.editorMainCont");
const viewMain = document.querySelector("main.imgMainCont");
const canvas = document.getElementById("editcanvas");
const editorcolorselect = document.getElementById("editorColorSelect");
const editorsizenum = document.getElementById("editorSizeNum");
const effectsmenu = document.getElementById("editorEffectsMenu");
const effectsbutton = document.getElementById("editorEffectsButton");
const effects_darkerbutton = document.getElementById("editorMakeDarker");
const effects_lighterbutton = document.getElementById("editorMakeLighter");
const exiteditorbutton = document.getElementById("exitEditorButton");
const editorsavebutton = document.getElementById("editorSaveButton");
const editorundobutton = document.getElementById("editorUndoButton");
const canvasscrollable = document.getElementsByTagName("editorImageScrollablePart")[0];
const editorlockbutton = document.getElementById("editorLockButton");
const editorTools = document.getElementById("editorTools");
const editorToolsMenu = document.getElementById("editorToolsMenu");
var editorlock = false;
window.isInEditor = false;

var ctx = canvas.getContext("2d");
var tool = "pen";
window.enterEditor = function enterEditor() {
    editorMain.style.display = "";
    viewMain.style.display = "none";
    isInEditor = true;
    ipcRenderer.send("enterEditor", "");
    if (!isEditorInited) initEditor();
}
window.exitEditor = function exitEditor() {
    editorMain.style.display = "none";
    viewMain.style.display = "";
    isInEditor = false;
    ipcRenderer.send("exitEditor", "");
};
var isEditorInited = false;
function initEditor() {
    exiteditorbutton.onclick = exitEditor;
    window.saveEditorImage = function save() {
        var win = openFWindow("<h1>" + langpack.exportAs + "</h1><button data-export='image/png'>" + langpack.typeImage.replace("{TYPE}", "PNG") + "</button><button data-export='image/jpeg'>" + langpack.typeImage.replace("{TYPE}", "JPEG") + "</button><button data-export='image/webp'>" + langpack.typeImage.replace("{TYPE}", "WebP") + "</button>");
        Array.prototype.forEach.call(win.querySelectorAll("button[data-export]"), (item) => {
            item.onclick = function () {
                let canvasUrl = canvas.toDataURL(item.getAttribute("data-export"), 1.0);
                console.log(canvasUrl);
                const createEl = document.createElement('a');
                createEl.href = canvasUrl;
                createEl.download = "Editor Save";
                createEl.click();
                createEl.remove();
            }
        });
    }
    window.editorUndo = function () {
        for (let i = 0; i < drawundos[drawundos.length - 1]; i++) {
            drawing.pop()
        }
        drawundos.pop();
        redraw()
    }
    canvas.onmousemove = function (event) {
        if (!isdrawing) return;
        try {
            if (tool == "pen") drawlineat(event.offsetX, event.offsetY, oldevent.offsetX, oldevent.offsetY);
            if (tool == "eraser") eraseXY(event.offsetX, event.offsetY);
        } catch { }
        oldevent = event;
    }

    canvas.ontouchmove = function (event) {
        if (!isdrawing) return;
        //console.log(event)
        try {
            if (tool == "pen") drawlineat(event.touches[0].clientX + canvasscrollable.scrollLeft, event.touches[0].clientY + canvasscrollable.scrollTop, oldevent.touches[0].clientX + canvasscrollable.scrollLeft, oldevent.touches[0].clientY + canvasscrollable.scrollTop);
            if (tool == "eraser") eraseXY(event.touches[0].clientX + canvasscrollable.scrollLeft, event.touches[0].clientY + canvasscrollable.scrollTop);
        } catch { }
        oldevent = event;
        event.preventDefault();
    }

    canvas.onmousedown = canvas.ontouchstart = function () { if (!editorlock) isdrawing = true }

    canvas.onmouseup = canvas.ontouchend = function () { isdrawing = false; oldevent = undefined; drawundos.push(drawundocounter); drawundocounter = 0 }

    editorcolorselect.onchange = function () {
        currentcolor = editorcolorselect.value;
    }
    editorsizenum.value = lineW;
    editorsizenum.onchange = function () {
        lineW = editorsizenum.value;
    }

    effectsbutton.onclick = function () {
        if (effectsmenu.style.display == "none") {
            effectsmenu.style.display = ""
        } else {
            effectsmenu.style.display = "none"
        }
    }

    editorTools.onclick = function () {
        if (editorToolsMenu.style.display == "none") {
            editorToolsMenu.style.display = ""
        } else {
            editorToolsMenu.style.display = "none"
        }
    }

    Array.prototype.forEach.call(editorToolsMenu.querySelectorAll("button"), (item) => {
        item.onclick = function () {
            tool = item.getAttribute("data-toolname");
        }
    });

    //editorMain.addEventListener("mousedown", function (event) {
    //    if (event.target == effectsmenu) return;
    //    effectsmenu.style.display = "none"
    //})

    effects_darkerbutton.onclick = function () { makeDarker(); drawing.push({ type: "darker" }); drawundos.push(1) };


    effects_lighterbutton.onclick = function () { makeLighter(); drawing.push({ type: "lighter" }); drawundos.push(1) };

    editorlockbutton.onclick = function () {
        editorlock = !editorlock;
        if (editorlock) {
            editorlockbutton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M6 22q-.825 0-1.412-.587Q4 20.825 4 20V10q0-.825.588-1.413Q5.175 8 6 8h1V6q0-2.075 1.463-3.538Q9.925 1 12 1t3.538 1.462Q17 3.925 17 6v2h1q.825 0 1.413.587Q20 9.175 20 10v10q0 .825-.587 1.413Q18.825 22 18 22Zm0-2h12V10H6v10Zm6-3q.825 0 1.413-.587Q14 15.825 14 15q0-.825-.587-1.413Q12.825 13 12 13q-.825 0-1.412.587Q10 14.175 10 15q0 .825.588 1.413Q11.175 17 12 17ZM9 8h6V6q0-1.25-.875-2.125T12 3q-1.25 0-2.125.875T9 6ZM6 20V10v10Z"/></svg>'
        } else {
            editorlockbutton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M6 8h9V6q0-1.25-.875-2.125T12 3q-1.25 0-2.125.875T9 6H7q0-2.075 1.463-3.538Q9.925 1 12 1t3.538 1.462Q17 3.925 17 6v2h1q.825 0 1.413.587Q20 9.175 20 10v10q0 .825-.587 1.413Q18.825 22 18 22H6q-.825 0-1.412-.587Q4 20.825 4 20V10q0-.825.588-1.413Q5.175 8 6 8Zm0 12h12V10H6v10Zm6-3q.825 0 1.413-.587Q14 15.825 14 15q0-.825-.587-1.413Q12.825 13 12 13q-.825 0-1.412.587Q10 14.175 10 15q0 .825.588 1.413Q11.175 17 12 17Zm-6 3V10v10Z"/></svg>'
        }
    }

    editorundobutton.onclick = editorUndo;
    editorsavebutton.onclick = saveEditorImage;
    ipcRenderer.on("exportImg", (event, dt) => editorsavebutton.click());
    isEditorInited = true;
}

window.loadFileInEditor = function loadFileInEditor() {
    drawing = [];
    canvas.width = tabs[tabID].imgW;
    canvas.height = tabs[tabID].imgH;
    canvas.style.width = tabs[tabID].imgW;
    canvas.style.height = tabs[tabID].imgH;
    ctx = canvas.getContext("2d");
    ctx.drawImage(tabs[tabID].ghostImg, 0, 0);
}

var lineW = 3;
var drawing = [];
var drawundos = [];
var drawundocounter = 0;

function drawlineat(x1, y1, x2, y2) {
    ctx.fillStyle = currentcolor;
    ctx.strokeStyle = currentcolor;
    ctx.lineWidth = lineW;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x1, y1, lineW / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y2, lineW / 2, 0, 2 * Math.PI);
    ctx.fill();
    drawundocounter++;
    drawing.push({ type: "line", x1: x1, y1: y1, x2: x2, y2: y2, lineW: lineW, currentColor: currentcolor });
}

function eraseXY(x, y) {
    ctx.clearRect(x - (lineW / 2), y - (lineW / 2), lineW, lineW);
    drawundocounter++;
    drawing.push({ type: "eraser", x: x, y: y, lineW: lineW });
}

function eraseXYtemp(x, y, lineW) {
    ctx.clearRect(x - (lineW / 2), y - (lineW / 2), lineW, lineW);
}

function drawlineattemp(x1, y1, x2, y2, lineW) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x1, y1, lineW / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y2, lineW / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(tabs[tabID].ghostImg, 0, 0);
    drawing.forEach(function (item) {
        ctx.fillStyle = item.currentColor;
        ctx.strokeStyle = item.currentColor;
        ctx.lineWidth = item.lineW;
        if (item.type == "line") drawlineattemp(item.x1, item.y1, item.x2, item.y2, item.lineW);
        if (item.type == "darker") makeDarker();
        if (item.type == "lighter") makeLighter();
        if (item.type == "eraser") eraseXYtemp(item.x, item.y, item.lineW);
    })
}

var currentcolor = "#000000";
var oldevent;
var isdrawing = false;

function makeDarker() {
    ctx.fillStyle = "rgba(0,0,0,0.05)"
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function makeLighter() {
    ctx.fillStyle = "rgba(255,255,255,0.05)"
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
