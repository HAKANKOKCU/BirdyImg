const versionstring = "1.0 Beta 12"

const { ipcRenderer } = require("electron");

const starOutlined = `<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="m8.85 17.825 3.15-1.9 3.15 1.925-.825-3.6 2.775-2.4-3.65-.325-1.45-3.4-1.45 3.375-3.65.325 2.775 2.425ZM5.825 22l1.625-7.025L2 10.25l7.2-.625L12 3l2.8 6.625 7.2.625-5.45 4.725L18.175 22 12 18.275ZM12 13.25Z"/></svg>`
const starFilled = `<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="m5.825 22 1.625-7.025L2 10.25l7.2-.625L12 3l2.8 6.625 7.2.625-5.45 4.725L18.175 22 12 18.275Z"/></svg>`

function showhideelem(element) {
	if (element.style.display == "block") {
		element.style.opacity = "0"
		setTimeout(function() {
			element.style.display = "none"
		},200)
	} else {
		element.style.display = "block"
		requestAnimationFrame(function() {
			element.style.opacity = "1"
		})
	}
}

function createElementWithContainerAndLangString(langstring,type,container) {
	var elem = document.createElement(type);
	elem.setAttribute("data-fromlang", langstring);
	container.appendChild(elem);
	applyTranslations();
	return elem;
}

//for dedecting touchscreens (REMOVED.)
//window.isTouch = false
//document.body.addEventListener("touchstart",function() {isTouch = true;console.log("its touch!")})
//document.body.addEventListener("mousedown",function() {isTouch = false;console.log("its NOT touch!")})

const RESIZE_BORDER_SIZE = 4;
let imgViewCnt = document.getElementById("imgView");
let mainimgcont = document.getElementsByTagName("imgmain")[0];
let maincont = document.getElementsByTagName("main")[0];
//let loadingText = document.getElementById("loading");
let tabSwitcher = document.getElementById("tabSwitcher");

// Toolbar buttons:

let prvFileButton = document.getElementById("prvFileButton");
let nextFileButton = document.getElementById("nextFileButton");
//----
let zoomInButton = document.getElementById("zoomInButton");
let zoomOutButton = document.getElementById("zoomOutButton");
//----
let fitScreenButton = document.getElementById("fitScreenButton");
//----
let rotateLeftButton = document.getElementById("rotateLeftButton");
let rotateRightButton = document.getElementById("rotateRightButton");
//----
let showGalleryViewButton = document.getElementById("showGalleryView");
//----
let addToFavorites = document.getElementById("addToFavorites");
let enterEditorButton = document.getElementById("enterEditorButton");
//----
let deleteFileButton = document.getElementById("deleteFile");
//----
let copyFileButton = document.getElementById("copyImageButton");
let openFileButton = document.getElementById("openFileButton");

//Left and right buttons:

let leftButton = document.getElementsByClassName("leftbutton")[0];
let rightButton = document.getElementsByClassName("rightbutton")[0];

// Add events to buttons:

prvFileButton.addEventListener("click", prvFile);
nextFileButton.addEventListener("click", nextFile);
zoomInButton.addEventListener("click", zoomIn);
zoomOutButton.addEventListener("click", zoomOut);
openFileButton.addEventListener("click", openFile);
rotateLeftButton.addEventListener("click", rotL);
rotateRightButton.addEventListener("click", rotR);
fitScreenButton.addEventListener("click", fullimg);
fitScreenButton.addEventListener("contextmenu", fullimagesize);
enterEditorButton.addEventListener("click", enterEditor);
enterEditorButton.addEventListener("click", loadFileInEditor);
copyFileButton.addEventListener("click", copyCurrentImage);
addToFavorites.addEventListener("click", addIMGToFavorites)
showGalleryViewButton.addEventListener("click",showGalleryViewFullScreen)
deleteFileButton.addEventListener("click",deleteCurrentFile)
leftButton.addEventListener("click", prvFile);
rightButton.addEventListener("click", nextFile);

function deleteCurrentFile() {
	ipcRenderer.send("deleteCurrentFile",tabs[tabID].fileInf.path)
}

//editor
ipcRenderer.on("editIMG",(event,data) => {
	enterEditor();
	if (data == true) loadFileInEditor()
})
//---

var dragging = false;
var oldpos = {
	"x": 0,
	"y": 0
}
window.tabs = {};
window.tabID;
var langs;
var hiddenpart = document.getElementsByTagName("hiddenpart")[0];
//tabs[tabID].ghostImg.style.opacity = "0";
var isRoted = false;
var mouseX = 0, mouseY = 0;
var newtabid = 0;

var tabCount = 0;

function newTab() {
	try {
		if (!settingsdata.enableTabs) if (tabCount > 0) { console.log("no."); return; }
	}catch (e) {console.log(e)}
	var tabdiv = document.createElement("div")
	var view = document.createElement("img");
	try {
		view.style.background = settingsdata.showTransparencyTexture == true ? 'url("./bitmap/transparencysquares.png")' : ""
		view.style.imageRendering = settingsdata.imageRenderingType == 1 ? "pixelated" : settingsdata.imageRenderingType == 2 ? "crisp-edges" : ""
	}catch(e) {console.log(e)}
	tabdiv.classList.add("tabdiv")
	tabdiv.appendChild(view);
	tabdiv.setAttribute("BIMG-TabID", newtabid);
	view.setAttribute("BIMG-TabID", newtabid);
	imgViewCnt.appendChild(tabdiv);
	var tswitch = document.createElement("div");
	var tswitchHeader = document.createElement("span");
	tswitchHeader.classList.add("tabHeader");
	try {
		tswitchHeader.innerText = langpack.newTab;
	} catch {
		window.retint = setInterval(function () {
			try {
				tswitchHeader.innerText = langpack.newTab;
				clearInterval(retint);
			} catch { }
		}, 100)
	}
	tswitch.appendChild(tswitchHeader)
	var tswitchClose = document.createElement("span");
	tswitchClose.classList.add("tabClose");
	tswitchClose.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20"><path d="M6.062 15 5 13.938 8.938 10 5 6.062 6.062 5 10 8.938 13.938 5 15 6.062 11.062 10 15 13.938 13.938 15 10 11.062Z"/></svg>';
	tswitch.appendChild(tswitchClose)
	tswitch.setAttribute("BIMG-TabID", newtabid);
	tabSwitcher.appendChild(tswitch);
	var loadingcir = document.createElement("div")
	loadingcir.classList.add("loader")
	loadingcir.id = "loading"
	loadingcir.innerHTML = '<svg class="circular" viewBox="25 25 50 50"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2"stroke-miterlimit="20" /></svg>'
	tabdiv.appendChild(loadingcir)
	tabs[newtabid] =
	{
		imgX: 0,
		imgY: 0,
		imgW: 0,
		imgH: 0,
		fileInf: null,
		imgView: view,
		fileID: null,
		filelist: null,
		filesizes: null,
		rot: 0,
		zoomPrct: 1,
		loadingCir:loadingcir,
		ghostImg: document.createElement("img"),
		tabdiv: tabdiv,
		id:newtabid
	}
	var ndi = newtabid;
	tswitchClose.addEventListener("click", function () {
		closeTab(ndi);
	});
	tswitchHeader.addEventListener("click", function () { switchTab(ndi) });
	view.addEventListener("load", function () {
		imageLoaded(ndi);
	});
	ipcRenderer.sendSync("newtab", newtabid);
	newtabid++;
	tabCount++;
	autoHideTabs()
	switchTab(ndi);
}
var currentTabItemHeader;
function switchTab(id) {
	var imgs = imgViewCnt.querySelectorAll("div");
	Array.prototype.forEach.call(imgs, (item) => {
		if (item.getAttribute("BIMG-TabID") == id) {
			item.style.display = "";
			var filname
			try {
				filname = getFileName(tabs[id].fileInf.path);
			} catch { }
			if (filname == null)
				document.title = "BirdyImg";
			else
				document.title = "BirdyImg - " + filname + " (" + tabs[id].imgW + "x" + tabs[id].imgH + ")";
		} else {
			if (item.getAttribute("data-nohide") != "true") item.style.display = "none";
		}
	});
	var tis = tabSwitcher.querySelectorAll("div");
	Array.prototype.forEach.call(tis, (item) => {
		if (item.getAttribute("BIMG-TabID") == id) {
			item.classList.add("active");
			currentTabItemHeader = item;
			tabSwitcher.scrollLeft = currentTabItemHeader.offsetLeft - (tabSwitcher.offsetWidth / 2) + (currentTabItemHeader.offsetWidth / 2);
		} else {
			item.classList.remove("active");
		}
	});
	tabID = id;
	ipcRenderer.sendSync("switchtab", tabID);
	var filfo = tabs[tabID].fileInf;
	Array.prototype.forEach.call(document.querySelectorAll("[paneid='FileInfo']"), (item) => {
		var pane = item.querySelector(".panecontent");
		var selectedsval = pane.getElementsByClassName("PKAbleSizeSelect")[0].value;
		pane.innerHTML = generateFileInfoContent();
		var PKAbleSelect = pane.getElementsByClassName("PKAbleSizeSelect")[0];
		var PKAbleUpdate = pane.getElementsByClassName("PKAbleSizeUpdateSpan")[0];
		var opendir = pane.getElementsByClassName("opendir")[0];
		PKAbleSelect.addEventListener("change", function () {
			PKAbleUpdate.innerHTML = Math.max(filfo.stats.size / PKAbleSelect.value, 0.1).toFixed(1).toString();
		});
		opendir.addEventListener("click", function () {
			ipcRenderer.send("launchpath", getFolderPath(filfo.path));
		});
		PKAbleSelect.value = selectedsval;
		PKAbleUpdate.innerHTML = Math.max(filfo.stats.size / PKAbleSelect.value, 0.1).toFixed(1).toString();
	})
	var fil = document.getElementsByClassName("fileListItem");
	Array.prototype.forEach.call(fil, (item) => {
		if (item.getAttribute("data-imageid") == tabs[tabID].fileID) {
			item.style.backgroundColor = "lightgray";
			item.parentElement.parentElement.scrollTop = item.offsetTop - (item.parentElement.parentElement.offsetHeight / 2) + (item.offsetHeight / 2);
		} else {
			item.style.backgroundColor = ""
		}
	})
	try {
		var filfo = tabs[tabID].fileInf.path;
		addToFavorites.innerHTML = settingsdata.favorites.includes(filfo) ? starFilled : starOutlined;
		addToFavorites.title = settingsdata.favorites.includes(filfo) ? langpack.removeFromFavorites : langpack.addToFavorites;
	}catch{}
}

function closeTab(id) {
	var index = Object.keys(tabs).indexOf(id.toString())
	var elemTitle = tabSwitcher.querySelector("div[BIMG-TabID=\"" + id + "\"]");
	tabSwitcher.removeChild(elemTitle);
	var elemimg = imgViewCnt.querySelector("img[BIMG-TabID=\"" + id + "\"]");
	elemimg.src = "";
	imgViewCnt.removeChild(tabs[id].tabdiv);
	try {
		hiddenpart.removeChild(tabs[id].ghostImg);
		tabs[id].ghostImg.src = "";
	} catch { }
	delete tabs[id];
	tabCount--;
	ipcRenderer.send("closeTab", id);
	autoHideTabs()
	
	if (Object.keys(tabs).length == 0) {
		if (settingsdata["whenAllTabsAreClosed"] == 1) {
			ipcRenderer.send("close","")
		}
		if (settingsdata["whenAllTabsAreClosed"] == 2) {
			newTab()
		}
	}else {
		if (id == tabID) {
			if (id >= Object.keys(tabs)[Object.keys(tabs).length - 1]) {
				switchTab(Object.keys(tabs)[Object.keys(tabs).length - 1])
			}else if (id == 0) {
				switchTab(Object.keys(tabs)[0])
			}else {
				switchTab(Object.keys(tabs)[index])
			}
		}
	}
}

//newTab(); will be sent by main
// for menu items:
ipcRenderer.on("createnewtab", (event, data) => { newTab() });
ipcRenderer.on("closecurrenttab", (event, data) => { closeTab(tabID) });

ipcRenderer.on("settingsdata", (event, data) => { //Get settings data
	window.settingsdata = data;
	applySettings() //And apply it
});
ipcRenderer.on("langs", (event, data) => { //Language list
	langs = data;
});
window.parser = new DOMParser();
ipcRenderer.on("filedata", (event, data) => { //Open the file
	if (tabCount == 0) newTab()
	if (data.filedata != undefined) {
		var xmlDoc = parser.parseFromString(data.filedata,"text/xml");
		console.log(xmlDoc)
		var bii = xmlDoc.getElementsByTagName("svg")[0].getElementsByTagName("birdy-image-info")[0];
		//console.log(bii.getElementsByTagName("title")[0].textContent)
		data.exif = {
			ImageDescription: bii.getElementsByTagName("title")[0].textContent,
			Artist: bii.getElementsByTagName("author")[0].textContent,
			XPComment: bii.getElementsByTagName("description")[0].textContent,
			XPSubject: bii.getElementsByTagName("subject")[0].textContent,
			XPKeywords: bii.getElementsByTagName("tags")[0].textContent,
			Rating: bii.getElementsByTagName("rating")[0].textContent,
		}
	}
	hiddenpart.appendChild(tabs[tabID].ghostImg);
	if (typeof slideshowtimer == "undefined") {
		document.title = "BirdyImg - " + getFileName(data.path);
	}
	tabs[tabID].loadingCir.style.display = "";
	console.log(data);
	if (data.useDURL == true) {
		//TIFFParser();
		TIFFParser.prototype.reset()
		var tiff = TIFFParser.prototype.parseTIFF(typedArrayToBuffer(data.DURL));
		let dataurl = tiff.toDataURL("image/png", 1.0);
		tabs[tabID].imgView.src = dataurl;
		tabs[tabID].ghostImg.src = dataurl;
	} else {
		tabs[tabID].imgView.src = data.path;
		tabs[tabID].ghostImg.src = data.path;
	}
	tabs[tabID].fileInf = data;
	tabs[tabID].imgX = 0;
	isRoted = false;
	tabs[tabID].imgY = 0;
	tabs[tabID].imgW = tabs[tabID].fileInf.size.width;
	tabs[tabID].imgH = tabs[tabID].fileInf.size.height;
	function imgloaded() {
		tabs[tabID].imgW = tabs[tabID].ghostImg.clientWidth;
		tabs[tabID].imgH = tabs[tabID].ghostImg.clientHeight;
		console.log("set width", tabs[tabID].imgW, tabs[tabID].imgH);
		if (typeof slideshowtimer == "undefined") {
			document.title = "BirdyImg - " + getFileName(data.path) + " (" + tabs[tabID].imgW + "x" + tabs[tabID].imgH + ")";
		}
	}
	if (tabs[tabID].ghostImg.complete) {
		imgloaded()
	} else {
		setTimeout(imgloaded, 100)
	}
	tabs[tabID].zoomPrct = 1;
	tabs[tabID].rot = 0;
	try {
		while (tabs[tabID].imgW * tabs[tabID].zoomPrct > imgViewCnt.offsetWidth) {
			tabs[tabID].zoomPrct -= 0.1
		}
	} catch { }
	try {
		while (tabs[tabID].imgH * tabs[tabID].zoomPrct > imgViewCnt.offsetHeight) {
			tabs[tabID].zoomPrct -= 0.1
		}
	} catch { }
	if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
	}
	if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
	}
	currentTabItemHeader.getElementsByClassName("tabHeader")[0].title = currentTabItemHeader.getElementsByClassName("tabHeader")[0].innerText = getFileName(data.path);
	try {clearInterval(retint);}catch {}
	//posImg();
	var filfo = tabs[tabID].fileInf;
	Array.prototype.forEach.call(document.querySelectorAll("[paneid='FileInfo']"), (item) => {
		var pane = item.querySelector(".panecontent");
		var selectedsval = pane.getElementsByClassName("PKAbleSizeSelect")[0].value;
		pane.innerHTML = generateFileInfoContent();
		var PKAbleSelect = pane.getElementsByClassName("PKAbleSizeSelect")[0];
		var PKAbleUpdate = pane.getElementsByClassName("PKAbleSizeUpdateSpan")[0];
		var opendir = pane.getElementsByClassName("opendir")[0];
		PKAbleSelect.addEventListener("change", function () {
			if (PKAbleSelect.value != 1)
				PKAbleUpdate.innerHTML = Math.max(filfo.stats.size / PKAbleSelect.value, 0.1).toFixed(1).toString();
			else
				PKAbleUpdate.innerHTML = (filfo.stats.size / PKAbleSelect.value).toString()
		});
		opendir.addEventListener("click", function () {
			ipcRenderer.send("launchpath", getFolderPath(filfo.path));
		});
		PKAbleSelect.value = selectedsval;
		PKAbleUpdate.innerHTML = Math.max(filfo.stats.size / PKAbleSelect.value, 0.1).toFixed(1).toString();
	})
	//var fil = document.getElementsByClassName("fileListItem");
	//tabs[tabID].fileID = data.fileID;
	//Array.prototype.forEach.call(fil, (item) => {
	//	if (item.getAttribute("data-imageid") == tabs[tabID].fileID) {
	//		item.style.backgroundColor = "lightgray";
	//		item.parentElement.parentElement.scrollTop = item.offsetTop - (item.parentElement.parentElement.offsetHeight / 2) + (item.offsetHeight / 2);
	//	} else {
	//		item.style.backgroundColor = ""
	//	}
	//})
	//if (data.saveToHistory == true) {
	settingsdata["history"].push(data.path);
	ipcRenderer.send('savesettings', settingsdata);
	//}
	addToFavorites.innerHTML = settingsdata.favorites.includes(filfo.path) ? starFilled : starOutlined;
	addToFavorites.title = settingsdata.favorites.includes(filfo.path) ? langpack.removeFromFavorites : langpack.addToFavorites;
});

function autoHideTabs() {
	if (settingsdata["autoHideTabs"]) {
		if (settingsdata["enableTabs"]) {
			tabSwitcher.style.display = Object.keys(tabs).length < 2 ? "none" : "";
		}
	}
}

let extraStyling = document.createElement("style") //For some customization options.
document.documentElement.appendChild(extraStyling)

function applySettings() { //Apply settings
	tabSwitcher.style.display = settingsdata["enableTabs"] == true ? "" : "none";
	mainimgcont.style.overflow = settingsdata["enableOffImageRendering"] == true ? "visible" : "";
	imgViewCnt.style.overflow = settingsdata["enableOffImageRendering"] == true ? "visible" : "";
	tabSwitcher.style.backdropFilter = settingsdata["blurOverlays"] == true ? "blur(5px)" : "";
	//console.log(settingsdata)
	Array.prototype.forEach.call(document.querySelectorAll("img[bimg-tabid]"),(view)=> {
		//console.log(view)
		view.style.background = settingsdata.showTransparencyTexture == true ? 'url("./bitmap/transparencysquares.png")' : ""
		view.style.imageRendering = settingsdata.imageRenderingType == 1 ? "pixelated" : settingsdata.imageRenderingType == 2 ? "crisp-edges" : ""
	})
	Array.prototype.forEach.call(document.querySelectorAll("toolbar.newsupported"),(item)=> {
		item.style.borderRadius = settingsdata["classicToolbar"] == false ? "10px 10px 0 0" : "";
		item.style.backdropFilter = settingsdata["blurOverlays"] == true ? "blur(5px)" : "";
		item.style.position = "relative";
		item.style.transform = "translate(-50%, 0)";
		item.style.left = "50%";
	})
	zoominf.style.backdropFilter = settingsdata["blurOverlays"] == true ? "blur(5px)" : "";
	Array.prototype.forEach.call(document.querySelectorAll("toolbar"),(item)=> {
		if (item.getAttribute("data-width") != null) {
			item.style.maxWidth = settingsdata["classicToolbar"] == true ? "100%" : (item.getAttribute("data-width") * settingsdata["toolbarSizeScale"]) + "px"
		}else {
			item.style.width = "100%"
		}
		item.style.height = (30 * settingsdata["toolbarSizeScale"]) + "px"
	})
	Array.prototype.forEach.call(document.querySelectorAll(".bottomtoolbarsize"),(item)=> {
		item.style.bottom = (30 * settingsdata["toolbarSizeScale"]) + "px"
	})
	if (settingsdata["colors"]["enableCustomColors"] == true) {
		document.body.style.accentColor = settingsdata["colors"]["accentColor"]["value"]
		if (settingsdata["colors"]["accentColor"]["applyToToolbarButtons"] == true) {
			extraStyling.innerHTML = "svg {fill: " + settingsdata["colors"]["accentColor"]["value"] + "} body {--accentcolor:"+ settingsdata["colors"]["accentColor"]["value"];
			if (settingsdata["colors"]["accentColor"]["applyAsTextColor"]) {
				extraStyling.innerHTML += ";color:" + settingsdata["colors"]["accentColor"]["value"] + "; --textcolor: " + settingsdata["colors"]["accentColor"]["value"] + "} button,input,select {color:" + settingsdata["colors"]["accentColor"]["value"] + ";}"
			}else {
				extraStyling.innerHTML += "}"
			}
		}else {
			extraStyling.innerHTML = "body {--accentcolor:"+ settingsdata["colors"]["accentColor"]["value"] + "}"
		}
	}else {
		document.body.style.accentColor = ""
		extraStyling.innerHTML = ""
	}
	extraStyling.innerHTML += "toolbar>button>svg {transform: scale(" + settingsdata["toolbarSizeScale"] + ");} toolbar>button {width: " + (30 * settingsdata["toolbarSizeScale"]) + "px;height: " + (30 * settingsdata["toolbarSizeScale"]) + "px} #imgView {max-height: calc(100% - " + (30 * settingsdata["toolbarSizeScale"]) + "px)}" + (settingsdata["blurOverlays"] == true ? ".pane {backdrop-filter:blur(5px)}" : "")
	autoHideTabs()
}

function typedArrayToBuffer(array) { //Converts array to a buffer.
    return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
}

ipcRenderer.on("filelist", (event, data) => { //Get file list in folder
	tabs[tabID].filelist = data.list;
	tabs[tabID].filesizes = data.filesizes;
	tabs[tabID].fileID = data.fileID;
	var fil = document.getElementsByClassName("fileListItem");
	Array.prototype.forEach.call(fil, (item) => {
		if (item.getAttribute("data-imageid") == tabs[tabID].fileID) {
			item.style.backgroundColor = "lightgray";
			item.parentElement.parentElement.scrollTop = item.offsetTop - (item.parentElement.parentElement.offsetHeight / 2) + (item.offsetHeight / 2);
		} else {
			item.style.backgroundColor = ""
		}
	})
});

ipcRenderer.on("showfilelist", (event, data) => {
	showfList();
})

function showfList() {
	var HTMLs = "<h1>" + langpack.fileList + "</h1><input class='linedelem search sticky' placeholder='" + langpack.search + "'></input>"
	// tabs[tabID].filelist.forEach((item, index) => {
		// var extraCSSLI = "";
		// if (index == tabs[tabID].fileID) { extraCSSLI = "background-color:lightgray" }
		// HTMLs += "<div class='fileListItem' data-imageid='" + index + "' style='" + extraCSSLI + "' tabindex='-1'><center>" + ( (getFileExtension(item) == "tif" || getFileExtension(item) == "tiff") ? getFileName(item) : "<img loading='lazy' class='limon darkshandow'>" ) + "</center></div>"
	// });
	var pane = openPane(HTMLs, "filelist");
	// var listelem = pane.getElementsByClassName("fileListItem")
	var listelem = [];
	tabs[tabID].filelist.forEach((item, index) => {
		var maindiv = document.createElement("div")
		maindiv.setAttribute("data-imageid",index)
		maindiv.classList.add("fileListItem")
		if (index == tabs[tabID].fileID) {
			maindiv.style.background = "lightgray";
		}
		maindiv.tabIndex = "0";
		if (getFileExtension(item) == "tif" || getFileExtension(item) == "tiff") {
			maindiv.innerText = getFileName(item)
		}else {
			var img = document.createElement("img");
			img.classList.add("limon","darkshandow");
			img.alt = item;
			img.src = item;
			maindiv.appendChild(img);
		}
		pane.appendChild(maindiv);
		maindiv.title = getFileName(item) + "\n" + langpack.fileSize + ": " + getReadableFileSizeString(tabs[tabID].filesizes[index])[0];
		maindiv.addEventListener("click", function () {
			ipcRenderer.send("openfilep", item)
		})
		listelem.push(maindiv);
	})
	// Array.prototype.forEach.call(listelem, (item) => {
		// var id = item.getAttribute("data-imageid");
		// var fitem = tabs[tabID].filelist[id];
		// item.title = getFileName(fitem) + "\n" + langpack.fileSize + ": " + getReadableFileSizeString(tabs[tabID].filesizes[id])[0];
		// var img = item.getElementsByTagName("img")[0]
		// if (img != undefined) {
			// img.alt = fitem
			// img.src = fitem
		// }
		// item.addEventListener("click", function () {
			// ipcRenderer.send("openfilep", fitem)
		// })
	// })
	var searchbox = pane.getElementsByClassName("search")[0]
	searchbox.addEventListener("change",function() {
		var query = searchbox.value;
		Array.prototype.forEach.call(listelem, (item) => {
			var fitem = tabs[tabID].filelist[item.getAttribute("data-imageid")];
			item.style.display = fitem.includes(query) ? "" : "none"
		})
	})
}

ipcRenderer.on("langpack", (event, data) => { //This will give language pack.
	window.langpack = data;
	//loadingText.innerText = langpack.loadingImage;
	applyTranslations(); //Apply translations at buttons etc.
});
ipcRenderer.on("imageinfo", (event, data) => { //For menu/contextmenu item
	openFileInfo();
});

function openFileInfo() { // File info pane opener.
	var filfo = tabs[tabID].fileInf;
	var pane = openPane(generateFileInfoContent(), "FileInfo"); //Get html from function and give the id for the pane.
	//For file info stuff:
	var PKAbleSelect = pane.getElementsByClassName("PKAbleSizeSelect")[0];
	var PKAbleUpdate = pane.getElementsByClassName("PKAbleSizeUpdateSpan")[0];
	var opendir = pane.getElementsByClassName("opendir")[0];
	PKAbleSelect.addEventListener("change", function () {
		PKAbleUpdate.innerHTML = Math.max(filfo.stats.size / PKAbleSelect.value, 0.1).toFixed(1).toString();
	});
	//To make the link to open the parent directory work
	opendir.addEventListener("click", function () {
		ipcRenderer.send("launchpath", getFolderPath(filfo.path));
	});
}

function generateFileInfoContent() { //Generates HTML in file info pane.
	var filfo = tabs[tabID].fileInf;
	var namestr = getFileName(filfo.path).replace(/</g,"&lt;").replace(/>/g,"&gt;");
	//var fnstr;
	//if (namestr.length > 24) {
	//	fnstr = "<marquee>" + namestr + "</marquee>"
	//}else {
	//	fnstr = namestr
	//}
	var pathstr = filfo.path.replace(/</g,"&lt;").replace(/>/g,"&gt;");
	var pstr;
	if (pathstr.length > 24) {
		pstr = "<marquee title='" + pathstr + "'>" + pathstr + "</marquee>"
	} else {
		pstr = pathstr
	}
	//EXIF stuff:
	var desc = filfo.exif.XPComment
	//console.log(parseArrayToString(desc));
	if (desc == undefined) {desc = "???"} else {desc = parseArrayToString(desc).replace(/</g,"&lt;").replace(/>/g,"&gt;")}
	var sub = filfo.exif.XPSubject
	//console.log(parseArrayToString(sub));
	if (sub == undefined) {sub = "???"} else {sub = parseArrayToString(sub).replace(/</g,"&lt;").replace(/>/g,"&gt;")}
	var aut = filfo.exif.Artist;
	if (aut == undefined) {aut = "???"}
	var rat = filfo.exif.Rating;
	if (rat == undefined) {rat = "???"}
	var tit = filfo.exif.ImageDescription;
	if (tit == undefined) {tit = "???"}
	var tags = filfo.exif.XPKeywords
	//console.log(parseArrayToString(sub));
	if (tags == undefined) {tags = "???"} else {tags = parseArrayToString(tags).replace(/</g,"&lt;").replace(/>/g,"&gt;")}
	// Return The HTML:
	return "<h1>" + langpack.imageInfo + "</h1><p></p><p class='ilitem'><b>" + langpack.name + "</b>: <span>" + namestr + "</span></p><p class='ilitem'><b>" + langpack.type + ": </b>" + getFileExtension(filfo.path) + "</p><p class='ilitem'><b>" + langpack.width + ": </b>" + tabs[tabID].imgW.toString() + " (" + filfo.size.width + ")" + "</p><p class='ilitem'><b>" + langpack.height + ": </b>" + tabs[tabID].imgH.toString() + " (" + filfo.size.height + ")" + "</p><p class='ilitem'><b>" + langpack.fileSize + ": </b><span class='PKAbleSizeUpdateSpan'>" + Math.max(filfo.stats.size / 1024, 0.1).toFixed(1).toString() + "</span><select class='PKAbleSizeSelect'><option value='1'>B</option><option selected value='1024'>KB</option><option value='1048576'>MB</option></select></p><p class='ilitem'><b>" + langpack.creationDate + ": </b><span>" + DateToString(filfo.stats.ctime) + "</span></p><p class='ilitem'><b>" + langpack.lastModifiedDate + ": </b><span>" + DateToString(filfo.stats.mtime) + "</span></p><p class='ilitem'><b>" + langpack.lastAccessDate + ": </b><span>" + DateToString(filfo.stats.atime) + "</span> </p><p class='ilitem'><b>" + langpack.folder + ": </b><span class='opendir clickable'>" + getFolderName(filfo.path) + "</span></p><p class='ilitem'><b>" + langpack.path + ": </b>" + pstr + "</p><p class='ilitem'><b>" + langpack.title + ": </b>" + tit + "</p><p class='ilitem'><b>" + langpack.description + ": </b>" + desc + "</p><p class='ilitem'><b>" + langpack.subject + ": </b>" + sub + "</p><p class='ilitem'><b>" + langpack.author + ": </b>" + aut + "</p><p class='ilitem'><b>" + langpack.rating + ": </b>" + rat + " / 5</p><p class='ilitem'><b>" + langpack.tags + ": </b>" + tags + "</p>"
}

function parseArrayToString(array) { //Array to string
	if (typeof array != "string") {
		var read = true
		var str = ""
		array.forEach(function(item) {
			if (read) {
				str += String.fromCharCode(item)
			}
			read = !read
		})
		return str
	}else {
		return array
	}
}

function DateToString(date) { //Converts date to string (DD.MM.YYYY HH:NN)
	try {
		return (settingsdata["usemmddyyyydateformat"] ? (date.getMonth() + 1) + "." + date.getDate() + "." + date.getFullYear() : date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear()) + " " + date.getHours() + ":" + date.getMinutes();
	}catch {}
	return "???"
}

ipcRenderer.on("dsimg", (event, data) => fullimagesize())

function fullimagesize() {
	tabs[tabID].zoomPrct = 1;
	tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2);
	tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2);
	animateZoomPos();
	posImg();
	showZoomPrct();
}

ipcRenderer.on("centerimg", (event, data) => {
	tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2);
	tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2);
	animateZoomPos();
	posImg();
})
ipcRenderer.on("showsettings", (event, data) => {
	showSettings();
});

function zRot() {
	try {
		while (tabs[tabID].imgH * tabs[tabID].zoomPrct > imgViewCnt.offsetWidth) {
			tabs[tabID].zoomPrct -= 0.1
		}
	} catch { }
	try {
		while (tabs[tabID].imgW * tabs[tabID].zoomPrct > imgViewCnt.offsetHeight) {
			tabs[tabID].zoomPrct -= 0.1
		}
	} catch { }
	//tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2);
	//tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2);
}

ipcRenderer.on("fullimg", (event, data) => {
	fullimg();
})
function fullimg() {
	tabs[tabID].zoomPrct = 1;
	if (tabs[tabID].rot == 90) {
		zRot();
	} else if (tabs[tabID].rot == 270) {
		zRot();
	} else if (tabs[tabID].rot == -90) {
		zRot();
	} else if (tabs[tabID].rot == -270) {
		zRot();
	} else {
		try {
			while (tabs[tabID].imgW * tabs[tabID].zoomPrct > imgViewCnt.offsetWidth) {
				tabs[tabID].zoomPrct -= 0.1
			}
		} catch { }
		try {
			while (tabs[tabID].imgH * tabs[tabID].zoomPrct > imgViewCnt.offsetHeight) {
				tabs[tabID].zoomPrct -= 0.1
			}
		} catch { }
	}
	tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2);
	tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2);
	animateZoomPos();
	posImg();
	showZoomPrct();
}

addEventListener('resize', (event) => { //When window is resized
	if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
	}
	if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
	}
	posImg();
	retimgIfOut();
});

document.addEventListener('keydown', function (event) {
	console.log(event.target.tagName);
	if (event.target.tagName == "INPUT") return;
	console.log(event.keyCode); //for debugging
	if (!isInEditor) {
		if (event.keyCode == 27) { //ESC
			exitSlideshow()
		}
		if (event.keyCode == 37) { //LEFT ARROW
			prvFile();
		}
		if (event.keyCode == 39) { //RIGHT ARROW
			nextFile();
		}
		if (event.keyCode == 79) { //O
			openFile();
		}
		if (event.ctrlKey) {
			if (event.keyCode == 84) { // T
				newTab();
			}
			if (event.shiftKey) {
				if (event.keyCode == 9) { //TAB
					tabID--;
					if (tabID < 0) {
						tabID = 0;
					}
					switchTab(tabID);
				}
			} else {
				if (event.keyCode == 9) { //TAB
					tabID++;
					if (tabID == tabCount) {
						tabID = tabCount - 1;
					}
					switchTab(tabID);
				}
			}
		}
	}
});
document.addEventListener("mousemove", function (event) { //When mouse moved set x and y
	mouseX = event.x;
	mouseY = event.y;
})

function riNR() {
	if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
		tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
	} else if (tabs[tabID].imgX > 0) { tabs[tabID].imgX = 0 } else if (tabs[tabID].imgX < -((tabs[tabID].imgW * tabs[tabID].zoomPrct) - imgViewCnt.offsetWidth)) { tabs[tabID].imgX = -((tabs[tabID].imgW * tabs[tabID].zoomPrct) - imgViewCnt.offsetWidth) }

	if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
		tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
	} else if (tabs[tabID].imgY > 0) { tabs[tabID].imgY = 0 } else if (tabs[tabID].imgY < -((tabs[tabID].imgH * tabs[tabID].zoomPrct) - imgViewCnt.offsetHeight)) { tabs[tabID].imgY = -((tabs[tabID].imgH * tabs[tabID].zoomPrct) - imgViewCnt.offsetHeight) }
}

//function riHR() {
//	if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
//		tabs[tabID].imgX = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
//	} else if (tabs[tabID].imgX > 0) { tabs[tabID].imgX = 0 } else if (tabs[tabID].imgX < -((tabs[tabID].imgW * tabs[tabID].zoomPrct) - imgViewCnt.offsetHeight)) { tabs[tabID].imgX = -((tabs[tabID].imgW * tabs[tabID].zoomPrct) - imgViewCnt.offsetHeight) }
//
//	if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
//		tabs[tabID].imgY = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
//	} else if (tabs[tabID].imgY > 0) { tabs[tabID].imgY = 0 } else if (tabs[tabID].imgY < -((tabs[tabID].imgH * tabs[tabID].zoomPrct) - imgViewCnt.offsetWidth)) { tabs[tabID].imgY = -((tabs[tabID].imgH * tabs[tabID].zoomPrct) - imgViewCnt.offsetWidth) }
//}

function retimgIfOut() { //When image is at place it should not be at, Revert it
	if (tabs[tabID].rot == 90) {
		//	riHR();
	} else if (tabs[tabID].rot == 270) {
		//	riHR();
	} else if (tabs[tabID].rot == -90) {
		//	riHR();
	} else if (tabs[tabID].rot == -270) {
		//	riHR();
	} else {
		//console.log("..");
		riNR();
	}
}
imgViewCnt.addEventListener("mousedown", function () { dragging = true })
imgViewCnt.addEventListener("mouseup", function () { dragging = false })
imgViewCnt.addEventListener("touchstart", function (evt) { dragging = true; oldpos = { "x": evt.touches[0].clientX, "y": evt.touches[0].clientY } })
imgViewCnt.addEventListener("touchend", function () { dragging = false })
imgViewCnt.addEventListener("mousemove", function (evt) {
	if (currentGalleryView == null) {
		if (dragging) {
			tabs[tabID].imgX += evt.clientX - oldpos.x;
			tabs[tabID].imgY += evt.clientY - oldpos.y;
			retimgIfOut();
			//console.log(tabs[tabID].imgX,tabs[tabID].imgY);
			posImg();
			showXYInfo();
		}
	}
	oldpos = { "x": evt.clientX, "y": evt.clientY }
})
var oldzoompos = {}
imgViewCnt.addEventListener("touchmove", function (evt) {
	if (currentGalleryView == null) {
		if (evt.targetTouches.length === 1) {
			if (dragging) {
				tabs[tabID].imgX += evt.targetTouches[0].clientX - oldpos.x;
				tabs[tabID].imgY += evt.targetTouches[0].clientY - oldpos.y;
				retimgIfOut();
				//console.log(tabs[tabID].imgX,tabs[tabID].imgY);
				posImg();
				showXYInfo();
			}
			oldpos = { "x": evt.targetTouches[0].clientX, "y": evt.targetTouches[0].clientY }
		}else if (evt.targetTouches.length == 2) { //I think this **doesnt work!**
			console.log("...")
			if (dragging) {
				var change1 = (evt.targetTouches[0].clientX - oldzoompos.x) - (evt.targetTouches[0].clientY - oldzoompos.y)
				var change2 = (evt.targetTouches[1].clientX - oldzoompos.x2) - (evt.targetTouches[1].clientY - oldzoompos.y2)
				var changetotal = change1 + change2
				console.log(changetotal)
				var precentChange = ((tabs[tabID].imgW * tabs[tabID].zoomPrct) + changetotal) / tabs[tabID].imgW * tabs[tabID].zoomPrct
				tabs[tabID].zoomPrct = precentChange
				retimgIfOut();
				//console.log(tabs[tabID].imgX,tabs[tabID].imgY);
				posImg();
				showZoomInf();
			}
			oldzoompos = { "x": evt.targetTouches[0].clientX, "y": evt.targetTouches[0].clientY,"x2": evt.targetTouches[1].clientX, "y2": evt.targetTouches[1].clientY }
		}
		console.log(evt.targetTouches.length)
		event.preventDefault()
	}
})
imgViewCnt.addEventListener("wheel", function (evt) { //When mouse wheel is rotated, zoom in or out
	if (currentGalleryView == null) {
		var oldsizeW = tabs[tabID].imgW * tabs[tabID].zoomPrct;
		var oldsizeH = tabs[tabID].imgH * tabs[tabID].zoomPrct;
		if (evt.deltaY != 0) {
			if (evt.deltaY < 0) {
				zoomIn();
				var sizeW = tabs[tabID].imgW * tabs[tabID].zoomPrct;
				var sizeH = tabs[tabID].imgH * tabs[tabID].zoomPrct;
				if (tabs[tabID].imgW * tabs[tabID].zoomPrct > imgViewCnt.offsetWidth) {
					tabs[tabID].imgX -= ((mouseX - (imgViewCnt.offsetWidth / 2)) / 2) - (oldsizeW - sizeW);
					retimgIfOut();
					animateZoomPos();
				}
				if (tabs[tabID].imgH * tabs[tabID].zoomPrct > imgViewCnt.offsetHeight) {
					tabs[tabID].imgY -= ((mouseY - (imgViewCnt.offsetHeight / 2)) / 2) - (oldsizeH - sizeH);
					retimgIfOut();
					animateZoomPos();
				}
			} else {
				zoomOut();
				var sizeW = tabs[tabID].imgW * tabs[tabID].zoomPrct;
				var sizeH = tabs[tabID].imgH * tabs[tabID].zoomPrct;
				if (tabs[tabID].imgW * tabs[tabID].zoomPrct > imgViewCnt.offsetWidth) {
					tabs[tabID].imgX += ((mouseX - (imgViewCnt.offsetWidth / 2)) / 2) + (oldsizeW - sizeW);
					retimgIfOut();
					animateZoomPos();
				}
				if (tabs[tabID].imgH * tabs[tabID].zoomPrct > imgViewCnt.offsetHeight) {
					tabs[tabID].imgY += ((mouseY - (imgViewCnt.offsetHeight / 2)) / 2) + (oldsizeH - sizeH);
					retimgIfOut();
					animateZoomPos();
				}
			}
			posImg();
		}
	}
})

//function fsize() {
//	tabs[tabID].imgView.style.height = tabs[tabID].imgW * tabs[tabID].zoomPrct;
//	tabs[tabID].imgView.style.width = tabs[tabID].imgH * tabs[tabID].zoomPrct;
//}

function createGalleryView() {
	var cnt = document.createElement("div")
	cnt.classList.add("fillcontainer")
	cnt.style.backgroundColor = "var(--panecolor)"
	cnt.style.display = "grid"
	cnt.style.gap = "10px"
	cnt.style.padding = "20px"
	cnt.style.gridTemplateColumns = "repeat(8, 1fr)"
	cnt.style.overflow = "auto"
	cnt.style.alignItems = "center";
	cnt.style.justifyContent = "center";
	cnt.style.height = "100%"
	cnt.style.width = "100%"
	cnt.style.position = "relative"
	cnt.style.zIndex = "2"
	for (let i = 0; i < tabs[tabID].filelist.length;i++) {
		var image = document.createElement("img");
		//image.style.display = "inline-block"
		image.src = tabs[tabID].filelist[i]
		image.style.maxHeight = "100px";
		image.style.maxWidth = "100%";
		//image.setAttribute("tabindex",0)
		//image.style.margin = "10px"
		image.classList.add("limon","darkshandow","scaleonhover","bghover","clickable")
		image.title = getFileName(tabs[tabID].filelist[i]);
		image.addEventListener("click",function() {
			closeGalleryView();
			ipcRenderer.send("openfilep",tabs[tabID].filelist[i])
		})
		cnt.appendChild(image)
	}
	return cnt
}
window.currentGalleryView = null;
function showGalleryViewFullScreen() {
	if (currentGalleryView == null) { //Toggle gallery view (if its null, open; else, close)
		var view = createGalleryView()
		imgViewCnt.appendChild(view)
		currentGalleryView = view
		//Hide tabs and viewer.
		tabs[tabID].tabdiv.style.display = "none"
		tabSwitcher.style.display = "none"
		document.title = "BirdyImg - " + langpack.galleryView; // Change title to BirdyImg - (Translation for galleryView)
	}else {closeGalleryView()}
}
function closeGalleryView() {
	imgViewCnt.removeChild(currentGalleryView)
	currentGalleryView.innerHTML = ""
	currentGalleryView = null
	// Show tabs and viewer.
	tabs[tabID].tabdiv.style.display = ""
	tabSwitcher.style.display = ""
	document.title = "BirdyImg - " + getFileName(tabs[tabID].fileInf.path) + " (" + tabs[tabID].imgW + "x" + tabs[tabID].imgH + ")"; //Change title to BirdyImg - (File Name) ((Width)x(Height))
	autoHideTabs()
	applySettings()
}

function posImg() { //Position, rotate and scale image
	tabs[tabID].imgView.style.top = tabs[tabID].imgY + "px";
	tabs[tabID].imgView.style.left = tabs[tabID].imgX + "px";
	//if (tabs[tabID].rot == 90) {
	//	fsize();
	//}else if (tabs[tabID].rot == 270) {
	//	fsize();
	//}else if (tabs[tabID].rot == -90) {
	//	fsize();
	//}else if (tabs[tabID].rot == -270) {
	//	fsize();
	//}else {	
	tabs[tabID].imgView.style.width = (tabs[tabID].imgW * tabs[tabID].zoomPrct) + "px";
	tabs[tabID].imgView.style.height = (tabs[tabID].imgH * tabs[tabID].zoomPrct) + "px";
	//}
	//var extStr = "";
	//if (isRoted) {
	//	extStr = " translate(" + (25 * tabs[tabID].zoomPrct) + "% , -" + (25 * tabs[tabID].zoomPrct) + "%)"
	//}
	tabs[tabID].imgView.style.transform = "rotate(" + tabs[tabID].rot + "deg)";
}

var remfunc = null; //For removing timeout when it fires again

function animateZoomPos() {
	if (remfunc != null) {
		clearTimeout(remfunc);
	}
	tabs[tabID].imgView.classList.add("aniLR");
	//setTimeout(functodo ,1);
	remfunc = setTimeout(function () {
		tabs[tabID].imgView.classList.remove("aniLR")
	}, 201)
}

function openFile() { //Opens Open File Dialog
	ipcRenderer.send("openfile", tabID)
}

function prvFile() {
	ipcRenderer.send("prvfile", tabID)
}

function nextFile() {
	ipcRenderer.send("nextfile", tabID)
}

function zoomIn() {
	var icdec = 0.1
	if (tabs[tabID].zoomPrct > 10) {
		icdec = 0.2
	}
	if (tabs[tabID].zoomPrct < 0.3) {
		icdec = 0.01
	}
	tabs[tabID].zoomPrct += icdec;
	if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
	}
	if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
	}
	retimgIfOut();
	posImg();
	showZoomPrct();
}

function zoomOut() {
	var icdec = 0.1
	if (tabs[tabID].zoomPrct > 10) {
		icdec = 0.2
	}
	if (tabs[tabID].zoomPrct < 0.3) {
		icdec = 0.01
	}
	tabs[tabID].zoomPrct -= icdec;
	if (tabs[tabID].zoomPrct <= 0) { tabs[tabID].zoomPrct = 0.01 }
	if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
	}
	if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
	}
	retimgIfOut();
	posImg();
	showZoomPrct();
}

const zoominf = document.getElementById("zoominf");
function showZoomPrct() {
	zoominf.innerText = (langpack["prctAtEnd"] == false ? "%" : "") + Math.floor(tabs[tabID].zoomPrct * 100).toString() + (langpack["prctAtEnd"] == true ? "%" : "");
	showZoomInf();
}

function showXYInfo() {
	if (!settingsdata["showPositionAndSizeInfo"]) return;
	zoominf.innerText = "X: " + (-Math.floor(tabs[tabID].imgX)) + " Y: " + (-Math.floor(tabs[tabID].imgY)) + " W: " + Math.floor(tabs[tabID].imgW * tabs[tabID].zoomPrct) + " H: " + Math.floor(tabs[tabID].imgH * tabs[tabID].zoomPrct);
	showZoomInf();
}

var hidei = null; //To remove timeout when it fires again.
function showZoomInf() {
	zoominf.style.opacity = "1";
	if (hidei != null) clearTimeout(hidei);
	hidei = setTimeout(function() {
		zoominf.style.opacity = "0";
		setTimeout(function() {zoominf.innerHTML = "";},200)
	},2700)
}

function imageLoaded(id) { //When image loaded.
	tabs[id].loadingCir.style.display = "none";
	//setTimeout(function() {
	tabs[id].imgW = tabs[id].ghostImg.clientWidth;
	tabs[id].imgH = tabs[id].ghostImg.clientHeight;
	document.title = "BirdyImg - " + getFileName(tabs[id].fileInf.path) + " (" + tabs[id].imgW + "x" + tabs[id].imgH + ")";
	console.log("set width", tabs[id].imgW, tabs[id].imgH);
	tabs[id].zoomPrct = 1;
	try {
		while (tabs[id].imgW * tabs[id].zoomPrct > imgViewCnt.offsetWidth) {
			tabs[id].zoomPrct -= 0.1
		}
	} catch { }
	try {
		while (tabs[id].imgH * tabs[id].zoomPrct > imgViewCnt.offsetHeight) {
			tabs[id].zoomPrct -= 0.1
		}
	} catch { }
	if (tabs[id].imgW * tabs[id].zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		tabs[id].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[id].imgW * tabs[id].zoomPrct / 2)
	}
	if (tabs[id].imgH * tabs[id].zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		tabs[id].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[id].imgH * tabs[id].zoomPrct / 2)
	}
	animateZoomPos();
	posImg();
	//},1)
}

function copyCurrentImage() {
	var path = tabs[tabID].fileInf.path
	if (getFileExtension(path) == "png" || getFileExtension(path) == "jpg" || getFileExtension(path) == "jpeg" || getFileExtension(path) == "jpe" || getFileExtension(path) == "jfif") { //Check if its supported
		ipcRenderer.send("writeImage", path) //Send main procress to copy the image at path.
	}else { //Copy image as html when not supported
		document.documentElement.style.userSelect = "all"
		setTimeout(() => { //Wait to let css styling applied.
			var imageElem = tabs[tabID].imgView;  
			var range = document.createRange();

			range.selectNode(imageElem);
			window.getSelection().removeAllRanges();
			window.getSelection().addRange(range);  

			try {
				var successful = document.execCommand('copy');  
				var msg = successful ? 'successful' : 'unsuccessful';  
				console.log('Copy image: ' + msg); 
			} catch(err) {  
				console.log(':(', err);  
			}  

			// Remove the selections - NOTE: Should use removeRange(range) when it is supported  
			window.getSelection().removeAllRanges(); 
			document.documentElement.style.userSelect = "";
		}, 100);
	}
}

function recyleImg() {
	ipcRenderer.send("recylefile", tabs[tabID].fileInf.path)
}

function openFWindow(html) { //Open a fullscreen window.
	var win = document.createElement("div");
	win.classList.add("fullscreenWindow");
	win.style.overflow = "auto";
	win.setAttribute("tabindex",0)
	var closeBtn = document.createElement("button");
	closeBtn.style.position = "sticky";
	closeBtn.style.right = "0";
	closeBtn.style.left = "100%";
	closeBtn.style.top = "0";
	closeBtn.style.zIndex = "1";
	closeBtn.classList.add("fullscreenWindowClose");
	closeBtn.classList.add("windowClose");
	closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z"/></svg>';
	closeBtn.classList.add("limon", "pill");
	win.appendChild(closeBtn);
	var contDiv = document.createElement("div");
	contDiv.classList.add("fullscreenWindowContent");
	contDiv.innerHTML = html;
	win.appendChild(contDiv);
	document.body.appendChild(win);
	requestAnimationFrame(function () {
		win.style.top = "0";
		win.focus()
	});
	closeBtn.addEventListener("click", function () {
		win.style.top = "";
		setTimeout(function () {
			win.innerHTML = ""
			document.body.removeChild(win);
		}, 600)
	});
	win.addEventListener("keydown",function(e) {
		if (e.key == "Escape") {
			closeBtn.click()
		}
	})
	return contDiv;
}

function openPopupWindow(html) { //Open a popup window.
	var overlay = document.createElement("div");
	overlay.classList.add("overlay")
	if (settingsdata["blurOverlays"]) {
		overlay.style.backdropFilter = "blur(2px)"
	}
	document.body.appendChild(overlay)
	var win = document.createElement("div");
	win.classList.add("popupWindow");
	win.style.overflow = "auto";
	win.setAttribute("tabindex",0)
	var closeBtn = document.createElement("button");
	closeBtn.style.position = "sticky";
	closeBtn.style.right = "0";
	closeBtn.style.left = "100%";
	closeBtn.style.top = "0";
	closeBtn.style.zIndex = "1";
	closeBtn.classList.add("popupWindowClose");
	closeBtn.classList.add("windowClose");
	closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z"/></svg>';
	closeBtn.classList.add("limon", "pill");
	win.appendChild(closeBtn);
	var contDiv = document.createElement("div");
	contDiv.classList.add("popupWindowContent");
	contDiv.innerHTML = html;
	win.appendChild(contDiv);
	document.body.appendChild(win);
	requestAnimationFrame(function () {
		win.style.top = "10%";
		win.style.opacity = "1";
		overlay.style.opacity = "1";
		win.focus()
	});
	closeBtn.addEventListener("click", function () {
		win.style.top = "";
		win.style.opacity = "";
		overlay.style.opacity = "";
		setTimeout(function () {
			win.innerHTML = ""
			document.body.removeChild(win);
			document.body.removeChild(overlay);
		}, 600)
	});
	win.addEventListener("keydown",function(e) {
		if (e.key == "Escape") {
			closeBtn.click()
		}
	})
	return contDiv;
}

function openWindow(html) { //Automatically opens fullscreen or popup
	let viewportHeight = window.innerHeight;
	let viewportWidth = window.innerWidth;
	
	var openpopup = true
	
	//If screen is small dont open popup.
	if (viewportHeight < 450) {
		openpopup = false
	}
	if (viewportWidth < 450) {
		openpopup = false
	}
	
	if (openpopup) {
		return openPopupWindow(html)
	}else {
		return openFWindow(html)
	}
}

function showSettings() { //Open settings window
	var optSelectHTML = "<option value='AUTO'>" + langpack.automatic + "</option>";
	langs.forEach((lang) => {
		optSelectHTML += "<option value='" + lang + "'>" + lang + "</option>"
	});
	var sets = openWindow("<h1>" + langpack.settings + "</h1><h3>" + langpack.general + "</h3><input type='checkbox' name='cbEnableTabs' id='cbEnableTabs' class='enabletab'/><label for='cbEnableTabs'>" + langpack.enableTabs + "</label><br><input type='checkbox' name='cbBO' id='cbBO' class='blurOverlays'/><label for='cbBO'>" + langpack.blurOverlays + "</label><br><input type='checkbox' name='showxy' id='showxy' class='showxy'/><label for='showxy'>" + langpack.showPositionAndSizeInfo + "</label><br><input type='checkbox' name='aht' id='aht' class='aht'/><label for='aht'>" + langpack.autoHideTabs + "</label><br><input type='checkbox' name='ct' id='ct' class='ct'/><label for='ct'>" + langpack.classicToolbar + "</label><br><input type='checkbox' name='eoir' id='eoir' class='eoir'/><label for='eoir'>" + langpack.enableOffImageRendering + "</label><br><input type='checkbox' name='btt' id='btt' class='btt'/><label for='btt'>" + langpack.showTransparencyTexture + "</label><br><input type='checkbox' name='udf' id='udf' class='udf'/><label for='udf'>" + langpack.usemmddyyyydateformat + "</label><br><input type='checkbox' name='rflo' id='rflo' class='rflo'/><label for='rflo'>" + langpack.reversedFileListOrder + "</label><br><label>" + langpack.defaultPanelSide + "</label>&nbsp;<select class='paneSide'><option value='Right'>" + langpack.right + "</option><option value='Left'>" + langpack.left + "</option></select><br><label>" + langpack.imageRenderingType + "</label>&nbsp;<select class='irt'><option value='0'>" + langpack.blurred + "</option><option value='1'>" + langpack.pixelated + "</option><option value='2'>" + langpack.nearestNeighbor + "</option></select><br><label>" + langpack.whenAllTabsAreClosed + "</label>&nbsp;<select class='watac'><option value='0'>" + langpack.doNothing + "</option><option value='1'>" + langpack.closeApp + "</option><option value='2'>" + langpack.openNewTab + "</option></select><br><label>" + langpack.toolbarSizeScale + ": </label><input type='number' class='tsc'/><h3>" + langpack["colors"] + "</h3><input type='checkbox' class='enablecolors' id='enablecolors' name='enablecolors'/><label for='enablecolors'>" + langpack.enableCustomColors + "</label><h4>" + langpack.accentColor + "</h4><input type='color' class='accentPick'/><input type='checkbox' class='applytoolbar' id='applytoolbar' name='applytoolbar'/><label for='applytoolbar'>" + langpack.applyToToolbarButtons + "</label><input type='checkbox' class='applytext' id='applytext' name='applytext'/><label for='applytext'>" + langpack.applyAsTextColor + "</label><h3>Language</h3><select value='" + settingsdata["language"] + "' class='langsb'>" + optSelectHTML + "</select><br><br><button class='openhistory'>" + langpack.history + "</button><button class='openfavorites'>" + langpack.favorites + "</button><br><br><p class='smallo'>BirdyImg " + versionstring + "<br><a href='' class='project'>HAKANKOKCU/BirdyImg</a></p>");
	// Handle events, set values etc.:
	
	sets.querySelector(".openhistory").addEventListener("click", function () {
		showHistory()
	})
	sets.querySelector(".openfavorites").addEventListener("click", function () {
		showFavorites()
	})
	sets.querySelector(".irt").addEventListener("change", function () {
		settingsdata["imageRenderingType"] = Number(sets.querySelector(".irt").value);
		ipcRenderer.send('savesettings', settingsdata);
		applySettings();
	});
	sets.querySelector(".langsb").addEventListener("change", function () {
		settingsdata["language"] = sets.querySelector(".langsb").value;
		ipcRenderer.send('savesettings', settingsdata);
	});
	sets.querySelector(".paneSide").addEventListener("change", function () {
		settingsdata["defaultPanelSide"] = sets.querySelector(".paneSide").value;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".watac").addEventListener("change", function () {
		settingsdata["whenAllTabsAreClosed"] = sets.querySelector(".watac").value;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".accentPick").addEventListener("change", function () {
		settingsdata["colors"]["accentColor"]["value"] = sets.querySelector(".accentPick").value;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".tsc").addEventListener("change", function () {
		settingsdata["toolbarSizeScale"] = sets.querySelector(".tsc").value;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".project").addEventListener("click", function(e) {
		ipcRenderer.send("launchpath", "https://github.com/HAKANKOKCU/BirdyImg")
		e.preventDefault();
	})
	sets.querySelector(".tsc").value = settingsdata["toolbarSizeScale"]
	sets.querySelector(".langsb").value = settingsdata["language"];
	sets.querySelector(".watac").value = settingsdata["whenAllTabsAreClosed"];
	sets.querySelector(".paneSide").value = settingsdata["defaultPanelSide"];
	sets.querySelector(".irt").value = settingsdata["imageRenderingType"];
	sets.querySelector(".enabletab").checked = settingsdata["enableTabs"];
	sets.querySelector(".showxy").checked = settingsdata["showPositionAndSizeInfo"];
	sets.querySelector(".btt").checked = settingsdata["showTransparencyTexture"];
	sets.querySelector(".aht").checked = settingsdata["autoHideTabs"];
	sets.querySelector(".ct").checked = settingsdata["classicToolbar"];
	sets.querySelector(".rflo").checked = settingsdata["reversedFileListOrder"];
	sets.querySelector(".eoir").checked = settingsdata["enableOffImageRendering"];
	sets.querySelector(".udf").checked = settingsdata["usemmddyyyydateformat"];
	sets.querySelector(".applytoolbar").checked = settingsdata["colors"]["accentColor"]["applyToToolbarButtons"];
	sets.querySelector(".applytext").checked = settingsdata["colors"]["accentColor"]["applyAsTextColor"]
	sets.querySelector(".accentPick").value = settingsdata["colors"]["accentColor"]["value"]
	sets.querySelector(".enablecolors").checked = settingsdata["colors"]["enableCustomColors"]
	sets.querySelector(".blurOverlays").checked = settingsdata["blurOverlays"]
	sets.querySelector(".udf").addEventListener("click", function () {
		settingsdata["usemmddyyyydateformat"] = sets.querySelector(".udf").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".rflo").addEventListener("click", function () {
		settingsdata["reversedFileListOrder"] = sets.querySelector(".rflo").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".enabletab").addEventListener("click", function () {
		settingsdata["enableTabs"] = sets.querySelector(".enabletab").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".eoir").addEventListener("click", function () {
		settingsdata["enableOffImageRendering"] = sets.querySelector(".eoir").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".btt").addEventListener("click", function () {
		settingsdata["showTransparencyTexture"] = sets.querySelector(".btt").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".aht").addEventListener("click", function () {
		settingsdata["autoHideTabs"] = sets.querySelector(".aht").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".ct").addEventListener("click", function () {
		settingsdata["classicToolbar"] = sets.querySelector(".ct").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".blurOverlays").addEventListener("click", function () {
		settingsdata["blurOverlays"] = sets.querySelector(".blurOverlays").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".applytoolbar").addEventListener("click", function () {
		settingsdata["colors"]["accentColor"]["applyToToolbarButtons"] = sets.querySelector(".applytoolbar").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".applytext").addEventListener("click", function () {
		settingsdata["colors"]["accentColor"]["applyAsTextColor"] = sets.querySelector(".applytext").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".showxy").addEventListener("click", function () {
		settingsdata["showPositionAndSizeInfo"] = sets.querySelector(".showxy").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
	sets.querySelector(".enablecolors").addEventListener("click", function () {
		settingsdata["colors"]["enableCustomColors"] = sets.querySelector(".enablecolors").checked;
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
	});
}

function showHistory() { //Opens history window.
	var ch = "<h1>" + langpack.history + "</h1>"
	var his = openWindow(ch)
	var clearButton = document.createElement("button");
	clearButton.innerHTML = langpack.clearHistory
	his.appendChild(clearButton)
	clearButton.addEventListener("click",function() {
		settingsdata.history = [];
		ipcRenderer.send('savesettings', settingsdata);
		applySettings()
		reloadh()
	})
	var table = document.createElement("table")
	table.style.maxWidth = "100%";
	function reloadh() {
		table.innerHTML = ""
		var tabletitles = document.createElement("tr")
		tabletitles.classList.add("sticky")
		var tabletitleName = document.createElement("th")
		tabletitleName.innerText = langpack.name
		tabletitles.appendChild(tabletitleName)
		var tabletitlePath = document.createElement("th")
		tabletitlePath.innerText = langpack.path
		tabletitles.appendChild(tabletitlePath)
		var deletehi = document.createElement("th")
		tabletitles.appendChild(deletehi)
		table.appendChild(tabletitles)
		settingsdata.history.forEach(function(i,id) {
			var itm = document.createElement("tr")
			var itma = document.createElement("td")
			var link = document.createElement("button")
			link.style.wordBreak = "break-word"
			link.innerText = getFileName(i)
			link.onclick = function() {
				ipcRenderer.send("openfilep", i);
				his.parentElement.getElementsByClassName("windowClose")[0].click()
			}
			//if (settingsdata.favorites.includes(i)) {
			//	var star = document.createElement("span")
			//	star.innerHTML = starFilled;
			//	itma.appendChild(star);
			//}
			itma.appendChild(link)
			itm.appendChild(itma)
			table.appendChild(itm)
			var itmb = document.createElement("td")
			itmb.innerText = i
			itmb.style.wordBreak = "break-word"
			itm.appendChild(itmb)
			var itmd = document.createElement("td")
			itmd.style.cursor = "pointer"
			itmd.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" class="dangerousbtnicon"><path d="m9.4 16.5 2.6-2.6 2.6 2.6 1.4-1.4-2.6-2.6L16 9.9l-1.4-1.4-2.6 2.6-2.6-2.6L8 9.9l2.6 2.6L8 15.1ZM7 21q-.825 0-1.412-.587Q5 19.825 5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413Q17.825 21 17 21ZM17 6H7v13h10ZM7 6v13Z"/></svg>`
			itmd.onclick = function() {
				table.removeChild(itm);
				settingsdata.history.splice(id,1)
				ipcRenderer.send('savesettings', settingsdata);
				applySettings()
				reloadh()
			}
			itm.appendChild(itmd)
			table.insertBefore(itm,table.children[1])
		})
	}
	reloadh();
	his.appendChild(table)
}

function showFavorites() { //Opens favorites window.
	var ch = "<h1>" + langpack.favorites + "</h1>"
	var his = openWindow(ch)
	var table = document.createElement("table")
	table.style.maxWidth = "100%";
	function reloadh() {
		table.innerHTML = ""
		var tabletitles = document.createElement("tr")
		tabletitles.classList.add("sticky")
		var tabletitleName = document.createElement("th")
		tabletitleName.innerText = langpack.name
		tabletitles.appendChild(tabletitleName)
		var tabletitlePath = document.createElement("th")
		tabletitlePath.innerText = langpack.path
		tabletitles.appendChild(tabletitlePath)
		var deletehi = document.createElement("th")
		tabletitles.appendChild(deletehi)
		table.appendChild(tabletitles)
		settingsdata.favorites.forEach(function(i,id) {
			var itm = document.createElement("tr")
			var itma = document.createElement("td")
			var link = document.createElement("button")
			link.style.wordBreak = "break-word"
			link.innerText = getFileName(i)
			link.onclick = function() {
				ipcRenderer.send("openfilep", i);
				his.parentElement.getElementsByClassName("windowClose")[0].click()
			}
			itma.appendChild(link)
			itm.appendChild(itma)
			table.appendChild(itm)
			var itmb = document.createElement("td")
			itmb.innerText = i
			itmb.style.wordBreak = "break-word"
			itm.appendChild(itmb)
			var itmd = document.createElement("td")
			itmd.style.cursor = "pointer"
			itmd.innerHTML = `<svg class="dangerousbtnicon" xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M5 13v-2h14v2Z"/></svg>`
			itmd.onclick = function() {
				table.removeChild(itm);
				settingsdata.favorites.splice(id,1)
				ipcRenderer.send('savesettings', settingsdata);
				applySettings()
				reloadh()
			}
			itm.appendChild(itmd)
			table.insertBefore(itm,table.children[1])
		})
	}
	reloadh();
	his.appendChild(table)
}

function openRightPane(html, paneID) { //Opens a pane at right side.
	var sb = createPane(html, paneID, true);
	maincont.appendChild(sb);
	sb.focus()
	var sbcontent = sb.getElementsByClassName("panecontent")[0];
	return sbcontent;
}

function openLeftPane(html, paneID) { //Opens a pane at left side.
	var sb = createPane(html, paneID, false);
	maincont.insertBefore(sb, maincont.firstChild);
	sb.focus()
	var sbcontent = sb.getElementsByClassName("panecontent")[0];
	return sbcontent;
}

function openPane(html, paneID, O) { //Opens a pane at the side (O is a boolean, true = right, false = left.)
	var sidecheck = O == true ? "Right" : "Left";
	var sb = createPane(html, paneID, settingsdata["defaultPanelSide"] != sidecheck);
	if (settingsdata["defaultPanelSide"] == sidecheck)
		maincont.insertBefore(sb, maincont.firstChild);
	else
		maincont.appendChild(sb);
	var sbcontent = sb.getElementsByClassName("panecontent")[0];
	return sbcontent;
}


function createPane(html, paneID, isAtRight) { //Creates a pane (DOESNT SHOW IT.)
	var sb = document.createElement("div");
	sb.classList.add("pane")
	sb.setAttribute("tabindex",0);
	sb.setAttribute("paneid", paneID);
	sb.style.height = "100%";
	sb.style.width = "0";
	//sb.style.maxWidth = "1px";
	sb.style.transition = "width 200ms"; //max-width 500ms,min-width 500ms
	sb.style.overflow = "auto";
	sb.style.position = "relative";
	sb.style.maxWidth = "100%";
	sb.style.zIndex = "2";
	if (isAtRight)
		sb.style.borderLeft = "solid rgba(0,0,0,0)" + RESIZE_BORDER_SIZE + "px";
	else
		sb.style.borderRight = "solid rgba(0,0,0,0)" + RESIZE_BORDER_SIZE + "px";
	//sb.style.borderLeft = "solid rgba(0,0,0,0.2) " + RESIZE_BORDER_SIZE + "px";
	sb.style.flexShrink = 0;
	var closeBtn = document.createElement("button");
	closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z"/></svg>';
	//closeBtn.style.float = "right";
	closeBtn.style.position = "sticky";
	closeBtn.style.right = "0";
	closeBtn.style.left = "100%";
	closeBtn.style.top = "0";
	closeBtn.style.zIndex = "1";
	closeBtn.classList.add("limon", "pill");
	closeBtn.addEventListener("click", function () {
		sb.style.width = "0";
		var aniposer = setInterval(function () {
			if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
				tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
			}
			if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
				tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
			}
			posImg();
			retimgIfOut();
		}, 1)
		setTimeout(function () {
			maincont.removeChild(sb);
			if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
				animateZoomPos()
				tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
			}
			if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
				animateZoomPos()
				tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
			}
			posImg();
			retimgIfOut();
			sbcontent.innerHTML = "";
			sb.innerHTML = "";
		}, 200)
	});
	var sbcontent = document.createElement("div");
	sbcontent.innerHTML = html;
	sbcontent.style.width = "100%";
	//sb.style.overflowX = "hidden";
	sbcontent.style.position = "absolute";
	sbcontent.style.top = "0";
	sbcontent.style.left = "0";
	sbcontent.style.minWidth = "270px";
	sbcontent.classList.add("panecontent");
	sb.appendChild(closeBtn);
	sb.appendChild(sbcontent);
	setTimeout(function () {
		sb.style.width = "300px";
	}, 10)
	let m_pos;
	function resize(e) {
		if (isAtRight) {
			const dx = m_pos - e.x;
			m_pos = e.x;
			sb.style.width = (parseInt(getComputedStyle(sb, '').width) + dx) + "px";
		} else {
			const dx = m_pos - e.x;
			m_pos = e.x;
			sb.style.width = (parseInt(getComputedStyle(sb, '').width) - dx) + "px";
		}
		retimgIfOut();
		posImg();
	}

	sb.addEventListener("mousedown", function (e) {
		if (e.target != sb) return;
		if (isAtRight ? (e.offsetX < RESIZE_BORDER_SIZE) : (e.offsetX > parseInt(sb.style.width) - RESIZE_BORDER_SIZE)) {
			m_pos = e.x;
			document.addEventListener("mousemove", resize, false);
			sb.style.transition = "";
			if (isAtRight)
				sb.style.borderLeft = "solid rgba(0,0,0,2)" + RESIZE_BORDER_SIZE + "px";
			else
				sb.style.borderRight = "solid rgba(0,0,0,2)" + RESIZE_BORDER_SIZE + "px";
		}
	}, false);
	
	sb.addEventListener("touchstart", function (e) {
		if (e.target != sb) return;
		if (isAtRight ? (e.offsetX < RESIZE_BORDER_SIZE) : (e.offsetX > parseInt(sb.style.width) - RESIZE_BORDER_SIZE)) {
			m_pos = e.x;
			document.addEventListener("mousemove", resize, false);
			sb.style.transition = "";
			if (isAtRight)
				sb.style.borderLeft = "solid rgba(0,0,0,2)" + RESIZE_BORDER_SIZE + "px";
			else
				sb.style.borderRight = "solid rgba(0,0,0,2)" + RESIZE_BORDER_SIZE + "px";
			e.preventDefault()
		}
	}, false);

	document.addEventListener("mouseup", function () {
		document.removeEventListener("mousemove", resize, false);
		sb.style.transition = "width 200ms";
		if (isAtRight)
			sb.style.borderLeft = "solid rgba(0,0,0,0)" + RESIZE_BORDER_SIZE + "px";
		else
			sb.style.borderRight = "solid rgba(0,0,0,0)" + RESIZE_BORDER_SIZE + "px";
	}, false);
	
	document.addEventListener("touchend", function () {
		document.removeEventListener("mousemove", resize, false);
		sb.style.transition = "width 200ms";
		if (isAtRight)
			sb.style.borderLeft = "solid rgba(0,0,0,0)" + RESIZE_BORDER_SIZE + "px";
		else
			sb.style.borderRight = "solid rgba(0,0,0,0)" + RESIZE_BORDER_SIZE + "px";
	}, false);
	sb.addEventListener("keydown",function(e) {
		if (e.key == "Escape") {
			closeBtn.click()
		}
	})
	var aniposer = setInterval(function () {
		if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
			tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
		}
		if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
			tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
		}
		posImg();
		retimgIfOut();
	}, 1)
	setTimeout(function () {
		clearInterval(aniposer)
		animateZoomPos();
	}, 200)
	return sb;
}

function rotL() { //Rotate left
	tabs[tabID].rot -= 90;
	if (tabs[tabID].rot == -360) {
		tabs[tabID].rot = 0
	}
	isRoted = !isRoted;
	//var tabs[tabID].imgHold = tabs[tabID].imgH;
	//tabs[tabID].imgH = tabs[tabID].imgW;
	//tabs[tabID].imgW = tabs[tabID].imgHold;
	posImg();
}

function rotR() { //Rotate right
	tabs[tabID].rot += 90;
	if (tabs[tabID].rot == 360) {
		tabs[tabID].rot = 0
	}
	isRoted = !isRoted;
	//var tabs[tabID].imgHold = tabs[tabID].imgH;
	//tabs[tabID].imgH = tabs[tabID].imgW;
	//tabs[tabID].imgW = tabs[tabID].imgHold;
	posImg();
}

function getFileName(path) {
	var pathR = path.replace(/\\/g, "/");
	var pt = pathR.split("/");
	return pt[pt.length - 1]
}

function getFolderName(path) {
	var pathR = path.replace(/\\/g, "/");
	var pt = pathR.split("/");
	return pt[pt.length - 2]
}
function getFolderPath(path) {
	var pathR = path.replace(/\\/g, "/");
	var pt = pathR.split("/");
	var out = "";
	for (let i = 0; i < pt.length - 1; i++) {
		out += pt[i] + "/";
	}
	return out;
}

function getFileExtension(pathorfilename) {
	if (pathorfilename.includes(".")) { //Check if file name has a "."
		var pt = pathorfilename.split(".");
		return pt[pt.length - 1]
	}else {
		return "???" //No implementation for file names doesnt have "."
	}
}

var fil = document.querySelectorAll("*"); //Get all elements.
Array.prototype.forEach.call(fil, (item) => { //Auto-unfocus when mouse up fired.
	item.addEventListener("mouseup", function (e) { if (e.target.tagName != "INPUT") item.blur() })
})

function getReadableFileSizeString(fileSizeInBytes) { //BYTES to readable string. (example here is for 2048 bytes.)
	var i = -1;
	var byteUnits = [' KB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
	do {
		fileSizeInBytes /= 1024;
		i++;
	} while (fileSizeInBytes > 1024);

	return [Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i], byteUnits[i]]; //Returns a array. (0: 2, 1: KB)
}

document.addEventListener('dragover', (e) => { //When you enter window while dragging a file.
	e.preventDefault();
	e.stopPropagation();
});

document.addEventListener('drop', (event) => { //When you drop the file
	event.preventDefault();
	event.stopPropagation();
	var filsdrop = event.dataTransfer.files;
	asyncfor(0, filsdrop.length - 1, 1, filsdrop, (step, array) => { // every 125 miliseconds, open the next file that dropped.
		try {
			newTab();
			setTimeout(function() { //Let the new tab load and open the image.
				ipcRenderer.sendSync('openfilep', array[step].path);
			},50)
		} catch { }
	}, 125)
});

function applyTranslations() { //Apply translations for elements require it.
	var elements = document.querySelectorAll("[data-fromlang]")
	Array.prototype.forEach.call(elements, applyTranslationFor)
	elements = document.querySelectorAll("[data-tooltipfromlang]")
	Array.prototype.forEach.call(elements, applyTranslationTooltipFor)
}

function applyTranslationFor(element) { //Apply translation for element as content
	var transl = element.getAttribute("data-fromlang");
	element.innerHTML = langpack[transl];
}

function applyTranslationTooltipFor(element) { //Apply translation for element as tooltip
	var transl = element.getAttribute("data-tooltipfromlang");
	element.title = langpack[transl];
}

function addIMGToFavorites() { //Adds current image to your favorites list
	var filfo = tabs[tabID].fileInf.path;
	if (settingsdata.favorites.includes(filfo)) {
		var index = settingsdata.favorites.indexOf(filfo);
		if (index !== -1) {
			settingsdata.favorites.splice(index, 1);
		}
	}else {
		settingsdata.favorites.push(filfo);
	}
	ipcRenderer.send('savesettings', settingsdata);
	addToFavorites.innerHTML = settingsdata.favorites.includes(filfo) ? starFilled : starOutlined;
	addToFavorites.title = settingsdata.favorites.includes(filfo) ? langpack.removeFromFavorites : langpack.addToFavorites;
}

imgViewCnt.addEventListener('contextmenu', (e) => {//When right mouse button is clicked.
	e.preventDefault();
	if (currentGalleryView == null) {
		ipcRenderer.send('showimagecontext')
	}
}, false)

//Events for menu items:
ipcRenderer.on("copyimage", (event, data) => { copyCurrentImage() });
ipcRenderer.on("rotateleft", (event, data) => { rotL() });
ipcRenderer.on("rotateright", (event, data) => { rotR() });
ipcRenderer.on("zoomin", (event, data) => { zoomIn() });
ipcRenderer.on("zoomout", (event, data) => { zoomOut() });
ipcRenderer.on("addToFavorites", (event, data) => { addIMGToFavorites() });
ipcRenderer.on("showGalleryViewFullScreen", (event, data) => { showGalleryViewFullScreen() });
ipcRenderer.on("reloadimage", (event, data) => {
	tabs[tabID].imgView.src = ""
	ipcRenderer.send("openfilep", tabs[tabID].fileInf.path)
});
ipcRenderer.on("slideshow", (event, data) => {
	slideshow()
});

function slideshow() {
	if (typeof slideshowtimer != "undefined") {
		clearInterval(slideshowtimer)
	}
	window.slideshowtimer = setInterval(function() {
		nextFile()
	},5000)
	tabSwitcher.style.display = "none"
	imgViewCnt.style.maxHeight = "100%"
	document.getElementById("maintoolbar").style.display = "none"
	zoominf.innerText = langpack.pressEscToExit
	showZoomInf()
	document.title = "BirdyImg - " + langpack.slideshow
	retimgIfOut();
	posImg();
}

function exitSlideshow() {
	if (typeof slideshowtimer != "undefined") {
		clearInterval(slideshowtimer)
		slideshowtimer = undefined;
		tabSwitcher.style.display = ""
		imgViewCnt.style.maxHeight = ""
		document.getElementById("maintoolbar").style.display = ""
		autoHideTabs()
		document.title = "BirdyImg - " + getFileName(tabs[tabID].fileInf.path) + " (" + tabs[tabID].imgW + "x" + tabs[tabID].imgH + ")"; //Change title to BirdyImg - (File Name) ((Width)x(Height))
		retimgIfOut();
		posImg();
	}
}

/*Make resizable div by Hung Nguyen (MODIFIED)*/
function makeResizableDiv(element, draggable) {
  const resizers = element.getElementsByClassName("resizer")
  const minimum_size = 20;
  let original_width = 0;
  let original_height = 0;
  let original_x = 0;
  let original_y = 0;
  let original_mouse_x = 0;
  let original_mouse_y = 0;
  if (draggable) {
		var oldx
		var oldy
		var dt
		var dl
		var dragging = false;
		element.addEventListener("mousedown",function(event) {
			oldx = event.pageX;
			oldy = event.pageY;
			dt = parseFloat(getComputedStyle(element, null).getPropertyValue('top').replace('px', ''));
			dl = parseFloat(getComputedStyle(element, null).getPropertyValue('left').replace('px', ''));
			dragging = true;
			console.log("down")
		})
		element.addEventListener("mousemove",function(event) {
			if (dragging) {
				element.style.top = dt + (event.pageY - oldy) + "px"
				element.style.left = dl + (event.pageX - oldy) + "px"
				//oldx = event.pageX;
				//oldy = event.pageY;
				console.log("drag")
			}
		})
		element.addEventListener("mouseup",function(event) {
			dragging = false;
			console.log("up")
		})
	}
  for (let i = 0;i < resizers.length; i++) {
    const currentResizer = resizers[i];
	function start(e) {
		e.preventDefault()
		if (typeof e.touches != "undefined") {
			e = e.touches[0];
		}
      original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
      original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
      original_x = element.getBoundingClientRect().left;
      original_y = element.getBoundingClientRect().top;
      original_mouse_x = e.pageX;
      original_mouse_y = e.pageY;
      window.addEventListener('mousemove', resize)
      window.addEventListener('mouseup', stopResize)
	  window.addEventListener('touchmove', resize)
      window.addEventListener('touchend', stopResize)
	  //window.addEventListener('touchcancel', stopResize)
	}
    currentResizer.addEventListener('mousedown',start)
    currentResizer.addEventListener('touchstart',start)
    function resize(e) {
		console.log("resizinnn")
		if (typeof e.touches != "undefined") {
			e = e.touches[0];
		}
      if (currentResizer.classList.contains('bottom-right')) {
        const width = original_width + (e.pageX - original_mouse_x);
        const height = original_height + (e.pageY - original_mouse_y)
        if (width > minimum_size) {
          element.style.width = width + 'px'
        }
        if (height > minimum_size) {
          element.style.height = height + 'px'
        }
      }
      else if (currentResizer.classList.contains('bottom-left')) {
        const height = original_height + (e.pageY - original_mouse_y)
        const width = original_width - (e.pageX - original_mouse_x)
        if (height > minimum_size) {
          element.style.height = height + 'px'
        }
        if (width > minimum_size) {
          element.style.width = width + 'px'
          element.style.left = (original_x + (e.pageX - original_mouse_x)) + element.parentElement.scrollLeft + 'px'
        }
      }
      else if (currentResizer.classList.contains('top-right')) {
        const width = original_width + (e.pageX - original_mouse_x)
        const height = original_height - (e.pageY - original_mouse_y)
        if (width > minimum_size) {
          element.style.width = width + 'px'
        }
        if (height > minimum_size) {
          element.style.height = height + 'px'
          element.style.top = (original_y + (e.pageY - original_mouse_y)) + element.parentElement.scrollTop + 'px'
        }
      }
      else {
        const width = original_width - (e.pageX - original_mouse_x)
        const height = original_height - (e.pageY - original_mouse_y)
        if (width > minimum_size) {
          element.style.width = width + 'px'
          element.style.left = (original_x + (e.pageX - original_mouse_x)) + element.parentElement.scrollLeft + 'px'
        }
        if (height > minimum_size) {
          element.style.height = height + 'px'
          element.style.top = (original_y + (e.pageY - original_mouse_y)) + element.parentElement.scrollTop + 'px'
        }
      }
    }
    
    function stopResize() {
      window.removeEventListener('mousemove', resize)
	  window.removeEventListener('touchmove', resize)
    }
  }
}

// Some parts from LimonJS:

function asyncfor(start, end, step, importedvar, func, speed) {
	var stp = start;
	var asyncforr = setInterval(function () {
		func(stp, importedvar);
		if (stp > end) {
			clearInterval(asyncforr);
		}
		if (stp === end) {
			clearInterval(asyncforr);
		}
		stp += step;
	}, speed);
}

// Gamepad support cuz i bored. btw i guess its impossible to open images..:

var gamepadid
var lastgmp
var focusedid = 0

function axisvalue(axis) {
	var valaxis
	if (axis > 3) {
		valaxis = axis
	}else {
		valaxis = axis //* 10
	}
	if (Math.abs(valaxis) > 0.003921627998352051) {
		return valaxis
	}else if (valaxis < 0) {
		return valaxis
	}
	return 0
}

function padloop() {
	if (document.hasFocus()) {
		var gamepad = navigator.getGamepads()[gamepadid];
		//AXES were the most painful ones..
		var axisb = axisvalue(gamepad.axes[2]);
		if (axisb != 0) {
			tabs[tabID].imgX -= axisb * 50;
			retimgIfOut();
			posImg();
			showXYInfo();
		}
		var axise = axisvalue(gamepad.axes[5]);
		if (axise != 0) {
			tabs[tabID].imgY -= axise * 50;
			retimgIfOut();
			posImg();
			showXYInfo();
		}
		var axisi = axisvalue(gamepad.axes[9]);
		if (axisi < 3) {
			//console.log("zoomin")
			if (axisi < 0) axisi/=20
			if (axisi > 0) axisi/=2
			tabs[tabID].zoomPrct -= axisi;
			if (tabs[tabID].zoomPrct < 0.01) {
				tabs[tabID].zoomPrct = 0.01
			}
			if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
				animateZoomPos()
				tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
			}
			if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
				animateZoomPos()
				tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
			}
			retimgIfOut();
			posImg();
			showZoomPrct();
		}
		//Buttons were easy
		if (gamepad.buttons[11].pressed) {
			if (!lastgmp.buttons[11].pressed) {
				tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2);
				tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2);
				animateZoomPos();
				posImg();
			}
		}
		if (gamepad.buttons[4].pressed) {
			if (!lastgmp.buttons[4].pressed) {
				prvFile();
			}
		}
		if (gamepad.buttons[5].pressed) {
			if (!lastgmp.buttons[5].pressed) {
				nextFile();
			}
		}
		//Focus support
		if (gamepad.buttons[7].pressed) {
			if (!lastgmp.buttons[7].pressed) {
				focusedid += 1;
				//Sorry if its slow...
				var focusableelements = document.querySelectorAll("button,input,select,a,[tabindex]")
				focusedid = Array.prototype.indexOf.call(focusableelements,document.activeElement)
				focusedid += 1
				if (focusedid > focusableelements.length -1) {
					focusedid = 0
				}
				focusableelements[focusedid].focus();
			}
		}
		if (gamepad.buttons[6].pressed) {
			if (!lastgmp.buttons[6].pressed) {
				focusedid -= 1;
				//Sorry if its slow...
				var focusableelements = document.querySelectorAll("button,input,select,[tabindex]")
				focusedid = Array.prototype.indexOf.call(focusableelements,document.activeElement)
				focusedid -= 1
				if (focusedid < 0) {
					focusedid = focusableelements.length -1
				}
				focusableelements[focusedid].focus();
			}
		}
		if (gamepad.buttons[1].pressed) {
			if (!lastgmp.buttons[1].pressed) {
				document.activeElement.click();
			}
		}
		if (gamepad.buttons[8].pressed) {
			if (!lastgmp.buttons[8].pressed) {
				showSettings();
			}
		}
		if (gamepad.buttons[0].pressed) {
			if (!lastgmp.buttons[0].pressed) {
				var sb = document.querySelector('[paneid="FileInfo"]');
				if (sb == undefined) {
					openFileInfo()
				}else {
					sb.style.width = "0";
					var aniposer = setInterval(function () {
						if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
							tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
						}
						if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
							tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
						}
						posImg();
						retimgIfOut();
					}, 1)
					setTimeout(function () {
						maincont.removeChild(sb);
						if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
							animateZoomPos()
							tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
						}
						if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
							animateZoomPos()
							tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
						}
						posImg();
						retimgIfOut();
						//sbcontent.innerHTML = "";
						sb.innerHTML = "";
					}, 200)
				}
			}
		}
		if (gamepad.buttons[9].pressed) {
			if (!lastgmp.buttons[9].pressed) {
				if (typeof slideshowtimer != "undefined") {
					exitSlideshow();
				}else {
					slideshow();
				}
			}
		}
		if (gamepad.buttons[2].pressed) {
			if (!lastgmp.buttons[2].pressed) {
				var sb = document.querySelector('[paneid="filelist"]');
				if (sb == undefined) {
					showfList()
				}else {
					sb.style.width = "0";
					var aniposer = setInterval(function () {
						if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
							tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
						}
						if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
							tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
						}
						posImg();
						retimgIfOut();
					}, 1)
					setTimeout(function () {
						maincont.removeChild(sb);
						if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
							animateZoomPos()
							tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
						}
						if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
							animateZoomPos()
							tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
						}
						posImg();
						retimgIfOut();
						//sbcontent.innerHTML = "";
						sb.innerHTML = "";
					}, 200)
				}
			}
		}
		lastgmp = gamepad
	}
}
var cid;
window.addEventListener("gamepadconnected", (e) => {
	const gp = navigator.getGamepads()[e.gamepad.index];
	gamepadid = e.gamepad.index
	console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
	gp.index, gp.id,
	gp.buttons.length, gp.axes.length);
	cid = setInterval(padloop,50)
});

window.addEventListener("gamepaddisconnected", (e) => {
	clearInterval(cid);
	console.log("Gamepad disconnected from index %d: %s",
    e.gamepad.index, e.gamepad.id);
});