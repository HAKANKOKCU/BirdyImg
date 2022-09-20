const { ipcRenderer } = require("electron");


const RESIZE_BORDER_SIZE = 4;
let imgViewCnt = document.getElementById("imgView");
let maincont = document.getElementsByTagName("main")[0];
let loadingText = document.getElementById("loading");
let tabSwitcher = document.getElementById("tabSwitcher");

// Toolbar buttons:

let prvFileButton = document.getElementById("prvFileButton");
let nextFileButton = document.getElementById("nextFileButton");
//----
let zoomInButton = document.getElementById("zoomInButton");
let zoomOutButton = document.getElementById("zoomOutButton");
//----
let rotateLeftButton = document.getElementById("rotateLeftButton");
let rotateRightButton = document.getElementById("rotateRightButton");
//----
let openFileButton = document.getElementById("openFileButton");

// Add events to buttons:

prvFileButton.addEventListener("click", prvFile);
nextFileButton.addEventListener("click", nextFile);
zoomInButton.addEventListener("click", zoomIn);
zoomOutButton.addEventListener("click", zoomOut);
openFileButton.addEventListener("click", openFile);
rotateLeftButton.addEventListener("click", rotL);
rotateRightButton.addEventListener("click", rotR);

var dragging = false;
var settingsdata;
var oldpos = {
	"x":0,
	"y":0
}
var tabs = {};
var tabID;
var langpack;
var langs;
var ghostImg = document.createElement("img");
//ghostImg.style.opacity = "0";
var isRoted = false;
var mouseX = 0,mouseY = 0;
var newtabid = 0;

var tabCount = 0;

function newTab() {
	var view = document.createElement("img");
	view.setAttribute("BIMG-TabID",newtabid);
	imgViewCnt.appendChild(view);
	var tswitch = document.createElement("div");
	var tswitchHeader = document.createElement("span");
	tswitchHeader.classList.add("tabHeader");
	try {
		tswitchHeader.innerText = langpack.newTab;
	}catch {
		var retint = setInterval(function() {
			try {
				tswitchHeader.innerText = langpack.newTab;
				clearInterval(retint);
			}catch {}
		},100)
	}
	tswitch.appendChild(tswitchHeader)
	var tswitchClose = document.createElement("span");
	tswitchClose.classList.add("tabClose");
	tswitchClose.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20"><path d="M6.062 15 5 13.938 8.938 10 5 6.062 6.062 5 10 8.938 13.938 5 15 6.062 11.062 10 15 13.938 13.938 15 10 11.062Z"/></svg>';
	tswitch.appendChild(tswitchClose)
	tswitch.setAttribute("BIMG-TabID",newtabid);
	tabSwitcher.appendChild(tswitch);
	tabs[newtabid] =
		{
			imgX:0,
			imgY:0,
			imgW:0,
			imgH:0,
			fileInf:null,
			imgView:view,
			fileID:null,
			filelist:null,
			filesizes:null,
			rot:0,
			zoomPrct:1
		}
	var ndi = newtabid;
	tswitchClose.addEventListener("click",function() {
		closeTab(ndi);
	});
	tswitchHeader.addEventListener("click",function() {switchTab(ndi)});
	view.addEventListener("load",function() {
		imageLoaded(ndi);
	});
	switchTab(newtabid);
	ipcRenderer.send("newtab", newtabid);
	newtabid++;
	tabCount++;
}
var currentTabItemHeader;
function switchTab(id) {
	var imgs = imgViewCnt.querySelectorAll("img");
	Array.prototype.forEach.call(imgs, (item) => {
		if (item.getAttribute("BIMG-TabID") == id) {
			item.style.display = "";
			var filname
			try {
				filname = getFileName(tabs[id].fileInf.path);
			}catch {}
			if (filname == null)
				document.title = "BirdyImg";
			else
				document.title = "BirdyImg - " + filname;
		}else {
			item.style.display = "none";
		}
	});
	var tis = tabSwitcher.querySelectorAll("div");
	Array.prototype.forEach.call(tis, (item) => {
		if (item.getAttribute("BIMG-TabID") == id) {
			item.classList.add("active");
			currentTabItemHeader = item;
		}else {
			item.classList.remove("active");
		}
	});
	tabID = id;
	ipcRenderer.send("switchtab",tabID);
}

function closeTab(id) {
	var elemTitle = tabSwitcher.querySelector("div[BIMG-TabID=\"" + id + "\"]");
	tabSwitcher.removeChild(elemTitle);
	var elemimg = imgViewCnt.querySelector("img[BIMG-TabID=\"" + id + "\"]");
	elemimg.src = "";
	imgViewCnt.removeChild(elemimg);
	tabs[id] = null;
	tabCount--;
}

newTab();

ipcRenderer.on("createnewtab", (event,data) => {newTab()});

ipcRenderer.on("settingsdata", (event,data) => {
	settingsdata = data;
	if (settingsdata["enableTabs"] == false) {
		tabSwitcher.style.display = "none";
	}
});
ipcRenderer.on("langs", (event,data) => {
	langs = data;
});

ipcRenderer.on("filedata", (event,data) => {
	if (tabCount == 0) newTab()
	document.body.appendChild(ghostImg);
	document.title = "BirdyImg - " + getFileName(data.path);
	loadingText.style.display = "";
	tabs[tabID].imgView.src = data.path;
	ghostImg.src = data.path;
	tabs[tabID].fileInf = data;
	tabs[tabID].imgX = 0;
	isRoted = false;
	tabs[tabID].imgY = 0;
	tabs[tabID].imgW = tabs[tabID].fileInf.size.width;
	tabs[tabID].imgH = tabs[tabID].fileInf.size.height;
	if (ghostImg.complete) {
		tabs[tabID].imgW = ghostImg.clientWidth;
		tabs[tabID].imgH = ghostImg.clientHeight;
		console.log("set width",tabs[tabID].imgW,tabs[tabID].imgH);
	}else {
		setTimeout(function() {
			tabs[tabID].imgW = ghostImg.clientWidth;
			tabs[tabID].imgH = ghostImg.clientHeight;
			console.log("set width",tabs[tabID].imgW,tabs[tabID].imgH);
			posImg();
		},100)
	}
	tabs[tabID].zoomPrct = 1;
	tabs[tabID].rot = 0;
	try {
		while (tabs[tabID].imgW * tabs[tabID].zoomPrct > imgViewCnt.offsetWidth) {
			tabs[tabID].zoomPrct -= 0.1
		}
	}catch {}
	try {
		while (tabs[tabID].imgH * tabs[tabID].zoomPrct > imgViewCnt.offsetHeight) {
			tabs[tabID].zoomPrct -= 0.1
		}
	}catch {}
	if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
	}
	if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
	}
	currentTabItemHeader.getElementsByClassName("tabHeader")[0].innerText = getFileName(data.path);
	currentTabItemHeader.getElementsByClassName("tabHeader")[0].title = getFileName(data.path);
	//posImg();
	var filfo = tabs[tabID].fileInf;
	Array.prototype.forEach.call(document.querySelectorAll("[paneid='FileInfo']"),(item) => {
		var pane = item.querySelector(".rightpanecontent");
		var selectedsval = pane.getElementsByClassName("PKAbleSizeSelect")[0].value;
		pane.innerHTML = generateFileInfoContent();
		var PKAbleSelect = pane.getElementsByClassName("PKAbleSizeSelect")[0];
		var PKAbleUpdate = pane.getElementsByClassName("PKAbleSizeUpdateSpan")[0];
		var opendir = pane.getElementsByClassName("opendir")[0];
		PKAbleSelect.addEventListener("change", function() {
			PKAbleUpdate.innerHTML = Math.max(filfo.filesize / PKAbleSelect.value, 0.1).toFixed(1).toString();
		});
		opendir.addEventListener("click", function() {
			ipcRenderer.send("launchpath", getFolderPath(filfo.path));
		});
		PKAbleSelect.value = selectedsval;
		PKAbleUpdate.innerHTML = Math.max(filfo.filesize / PKAbleSelect.value, 0.1).toFixed(1).toString();
	})
});

ipcRenderer.on("filelist", (event,data) => {
	tabs[tabID].fileID = data.fileID;
	tabs[tabID].filelist = data.list;
	tabs[tabID].filesizes = data.filesizes;
	var fil = document.getElementsByClassName("fileListItem");
	Array.prototype.forEach.call(fil,(item) => {
		if (item.getAttribute("data-imageid") == tabs[tabID].fileID) {
			item.style.backgroundColor = "lightgray";
			item.parentElement.parentElement.scrollTop = item.offsetTop - (item.parentElement.parentElement.offsetHeight / 2) + (item.offsetHeight / 2);
		}else {
			item.style.backgroundColor = ""
		}
	})
});

ipcRenderer.on("showfilelist", (event,data) => {
	showfList();
})

function showfList() {
	var HTMLs = "<h1>" + langpack.fileList + "</h1>"
	tabs[tabID].filelist.forEach((item,index) => {
		var extraCSSLI = "";
		if (index == tabs[tabID].fileID) {extraCSSLI = "background-color:lightgray"}
		HTMLs += "<div class='fileListItem' data-imageid='" + index + "' title='" + getFileName(item) + "&#010;" + langpack.fileSize + ": " + getReadableFileSizeString(tabs[tabID].filesizes[index])[0] + "' style='" + extraCSSLI + "' onclick='ipcRenderer.send(`openfilep`,`" + item.replace(/\\/g,"\\\\") + "`)'><center><img src='" + item + "' style='max-height:100px;max-width:245px' loading='lazy' class='limon darkshandow'></center></div>"
	});
	openRightPane(HTMLs,"filelist")
}

ipcRenderer.on("langpack", (event,data) => {
	langpack = data;
	//loadingText.innerText = langpack.loadingImage;
});
ipcRenderer.on("imageinfo", (event,data) => {
	openFileInfo();
});

function openFileInfo() {
	var filfo = tabs[tabID].fileInf;
	var pane = openRightPane(generateFileInfoContent(),"FileInfo");
	var PKAbleSelect = pane.getElementsByClassName("PKAbleSizeSelect")[0];
	var PKAbleUpdate = pane.getElementsByClassName("PKAbleSizeUpdateSpan")[0];
	var opendir = pane.getElementsByClassName("opendir")[0];
	PKAbleSelect.addEventListener("change", function() {
		PKAbleUpdate.innerHTML = Math.max(filfo.filesize / PKAbleSelect.value, 0.1).toFixed(1).toString();
	});
	opendir.addEventListener("click", function() {
		ipcRenderer.send("launchpath", getFolderPath(filfo.path));
	});
}

function generateFileInfoContent() {
	var filfo = tabs[tabID].fileInf;
	var namestr = getFileName(filfo.path);
	//var fnstr;
	//if (namestr.length > 24) {
	//	fnstr = "<marquee>" + namestr + "</marquee>"
	//}else {
	//	fnstr = namestr
	//}
	var pathstr = filfo.path;
	var pstr;
	if (pathstr.length > 24) {
		pstr = "<marquee title='" + pathstr + "'>" + pathstr + "</marquee>"
	}else {
		pstr = pathstr
	}
	return "<h1>" + langpack.imageInfo + "</h1><p></p><p class='ilitem'><b>" + langpack.name + "</b>: <span>" + namestr + "</span></p><p class='ilitem'><b>" + langpack.type + ": </b>" + getFileExtension(filfo.path) + "</p><p class='ilitem'><b>" + langpack.width + ": </b>" + tabs[tabID].imgW.toString() + " (" + filfo.size.width + ")" + "</p><p class='ilitem'><b>" + langpack.height + ": </b>" + tabs[tabID].imgH.toString() + " (" + filfo.size.height + ")" + "</p><p class='ilitem'><b>" + langpack.fileSize + ": </b><span class='PKAbleSizeUpdateSpan'>" + Math.max(filfo.filesize / 1024, 0.1).toFixed(1).toString() + "</span><select class='PKAbleSizeSelect'><option value='1'>B</option><option selected value='1024'>KB</option><option value='1048576'>MB</option></select></p><p class='ilitem'><b>" + langpack.creationDate + ": </b><span>" + DateToString(filfo.stats.ctime) + "</span></p><p class='ilitem'><b>" + langpack.lastModifiedDate + ": </b><span>" + DateToString(filfo.stats.mtime) + "</span></p><p class='ilitem'><b>" + langpack.lastAccessDate + ": </b><span>" + DateToString(filfo.stats.atime) + "</span> </p><p class='ilitem'><b>" + langpack.folder + ": </b><span class='opendir clickable'>" + getFolderName(filfo.path) + "</span></p><p class='ilitem'><b>" + langpack.path + ": </b>" + pstr + "</p>"
}

function DateToString(date) {
	return date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();
}

ipcRenderer.on("dsimg", (event,data) => {
	tabs[tabID].zoomPrct = 1;
	tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2);
	tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2);
	animateZoomPos();
	posImg();
})

ipcRenderer.on("centerimg", (event,data) => {
	tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2);
	tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2);
	animateZoomPos();
	posImg();
})
ipcRenderer.on("showsettings", (event,data) => {
	showSettings();
});

function zRot() {
		try {
			while (tabs[tabID].imgH * tabs[tabID].zoomPrct > imgViewCnt.offsetWidth) {
				tabs[tabID].zoomPrct -= 0.1
			}
		}catch {}
		try {
			while (tabs[tabID].imgW * tabs[tabID].zoomPrct > imgViewCnt.offsetHeight) {
				tabs[tabID].zoomPrct -= 0.1
			}
		}catch {}
		//tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2);
		//tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2);
}

ipcRenderer.on("fullimg", (event,data) => {
	tabs[tabID].zoomPrct = 1;
	if (tabs[tabID].rot == 90) {
		zRot();
	}else if (tabs[tabID].rot == 270) {
		zRot();
	}else if (tabs[tabID].rot == -90) {
		zRot();
	}else if (tabs[tabID].rot == -270) {
		zRot();
	}else {
		try {
			while (tabs[tabID].imgW * tabs[tabID].zoomPrct > imgViewCnt.offsetWidth) {
				tabs[tabID].zoomPrct -= 0.1
			}
		}catch {}
		try {
			while (tabs[tabID].imgH * tabs[tabID].zoomPrct > imgViewCnt.offsetHeight) {
				tabs[tabID].zoomPrct -= 0.1
			}
		}catch {}
	}
	tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2);
	tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2);
	animateZoomPos();
	posImg();
})

addEventListener('resize', (event) => {
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
imgViewCnt.focus();
document.addEventListener('keydown', function (event) {
	console.log(event.target.tagName);
	if (event.target.tagName == "INPUT") return;
	console.log(event.keyCode); //for debugging
	if (event.keyCode == 37) {
		prvFile();
	}
	if (event.keyCode == 39) {
		nextFile();
	}
	if (event.keyCode == 79) {
		openFile();
	}
	if (event.ctrlKey) {
		if (event.keyCode == 84) {
			newTab();
		}
		if (event.shiftKey) {
			if (event.keyCode == 9) {
				tabID--;
				if (tabID < 0) {
					tabID = 0;
				} 
				switchTab(tabID);
			}
		}else {
			if (event.keyCode == 9) {
				tabID++;
				if (tabID == tabCount) {
					tabID = tabCount - 1;
				} 
				switchTab(tabID);
			}
		}
	}
});
document.addEventListener("mousemove", function(event) {
	mouseX = event.x;
	mouseY = event.y;
})

function riNR() {
	if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
		tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
	}else if (tabs[tabID].imgX > 0) {tabs[tabID].imgX = 0}else if (tabs[tabID].imgX < -((tabs[tabID].imgW * tabs[tabID].zoomPrct) - imgViewCnt.offsetWidth)) {	tabs[tabID].imgX = -((tabs[tabID].imgW * tabs[tabID].zoomPrct) - imgViewCnt.offsetWidth)}
	
	if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
		tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
	}else if (tabs[tabID].imgY > 0) {tabs[tabID].imgY = 0}else if (tabs[tabID].imgY < -((tabs[tabID].imgH * tabs[tabID].zoomPrct) - imgViewCnt.offsetHeight)) {tabs[tabID].imgY = -((tabs[tabID].imgH * tabs[tabID].zoomPrct) - imgViewCnt.offsetHeight)}
}

function riHR() {
	if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
		tabs[tabID].imgX = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
	}else if (tabs[tabID].imgX > 0) {tabs[tabID].imgX = 0}else if (tabs[tabID].imgX < -((tabs[tabID].imgW * tabs[tabID].zoomPrct) - imgViewCnt.offsetHeight)) {	tabs[tabID].imgX = -((tabs[tabID].imgW * tabs[tabID].zoomPrct) - imgViewCnt.offsetHeight)}
	
	if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
		tabs[tabID].imgY = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
	}else if (tabs[tabID].imgY > 0) {tabs[tabID].imgY = 0}else if (tabs[tabID].imgY < -((tabs[tabID].imgH * tabs[tabID].zoomPrct) - imgViewCnt.offsetWidth)) {tabs[tabID].imgY = -((tabs[tabID].imgH * tabs[tabID].zoomPrct) - imgViewCnt.offsetWidth)}
}

function retimgIfOut() {
	if (tabs[tabID].rot == 90) {
	//	riHR();
	}else if (tabs[tabID].rot == 270) {
	//	riHR();
	}else if (tabs[tabID].rot == -90) {
	//	riHR();
	}else if (tabs[tabID].rot == -270) {
	//	riHR();
	}else {
		riNR();
	}
}
imgViewCnt.addEventListener("mousedown", function() {dragging = true})
imgViewCnt.addEventListener("mouseup", function() {dragging = false})
imgViewCnt.addEventListener("mousemove", function(evt) {
	if (dragging) {
		tabs[tabID].imgX += evt.clientX - oldpos.x;
		tabs[tabID].imgY += evt.clientY - oldpos.y;
		retimgIfOut();
		//console.log(tabs[tabID].imgX,tabs[tabID].imgY);
		posImg();
	}
	oldpos = {"x": evt.clientX,"y": evt.clientY}
})
imgViewCnt.addEventListener("wheel",function(evt) {
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
		}else {
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
})

function fsize() {
	tabs[tabID].imgView.style.height = tabs[tabID].imgW * tabs[tabID].zoomPrct;
	tabs[tabID].imgView.style.width = tabs[tabID].imgH * tabs[tabID].zoomPrct;
}

function posImg() {
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
		tabs[tabID].imgView.style.width = tabs[tabID].imgW * tabs[tabID].zoomPrct;
		tabs[tabID].imgView.style.height = tabs[tabID].imgH * tabs[tabID].zoomPrct;
	//}
	var extStr = "";
	//if (isRoted) {
	//	extStr = " translate(" + (25 * tabs[tabID].zoomPrct) + "% , -" + (25 * tabs[tabID].zoomPrct) + "%)"
	//}
	tabs[tabID].imgView.style.transform = "rotate(" + tabs[tabID].rot + "deg)" + extStr;
}

var remfunc = null;

function animateZoomPos() {
	if (remfunc != null) {
		clearTimeout(remfunc);
	}
	tabs[tabID].imgView.classList.add("aniLR");
	//setTimeout(functodo ,1);
	remfunc = setTimeout(function() {
		tabs[tabID].imgView.classList.remove("aniLR")
	}, 201)
}

function openFile() {
	ipcRenderer.send("openfile", tabID)
}

function prvFile() {
	ipcRenderer.send("prvfile", tabID)
}

function nextFile() {
	ipcRenderer.send("nextfile", tabID)
}

function zoomIn() {
	tabs[tabID].zoomPrct += 0.1;
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
}

function zoomOut() {
	tabs[tabID].zoomPrct -= 0.1;
	if (tabs[tabID].zoomPrct <= 0) {tabs[tabID].zoomPrct = 0.1}
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
}

function imageLoaded(id) {
	loadingText.style.display = "none";
	//setTimeout(function() {
	tabs[id].imgW = ghostImg.clientWidth;
	tabs[id].imgH = ghostImg.clientHeight;
	console.log("set width",tabs[id].imgW,tabs[id].imgH);
	tabs[tabID].zoomPrct = 1;
	try {
		while (tabs[id].imgW * tabs[tabID].zoomPrct > imgViewCnt.offsetWidth) {
			tabs[tabID].zoomPrct -= 0.1
		}
	}catch {}
	try {
		while (tabs[id].imgH * tabs[tabID].zoomPrct > imgViewCnt.offsetHeight) {
			tabs[tabID].zoomPrct -= 0.1
		}
	}catch {}
	if (tabs[id].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		tabs[id].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[id].imgW * tabs[tabID].zoomPrct / 2)
	}
	if (tabs[id].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		tabs[id].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[id].imgH * tabs[tabID].zoomPrct / 2)
	}
	animateZoomPos();
	posImg();
	//},1)
}

ghostImg.addEventListener("aa   load",function () {
	tabs[tabID].imgW = ghostImg.clientWidth;
	tabs[tabID].imgH = ghostImg.clientHeight;
	console.log("set width",tabs[tabID].imgW,tabs[tabID].imgH);
	
	posImg();
})

function recyleImg() {
	ipcRenderer.send("recylefile", tabs[tabID].fileInf.path)
}

function openFWindow(html) {
	var win = document.createElement("div");
	win.classList.add("fullscreenWindow");
	win.style.overflow = "auto";
	var closeBtn = document.createElement("button");
	closeBtn.classList.add("fullscreenWindowClose");
	closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z"/></svg>';
	closeBtn.classList.add("limon","pill");
	win.appendChild(closeBtn);
	var contDiv = document.createElement("div");
	contDiv.classList.add("fullscreenWindowContent");
	contDiv.innerHTML = html;
	win.appendChild(contDiv);
	document.body.appendChild(win);
	setTimeout(function() {
		win.style.top = "0";
	},1);
	closeBtn.addEventListener("click",function() {
		win.style.top = "";
		setTimeout(function() {
			document.body.removeChild(win);
		},600)
	});
	return contDiv;
}
function showSettings() {
	var optSelectHTML = "<option value='AUTO'>" + langpack.automatic + "</option>";
	langs.forEach((lang) => {
		optSelectHTML += "<option value='" + lang + "'>" + lang + "</option>"
	});
	var sets = openFWindow("<h1>" + langpack.settings + "</h1><h3>" + langpack.general + "</h3><input type='checkbox' name='cbEnableTabs' id='cbEnableTabs' class='enabletab'/><label for='cbEnableTabs'>" + langpack.enableTabs + "</label><br><h3>Language</h3><select value='" + settingsdata["language"] + "' class='langsb'>" + optSelectHTML + "</select>");
	sets.querySelector(".langsb").addEventListener("change",function() {
		settingsdata["language"] = sets.querySelector(".langsb").value;
		ipcRenderer.send('savesettings', settingsdata);
	});
	sets.querySelector(".langsb").value = settingsdata["language"];
	sets.querySelector(".enabletab").checked = settingsdata["enableTabs"];
	sets.querySelector(".enabletab").addEventListener("click", function() {
		settingsdata["enableTabs"] = sets.querySelector(".enabletab").checked;
		ipcRenderer.send('savesettings', settingsdata);
	});
}

function openRightPane(html,paneID) {
	var sb = document.createElement("div");
	sb.setAttribute("paneid",paneID);
	sb.style.height = "100%";
	sb.style.width = "0";
	//sb.style.maxWidth = "1px";
	sb.style.transition = "width 200ms"; //max-width 500ms,min-width 500ms
	sb.style.overflow = "auto";
	sb.style.position = "relative";
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
	closeBtn.classList.add("limon","pill");
	closeBtn.addEventListener("click", function() {
		sb.style.width = "0";
		var aniposer = setInterval(function() {
			if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
				tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
			}
			if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
				tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
			}
			posImg();
			retimgIfOut();
		},1)
		setTimeout(function() {
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
		},200)
	});
	var sbcontent = document.createElement("div");
	sbcontent.innerHTML = html;
	sbcontent.style.width = "100%";
	//sb.style.overflowX = "hidden";
	sbcontent.style.position = "absolute";
	sbcontent.style.top = "0";
	sbcontent.style.left = "0";
	sbcontent.style.minWidth = "270px";
	sbcontent.classList.add("rightpanecontent");
	sb.appendChild(closeBtn);
	sb.appendChild(sbcontent);
	setTimeout(function() {
		sb.style.width = "300px";
	},10)
	var aniposer = setInterval(function() {
		if (tabs[tabID].imgW * tabs[tabID].zoomPrct < imgViewCnt.offsetWidth) {
			tabs[tabID].imgX = (imgViewCnt.offsetWidth / 2) - (tabs[tabID].imgW * tabs[tabID].zoomPrct / 2)
		}
		if (tabs[tabID].imgH * tabs[tabID].zoomPrct < imgViewCnt.offsetHeight) {
			tabs[tabID].imgY = (imgViewCnt.offsetHeight / 2) - (tabs[tabID].imgH * tabs[tabID].zoomPrct / 2)
		}
		posImg();
		retimgIfOut();
	},1)
	setTimeout(function() {
		clearInterval(aniposer)
		animateZoomPos();
	},200)
	maincont.appendChild(sb);
	let m_pos;
	function resize(e){
	  const dx = m_pos - e.x;
	  m_pos = e.x;
	  sb.style.width = (parseInt(getComputedStyle(sb, '').width) + dx) + "px";
	  retimgIfOut();
	  posImg();
	}

	sb.addEventListener("mousedown", function(e){
	  if (e.offsetX < RESIZE_BORDER_SIZE) {
		m_pos = e.x;
		document.addEventListener("mousemove", resize, false);
		sb.style.transition = "";
		sb.style.borderLeft = "solid rgba(0,0,0,0.2) " + RESIZE_BORDER_SIZE + "px";
	  }
	}, false);

	document.addEventListener("mouseup", function(){
		document.removeEventListener("mousemove", resize, false);
		sb.style.transition = "width 200ms";
		sb.style.borderLeft = "";
	}, false);
	return sbcontent;
}

function rotL() {
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

function rotR() {
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
	var pathR = path.replace(/\\/g,"/");
	var pt = pathR.split("/");
	return pt[pt.length - 1]
}

function getFolderName(path) {
	var pathR = path.replace(/\\/g,"/");
	var pt = pathR.split("/");
	return pt[pt.length - 2]
}
function getFolderPath(path) {
	var pathR = path.replace(/\\/g,"/");
	var pt = pathR.split("/");
	var out = "";
	for (let i = 0; i < pt.length - 1; i++) {
		out += pt[i] + "/";
	}
	return out;
}

function getFileExtension(pathorfilename) {
	var pt = pathorfilename.split(".");
	return pt[pt.length - 1]
}

var fil = document.querySelectorAll("*");
[].forEach.call(fil,(item) => {
	item.addEventListener("mouseup",function() {item.blur()})
})

function getReadableFileSizeString(fileSizeInBytes) {
  var i = -1;
  var byteUnits = [' KB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
  do {
    fileSizeInBytes /= 1024;
    i++;
  } while (fileSizeInBytes > 1024);

  return [Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i],byteUnits[i]];
}

//const nodeList = document.querySelectorAll(".circular");
//for (let i = 0; i < nodeList.length; i++) {
//	var roat = 0;
//	setInterval(async function() {
//		roat+= 1.5;
//		if (roat === 360) {roat = 0}
//		nodeList[i].style.transform = "rotate(" + roat + "deg)"
//	},1)
//}

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    ipcRenderer.send('openfilep', event.dataTransfer.files[0].path);
});