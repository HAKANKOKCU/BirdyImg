const editorMain = document.querySelector("main.editorMainCont");
const viewMain = document.querySelector("main.imgMainCont");
window.isInEditor = false;

window.enterEditor = function enterEditor() {
    editorMain.style.display = "";
    viewMain.style.display = "none";
    isInEditor = true;
    ipcRenderer.send("enterEditor", "");
    if (!isEditorInited) initEditor();
}
window.exitEditor = function exitEditor(force) {
	if (force != true) {
		var res = ipcRenderer.sendSync("messagebox", {
			message: langpack.doYouWantToExitEditor,
			type: "question",
			title: langpack.exitEditor,
			buttons: [
				langpack.no,
				langpack.yes
			]
		});
		if (res == 0) return;
	}
    editorMain.style.display = "none";
    viewMain.style.display = "";
    isInEditor = false;
    ipcRenderer.send("exitEditor", "");
};
window.loadFileInEditor = function loadFileInEditor() {
	editorRotate = 0;
	editorZoomPrct = 1;
	drawing = [];
	if (tabs[tabID].fileInf == null) {
		ema.style.display = "none";
		editorhome.style.display = "";
		initHome()
		
	}else {
		editorhome.style.display = "none";
		ema.style.display = "";
		canvas.width = tabs[tabID].imgW;
		canvas.height = tabs[tabID].imgH;
		editorApplyZoom();
		ctx = canvas.getContext("2d");
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(tabs[tabID].ghostImg, 0, 0);
	}
}
function initHome() {
	editorhome.innerHTML = "";
	var flex = document.createElement("flex");
	var exitbutton = document.createElement("button")
	exitbutton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24">
						<path
							d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z" />
					</svg>`;
	exitbutton.style.width = exitbutton.style.height = "34px";
	flex.appendChild(exitbutton)
	exitbutton.addEventListener("click",exitEditor)
	var title = document.createElement("h1");
	title.setAttribute("data-fromlang","welcomeToBirdyImgEditor");
	applyTranslationFor(title);
	flex.appendChild(title);
	editorhome.appendChild(flex);
	var recentlySavedTitle = document.createElement("h3");
	recentlySavedTitle.setAttribute("data-fromlang","recentlySaved");
	applyTranslationFor(recentlySavedTitle);
	editorhome.appendChild(recentlySavedTitle)
	var flexlist = document.createElement("flex");
	flexlist.classList.add("noshrink");
	flexlist.style.overflow = "auto";
	flexlist.style.width = "100%";
	settingsdata.recentlySaved.forEach((item) => {
		var cardItem = document.createElement("carditem");
		var imgCard = document.createElement("img")
		imgCard.src = item;
		imgCard.style.height = "200px";
		cardItem.appendChild(imgCard)
		var nameCard = document.createElement("p")
		nameCard.style.width = "100%";
		nameCard.innerText = getFileName(item);
		cardItem.appendChild(nameCard)
		flexlist.insertBefore(cardItem,flexlist.firstChild)
		cardItem.addEventListener("click",function() {
			ipcRenderer.send("openfilep", item);
			setTimeout(function() {
				enterEditor();
				loadFileInEditor();
			},500)
		})
	})
	editorhome.appendChild(flexlist)
}
var isEditorInited = false;
function initEditor() {
	window.editorDefaultZoom = 0.1;
	window.ema = document.getElementsByTagName("editormain")[0];
	window.editorcolorselect = document.getElementById("editorColorSelect");
	window.editoropacityselect = document.getElementById("editorOpacitySelect");
	window.editorsizenum = document.getElementById("editorSizeNum");
	window.effectsmenu = document.getElementById("editorEffectsMenu");
	window.effectsbutton = document.getElementById("editorEffectsButton");
	window.effects_darkerbutton = createElementWithContainerAndLangString("makeDarker", "button", effectsmenu);
	window.effects_lighterbutton = createElementWithContainerAndLangString("makeLighter", "button", effectsmenu);
	window.effects_reversebutton = createElementWithContainerAndLangString("reverseColors", "button", effectsmenu);
	window.effects_grayscalebutton = createElementWithContainerAndLangString("grayscale", "button", effectsmenu);
	window.effects_disabletransparencybutton = createElementWithContainerAndLangString("disableTransparency", "button", effectsmenu);
	//window.effects_fliphorizontalbutton = createElementWithContainerAndLangString("flipHorizontal", "button", effectsmenu);
	//window.effects_flipverticalbutton = createElementWithContainerAndLangString("flipVertical", "button", effectsmenu);
	window.effects_redonlybutton = createElementWithContainerAndLangString("redOnly", "button", effectsmenu);
	window.effects_greenonlybutton = createElementWithContainerAndLangString("greenOnly", "button", effectsmenu);
	window.effects_blueonlybutton = createElementWithContainerAndLangString("blueOnly", "button", effectsmenu);
	window.effects_alphaonlybutton = createElementWithContainerAndLangString("alphaOnly", "button", effectsmenu);
	window.exiteditorbutton = document.getElementById("exitEditorButton");
	window.editorsavebutton = document.getElementById("editorSaveButton");
	window.editorundobutton = document.getElementById("editorUndoButton");
	window.editorlockbutton = document.getElementById("editorLockButton");
	window.editorTools = document.getElementById("editorTools");
	window.editorToolsMenu = document.getElementById("editorToolsMenu");
	window.editorZoomInButton = document.getElementById("editorZoomInButton");
	window.editorZoomOutButton = document.getElementById("editorZoomOutButton");
	window.dontcentereditorimage = false
	window.cropresizeable = document.createElement("div"); cropresizeable.classList.add("resizable");
	window.cropresizers = document.createElement("div"); cropresizers.classList.add("resizers");
	window.cropresizera = document.createElement("div"); cropresizera.classList.add("resizer","top-left");
	window.cropresizerb = document.createElement("div"); cropresizerb.classList.add("resizer","top-right");
	window.cropresizerc = document.createElement("div"); cropresizerc.classList.add("resizer","bottom-left");
	window.cropresizerd = document.createElement("div"); cropresizerd.classList.add("resizer","bottom-right");
	window.cropcontrols = document.createElement("div"); cropcontrols.classList.add("controlbuttons");
	window.cropcancelbutton = document.createElement("button");
	window.isCropping = false;
	cropcancelbutton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z"/></svg>`;
	cropcancelbutton.addEventListener("click",function() {
		canvasscrollable.removeChild(cropresizeable);
		dontcentereditorimage = false;
		editorApplyZoom();
		isCropping = false;
	})
	cropcontrols.appendChild(cropcancelbutton);
	window.tempcanvas = document.createElement("canvas");
	window.cropbutton = document.createElement("button");
	cropbutton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="m9.55 18-5.7-5.7 1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4Z"/></svg>`;
	cropbutton.addEventListener("click",function() {
		tempcanvas.width = parseInt(cropresizeable.style.width, 10) / editorZoomPrct;
		tempcanvas.height = parseInt(cropresizeable.style.height, 10) / editorZoomPrct;
		var destCtx = tempcanvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		var x = -(parseInt(cropresizeable.style.left, 10) / editorZoomPrct) - canvas.offsetLeft;
		var y = -(parseInt(cropresizeable.style.top, 10) / editorZoomPrct) - canvas.offsetTop;
		//var x = -(parseInt(cropresizeable.style.left, 10) - (canvas.offsetLeft * editorZoomPrct));
		//var y = -(parseInt(cropresizeable.style.top, 10) - (canvas.offsetTop  * editorZoomPrct));
		console.log(x)
		destCtx.drawImage(canvas, x, y);
		//destCtx.drawImage(canvas, 0,0);
		//canvasscrollable.appendChild(tempcanvas);
		canvasscrollable.removeChild(cropresizeable);
		dontcentereditorimage = false;
		editorApplyZoom();
		var win = openWindow("<h1>" + langpack.exportAs + "</h1><!--<label>Quality: </label><input max='100' class='quality' type='number'/>--><button data-export='image/png'>" + langpack.typeImage.replace("{TYPE}", "PNG") + "</button><button data-export='image/jpeg'>" + langpack.typeImage.replace("{TYPE}", "JPEG") + "</button><button data-export='image/webp'>" + langpack.typeImage.replace("{TYPE}", "WebP") + "</button>");
		//win.getElementsByClassName("quality")[0].value = 100
        Array.prototype.forEach.call(win.querySelectorAll("button[data-export]"), (item) => {
            item.onclick = function () {
                let canvasUrl = tempcanvas.toDataURL(item.getAttribute("data-export"), 1.0); //win.getElementsByClassName("quality")[0].value / 100
                console.log(canvasUrl);
                // const createEl = document.createElement('a');
                // createEl.href = canvasUrl;
                // createEl.download = "Editor Save";
                // createEl.click();
                // createEl.remove();
				const base64Data = canvasUrl.replace(/^data:image\/png;base64,/, "");
				ipcRenderer.send("saveFile",base64Data)
            }
        });
		isCropping = false;
	})
	cropcontrols.appendChild(cropbutton);
	cropresizers.appendChild(cropresizera);
	cropresizers.appendChild(cropresizerb);
	cropresizers.appendChild(cropresizerc);
	cropresizers.appendChild(cropresizerd);
	cropresizeable.appendChild(cropresizers);
	cropresizeable.appendChild(cropcontrols);
	makeResizableDiv(cropresizeable, false);
	window.editorlock = false;
	window.editorRotate = 0;
	window.editorZoomPrct = 1;
	window.editorhome = document.getElementsByTagName("editorhome")[0];
    exiteditorbutton.onclick = exitEditor;
	window.canvasscrollable = document.createElement("editorImageScrollablePart");
	window.canvas = document.createElement("canvas")
	window.ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	window.editortool = "pen";
	window.editordrawstartpos = {}
	canvasscrollable.appendChild(canvas)
	ema.insertBefore(canvasscrollable, ema.firstChild)
	
	window.lineW = 3;
	window.drawing = [];
	window.drawundos = [];
	window.drawundocounter = 0;
	
	window.previewsvg = document.createElement("svg");
	previewsvg.classList.add("previewsvg");
	ema.appendChild(previewsvg);
	window.previewLine = document.createElement("line")
	previewsvg.appendChild(previewLine)
	previewLine.style.display = "none";

	window.drawlineat = function(x1, y1, x2, y2) {
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
	
	window.drawcircleat = function(x,y,radius,isFilled) {
		ctx.fillStyle = currentcolor;
		ctx.strokeStyle = currentcolor;
		ctx.lineWidth = lineW;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		if (isFilled) 
			ctx.fill()
		else
			ctx.stroke(); 
		drawundocounter++;
		drawing.push({ type: (isFilled ? "f" : "") + "circle", x: x, y: y, radius:radius, lineW: lineW, currentColor: currentcolor });
	}
	
	window.drawrectangleat = function(x,y,sizex,sizey,isFilled) {
		ctx.fillStyle = currentcolor;
		ctx.strokeStyle = currentcolor;
		ctx.lineWidth = lineW;
		ctx.beginPath();
		ctx.rect(x, y, sizex,sizey);
		if (isFilled) 
			ctx.fill()
		else
			ctx.stroke(); 
		drawundocounter++;
		drawing.push({ type: (isFilled ? "f" : "") + "rectangle", x: x, y: y, sizex:sizex,sizey:sizey, lineW: lineW, currentColor: currentcolor });
	}
	
	window.drawcircleattemp = function(x,y,radius,isFilled) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		if (isFilled) 
			ctx.fill()
		else
			ctx.stroke(); 
	}
	
	window.drawrectangleattemp = function(x,y,sizex,sizey,isFilled) {
		ctx.beginPath();
		ctx.rect(x, y, sizex,sizey);
		if (isFilled) 
			ctx.fill()
		else
			ctx.stroke(); 
	}
	
	window.eraseXY = function(x, y) {
		ctx.clearRect(x - (lineW / 2), y - (lineW / 2), lineW, lineW);
		drawundocounter++;
		drawing.push({ type: "eraser", x: x, y: y, lineW: lineW });
	}

	window.eraseXYtemp = function(x, y, lineW) {
		ctx.clearRect(x - (lineW / 2), y - (lineW / 2), lineW, lineW);
	}

	window.drawlineattemp = function(x1, y1, x2, y2, lineW) {
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

	window.redraw = function() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		//ctx.translate(canvas.width/2,canvas.height/2);
		ctx.rotate(editorRotate*Math.PI/180);
		ctx.drawImage(tabs[tabID].ghostImg, 0, 0);
		//ctx.translate(0,0);
		ctx.rotate(0*Math.PI/180);
		ctx.restore();
		drawing.forEach(function (item) {
			ctx.fillStyle = item.currentColor;
			ctx.strokeStyle = item.currentColor;
			ctx.lineWidth = item.lineW;
			if (item.type == "line") drawlineattemp(item.x1, item.y1, item.x2, item.y2, item.lineW);
			if (item.type == "darker") makeDarker();
			if (item.type == "lighter") makeLighter();
			if (item.type == "eraser") eraseXYtemp(item.x, item.y, item.lineW);
			//if (item.type == "liner") drawlineattemp(item.x1, item.y1, item.x2, item.y2, item.lineW);
			if (item.type == "circle") drawcircleattemp(item.x,item.y,item.radius,false)
			if (item.type == "fcircle") drawcircleattemp(item.x,item.y,item.radius,true)
			if (item.type == "frectangle") drawrectangleattemp(item.x,item.y,item.sizex,item.sizey,true)
			if (item.type == "rectangle") drawrectangleattemp(item.x,item.y,item.sizex,item.sizey,false)
			if (item.type == "reverse") reverse();
			if (item.type == "grayscale") grayScale();
			if (item.type == "disabletransparency") disableTransparency();
			if (item.type == "only") only(item.channel);
		})
	}

	window.currentcolor = "#000000";
	window.oldevent;
	window.isdrawing = false;

	window.makeDarker = function() {
		ctx.fillStyle = "rgba(0,0,0,0.05)"
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	window.makeLighter = function() {
		ctx.fillStyle = "rgba(255,255,255,0.05)"
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	
	window.reverse = function() {
		//var currentclor = ctx.fillStyle
		let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		let pixels = imgData.data;
		for (var i = 0; i < pixels.length; i += 4) {
			pixels[i] = 255 - pixels[i]
			pixels[i + 1] = 255 - pixels[i + 1]
			pixels[i + 2] = 255 - pixels[i + 2]
		}
		//ctx.fillStyle = currentclor;
		ctx.putImageData(imgData, 0, 0);
	}
	
	window.grayScale = function() {
		//var currentclor = ctx.fillStyle
		let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		let pixels = imgData.data;
		for (var i = 0; i < pixels.length; i += 4) {
			let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);

			pixels[i] = lightness;
			pixels[i + 1] = lightness;
			pixels[i + 2] = lightness;
		}
		//ctx.fillStyle = currentclor;
		ctx.putImageData(imgData, 0, 0);
	}
	
	window.only = function(channelid) {
		//var currentclor = ctx.fillStyle
		let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		let pixels = imgData.data;
		for (var i = 0; i < pixels.length; i += 4) {
			pixels[i] = channelid == 0 ? pixels[i] : 0;
			pixels[i + 1] = channelid == 1 ? pixels[i + 1] : 0;
			pixels[i + 2] = channelid == 2 ? pixels[i + 2] : 0;
			pixels[i + 3] = channelid == 3 ? pixels[i + 3] : 255;
		}
		//ctx.fillStyle = currentclor;
		ctx.putImageData(imgData, 0, 0);
	}
	
	window.flipHorizontal = function() {
		//var currentclor = ctx.fillStyle
		let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		let pixels = imgData.data;
		let pixelsunchanged = pixels;
		var i = 0
		for (var y = 0; y < canvas.height; y += 1) {
			var linestarti = i * 4
			var lineipixels = []
			for (var p = 0; p < canvas.width * 4; p += 1) {
				lineipixels.push(pixelsunchanged[linestarti + p])
			}
			//console.log(lineipixels)
			for (var x = 0; x < canvas.width; x += 1) {
				pixels[i] = lineipixels[((lineipixels.length - 1) - i) - 3]
				pixels[i + 1] = lineipixels[((lineipixels.length - 1) - i) - 2]
				pixels[i + 2] = lineipixels[((lineipixels.length - 1) - i) - 1]
				pixels[i + 3] = lineipixels[((lineipixels.length - 1) - i) - 0]
				i += 1;
			}
		}
		//ctx.fillStyle = currentclor;
		ctx.putImageData(imgData, 0, 0);
	}
	
	window.disableTransparency = function() {
		//var currentclor = ctx.fillStyle
		let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		let pixels = imgData.data;
		for (var i = 0; i < pixels.length; i += 4) {
			pixels[i + 3] = 255;
		}
		//ctx.fillStyle = currentclor;
		ctx.putImageData(imgData, 0, 0);
	}

	
	window.editorApplyZoom = function() {
		if (editorZoomPrct <= 0) editorZoomPrct = editorDefaultZoom;
		canvas.style.width = (tabs[tabID].imgW * editorZoomPrct) + "px";
		canvas.style.height = (tabs[tabID].imgH * editorZoomPrct) + "px";
		canvasscrollable.style.justifyContent = ((tabs[tabID].imgW * editorZoomPrct) < canvasscrollable.offsetWidth && !dontcentereditorimage) ? "center" : ""
		canvasscrollable.style.alignItems = ((tabs[tabID].imgH * editorZoomPrct) < canvasscrollable.offsetHeight && !dontcentereditorimage) ? "center" : ""
	}
	
	canvasscrollable.onwheel = function(e) {
		if (e.ctrlKey) {
			console.log("!!")
			e.preventDefault();
			if (e.deltaY < 0) {
				editorZoomInButton.click();
			}else if (e.deltaY > 0) {
				editorZoomOutButton.click();
			}
		}
	}
	
	editorZoomInButton.onclick = function() {editorZoomPrct += 0.1;editorApplyZoom()}
	editorZoomOutButton.onclick = function() {editorZoomPrct -= 0.1;editorApplyZoom()}
	ipcRenderer.on("ezoomin", (event, data) => { editorZoomInButton.click() });
	ipcRenderer.on("ezoomout", (event, data) => { editorZoomOutButton.click() });
	ipcRenderer.on("exitEditorA", (event,data) => {exitEditor()})
	
    window.saveEditorImage = function save() {
        var win = openWindow("<h1>" + langpack.exportAs + "</h1><!--<label>Quality: </label><input max='100' class='quality' type='number'/>--><button data-export='image/png'>" + langpack.typeImage.replace("{TYPE}", "PNG") + "</button><button data-export='image/jpeg'>" + langpack.typeImage.replace("{TYPE}", "JPEG") + "</button><button data-export='image/webp'>" + langpack.typeImage.replace("{TYPE}", "WebP") + "</button>");
		//win.getElementsByClassName("quality")[0].value = 100
        Array.prototype.forEach.call(win.querySelectorAll("button[data-export]"), (item) => {
            item.onclick = function () {
                let canvasUrl = canvas.toDataURL(item.getAttribute("data-export"), 1.0); //win.getElementsByClassName("quality")[0].value / 100
                console.log(canvasUrl);
                // const createEl = document.createElement('a');
                // createEl.href = canvasUrl;
                // createEl.download = "Editor Save";
                // createEl.click();
                // createEl.remove();
				const base64Data = canvasUrl.replace(/^data:image\/png;base64,/, "");
				ipcRenderer.send("saveFile",base64Data)
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
            if (editortool == "pen") drawlineat(event.offsetX / editorZoomPrct, event.offsetY / editorZoomPrct, oldevent.offsetX / editorZoomPrct, oldevent.offsetY / editorZoomPrct);
            if (editortool == "eraser") eraseXY(event.offsetX / editorZoomPrct, event.offsetY / editorZoomPrct);
			if (editortool == "liner") {
				previewLine.setAttribute("x2",event.clientX + "px"); previewLine.setAttribute("y2",event.clientY + "px");
			}
        } catch { }
        oldevent = event;
    }

    canvas.addEventListener("touchmove",function (event) {
		console.log("moving!")
        if (!isdrawing) return;
        console.log(event)
        try {
			var x = event.touches[0].clientX + canvasscrollable.scrollLeft - canvas.offsetLeft; 
			var y = event.touches[0].clientY + canvasscrollable.scrollTop - canvas.offsetTop; 
			x = x / editorZoomPrct;
			y = y / editorZoomPrct;
			var ox = oldevent.touches[0].clientX + canvasscrollable.scrollLeft - canvas.offsetLeft; 
			var oy = oldevent.touches[0].clientY + canvasscrollable.scrollTop - canvas.offsetTop; 
			ox = ox / editorZoomPrct;
			oy = oy / editorZoomPrct;
            if (editortool == "pen") drawlineat(x, y, ox, oy);
            if (editortool == "eraser") eraseXY(x,y);
			if (editortool == "liner") {
				previewLine.setAttribute("x2",event.touches[0].clientX + "px"); previewLine.setAttribute("y2",event.touches[0].clientY + "px");
			}
        } catch { }
        oldevent = event;
        event.preventDefault();
    })
	
	function down(e) {
		console.log("down!")
		if ((!editorlock) && (!isCropping)) { isdrawing = true; e.preventDefault(); }else {return;}
		console.log("drawing!")
		var x = e.offsetX ? e.offsetX : e.touches[0].clientX + canvasscrollable.scrollLeft - canvas.offsetLeft; 
		var y = e.offsetY ? e.offsetY : e.touches[0].clientY + canvasscrollable.scrollTop - canvas.offsetTop; 
		x = x / editorZoomPrct;
		y = y / editorZoomPrct;
		if (editortool == "liner") {
			previewLine.style.display = "";previewLine.setAttribute("x1",x + "px");previewLine.setAttribute("y1",y + "px");
			previewLine.style.stroke = currentcolor;
			previewLine.style.strokeWidth = lineW + "px";
		} 
		editordrawstartpos = {x:x,y:y}
	}
	
	canvas.addEventListener("mousedown", down);
	canvas.addEventListener("touchstart", down);

	function rgbToHex(r, g, b) {
		if (r > 255 || g > 255 || b > 255)
			throw "Invalid color values";
		return ((r << 16) | (g << 8) | b).toString(16);
	}
	
	function up(e) {
		console.log("up...")
		if (editorlock || isCropping) {return;}
		var x = e.offsetX ? e.offsetX : oldevent.touches[0].clientX + canvasscrollable.scrollLeft - canvas.offsetLeft; 
		var y = e.offsetY ? e.offsetY : oldevent.touches[0].clientY + canvasscrollable.scrollTop - canvas.offsetTop; 
		x = x / editorZoomPrct;
		y = y / editorZoomPrct;
		if (editortool == "pickcolor") {
			const data = ctx.getImageData(x, y, 1, 1).data;

			// RED   = data[0]
			// GREEN = data[1]
			// BLUE  = data[2]
			// ALPHA = data[3]
			
			currentcolor = `rgba(${data[0]},${data[1]},${data[2]},${data[3]})`
			editorcolorselect.value = "#" + rgbToHex(data[0],data[1],data[2]);
			editoropacityselect.value = data[3]
		}
		if (editortool == "liner") {
			drawlineat(parseInt(previewLine.getAttribute("x1"), 10), parseInt(previewLine.getAttribute("y1"), 10), x, y, lineW);
			previewLine.style.display = "none";
		}
		if (editortool == "circle") {
			var radius = (Math.abs((x - editordrawstartpos.x) + (y - editordrawstartpos.y)) / 2)// * editorZoomPrct
			drawcircleat(editordrawstartpos.x,editordrawstartpos.y,radius,false)
		}
		if (editortool == "fcircle") {
			var radius = (Math.abs((x - editordrawstartpos.x) + (y - editordrawstartpos.y)) / 2)// * editorZoomPrct
			drawcircleat(editordrawstartpos.x,editordrawstartpos.y,radius,true)
		}
		if (editortool == "rectangle") {
			var sizex = x - editordrawstartpos.x
			var sizey = y - editordrawstartpos.y
			if (e.shiftKey) {
				if (sizex > sizey) sizey = sizex;
				if (sizey > sizex) sizex = sizey;
			}
			drawrectangleat(editordrawstartpos.x,editordrawstartpos.y,sizex,sizey,false)
		}
		if (editortool == "frectangle") {
			var sizex = x - editordrawstartpos.x
			var sizey = y - editordrawstartpos.y
			if (e.shiftKey) {
				if (sizex > sizey) sizey = sizex;
				if (sizey > sizex) sizex = sizey;
			}
			drawrectangleat(editordrawstartpos.x,editordrawstartpos.y,sizex,sizey,true)
		}
		isdrawing = false; oldevent = undefined; drawundos.push(drawundocounter); drawundocounter = 0; 
		e.preventDefault()
	} 

    canvas.addEventListener("mouseup", up);
	canvas.addEventListener("touchend", up);

    editorcolorselect.onchange = function () {
		var colorrgb = rgbcolor(editorcolorselect.value)
		currentcolor = "rgba(" + colorrgb.r + "," + colorrgb.g + "," + colorrgb.b + "," + (editoropacityselect.value / 255) + ")";
    }
	
	editoropacityselect.onchange = function () {
		var colorrgb = rgbcolor(editorcolorselect.value)
		currentcolor = "rgba(" + colorrgb.r + "," + colorrgb.g + "," + colorrgb.b + "," + (editoropacityselect.value / 255) + ")";
    }
	
	function rgbcolor(color) {
		const r = parseInt(color.substr(1,2), 16)
		const g = parseInt(color.substr(3,2), 16)
		const b = parseInt(color.substr(5,2), 16)
		return {r:r,g:g,b:b}
	}
	
    editorsizenum.value = lineW;
    editorsizenum.onchange = function () {
        lineW = editorsizenum.value;
    }

    effectsbutton.onclick = function () {
        showhideelem(effectsmenu)
    }

    editorTools.onclick = function () {
        showhideelem(editorToolsMenu)
    }

    Array.prototype.forEach.call(editorToolsMenu.querySelectorAll("button"), (item) => {
        item.onclick = function () {
			if (item.getAttribute("data-toolname") == "cropper") {
				canvasscrollable.appendChild(cropresizeable);
				cropresizeable.style.top = "0px";
				cropresizeable.style.left = "0px";
				cropresizeable.style.width = canvas.style.width;
				cropresizeable.style.height = canvas.style.height;
				dontcentereditorimage = true;
				editorApplyZoom();
				isCropping = true;
			}else {
				editortool = item.getAttribute("data-toolname");
				editorTools.innerHTML = item.innerHTML;
			}
        }
    });

    //editorMain.addEventListener("mousedown", function (event) {
    //    if (event.target == effectsmenu) return;
    //    effectsmenu.style.display = "none"
    //})

    effects_darkerbutton.onclick = function () { makeDarker(); drawing.push({ type: "darker" }); drawundos.push(1) };

    effects_lighterbutton.onclick = function () { makeLighter(); drawing.push({ type: "lighter" }); drawundos.push(1) };
	
	effects_reversebutton.onclick = function () { reverse(); drawing.push({ type: "reverse" }); drawundos.push(1) }
	
	effects_grayscalebutton.onclick = function () { grayScale(); drawing.push({ type: "grayscale" }); drawundos.push(1) }
	
	effects_redonlybutton.onclick = function () { only(0); drawing.push({ type: "only", channel: 0}); drawundos.push(1) }
	effects_greenonlybutton.onclick = function () { only(1); drawing.push({ type: "only", channel: 1}); drawundos.push(1) }
	effects_blueonlybutton.onclick = function () { only(2); drawing.push({ type: "only", channel: 2}); drawundos.push(1) }
	effects_alphaonlybutton.onclick = function () { only(3); drawing.push({ type: "only", channel: 3}); drawundos.push(1) }
	
	effects_disabletransparencybutton.onclick = function () { disableTransparency(); drawing.push({ type: "disabletransparency" }); drawundos.push(1) }

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
	ipcRenderer.on("undoEditor", (event, dt) => editorUndoButton.click());
    isEditorInited = true;
}