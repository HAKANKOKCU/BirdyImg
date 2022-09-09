const { ipcRenderer } = require("electron");


const RESIZE_BORDER_SIZE = 4;
var fileInf;
let imgView = document.getElementById("view");
let imgViewCnt = document.getElementById("imgView");
let maincont = document.getElementsByTagName("main")[0];
let loadingText = document.getElementById("loading");
var zoomPrct = 1;
var rot = 0;
var dragging = false;
var fileID;
var filelist;
var filesizes;
var settingsdata;
var oldpos = {
	"x":0,
	"y":0
}
var imgX = 0;
var imgY = 0;
var imgW = 0;
var imgH = 0;
var langpack;
var langs;
var ghostImg = document.createElement("img");
//ghostImg.style.opacity = "0";
document.body.appendChild(ghostImg);
var isRoted = false;
var mouseX = 0,mouseY = 0;

ipcRenderer.on("settingsdata", (event,data) => {
	settingsdata = data;
});
ipcRenderer.on("langs", (event,data) => {
	langs = data;
});

ipcRenderer.on("filedata", (event,data) => {
	document.title = "BirdyImg - " + getFileName(data.path);
	loadingText.style.display = "";
	imgView.src = data.path;
	ghostImg.src = data.path;
	fileInf = data;
	imgX = 0;
	isRoted = false;
	imgY = 0;
	imgW = fileInf.size.width;
	imgH = fileInf.size.height;
	if (ghostImg.complete) {
		imgW = ghostImg.clientWidth;
		imgH = ghostImg.clientHeight;
		console.log("set width",imgW,imgH);
	}else {
		setTimeout(function() {
			imgW = ghostImg.clientWidth;
			imgH = ghostImg.clientHeight;
			console.log("set width",imgW,imgH);
			posImg();
		},100)
	}
	zoomPrct = 1;
	rot = 0;
	try {
		while (imgW * zoomPrct > imgViewCnt.offsetWidth) {
			zoomPrct -= 0.1
		}
	}catch {}
	try {
		while (imgH * zoomPrct > imgViewCnt.offsetHeight) {
			zoomPrct -= 0.1
		}
	}catch {}
	if (imgW * zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2)
	}
	if (imgH * zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2)
	}
	//posImg();
	var filfo = fileInf;
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
	fileID = data.fileID;
	filelist = data.list;
	filesizes = data.filesizes;
	var fil = document.getElementsByClassName("fileListItem");
	Array.prototype.forEach.call(fil,(item) => {
		if (item.getAttribute("data-imageid") == fileID) {
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
	filelist.forEach((item,index) => {
		var extraCSSLI = "";
		if (index == fileID) {extraCSSLI = "background-color:lightgray"}
		HTMLs += "<div class='fileListItem' data-imageid='" + index + "' title='" + getFileName(item) + "&#010;" + langpack.fileSize + ": " + getReadableFileSizeString(filesizes[index])[0] + "' style='" + extraCSSLI + "' onclick='ipcRenderer.send(`openfilep`,`" + item.replace(/\\/g,"\\\\") + "`)'><center><img src='" + item + "' style='max-height:100px;max-width:245px' loading='lazy' class='limon darkshandow'></center></div>"
	});
	openRightPane(HTMLs,"FileList")
}

ipcRenderer.on("langpack", (event,data) => {
	langpack = data;
	//loadingText.innerText = langpack.loadingImage;
});
ipcRenderer.on("imageinfo", (event,data) => {
	openFileInfo();
});

function openFileInfo() {
	var filfo = fileInf;
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
	var filfo = fileInf;
	var namestr = getFileName(filfo.path);
	var fnstr;
	if (namestr.length > 24) {
		fnstr = "<marquee>" + namestr + "</marquee>"
	}else {
		fnstr = namestr
	}
	var pathstr = filfo.path;
	var pstr;
	if (pathstr.length > 24) {
		pstr = "<marquee title='" + pathstr + "'>" + pathstr + "</marquee>"
	}else {
		pstr = pathstr
	}
	return "<h1>" + langpack.imageInfo + "</h1><p></p><p class='ilitem'>" + langpack.name + ": " + fnstr + "</p><p class=''ilitem>" + langpack.type + ": " + getFileExtension(filfo.path) + "</p><p class='ilitem'>" + langpack.width + ": " + imgW.toString() + " (" + filfo.size.width + ")" + "</p><p class='ilitem'>" + langpack.height + ": " + imgH.toString() + " (" + filfo.size.height + ")" + "</p><p class='ilitem'>" + langpack.fileSize + ": <span class='PKAbleSizeUpdateSpan'>" + Math.max(filfo.filesize / 1024, 0.1).toFixed(1).toString() + "</span><select class='PKAbleSizeSelect'><option value='1'>B</option><option selected value='1024'>KB</option><option value='1048576'>MB</option></select></p><p class='ilitem'>" + langpack.folder + ": <span class='opendir clickable'>" + getFolderName(filfo.path) + "</span></p><p class='ilitem'>" + langpack.path + ": " + pstr + "</p>"
}

ipcRenderer.on("dsimg", (event,data) => {
	zoomPrct = 1;
	imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2);
	imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2);
	animateZoomPos();
	posImg();
})

ipcRenderer.on("centerimg", (event,data) => {
	imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2);
	imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2);
	animateZoomPos();
	posImg();
})
ipcRenderer.on("showsettings", (event,data) => {
	showSettings();
});

function zRot() {
		try {
			while (imgH * zoomPrct > imgViewCnt.offsetWidth) {
				zoomPrct -= 0.1
			}
		}catch {}
		try {
			while (imgW * zoomPrct > imgViewCnt.offsetHeight) {
				zoomPrct -= 0.1
			}
		}catch {}
		//imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2);
		//imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2);
}

ipcRenderer.on("fullimg", (event,data) => {
	zoomPrct = 1;
	if (rot == 90) {
		zRot();
	}else if (rot == 270) {
		zRot();
	}else if (rot == -90) {
		zRot();
	}else if (rot == -270) {
		zRot();
	}else {
		try {
			while (imgW * zoomPrct > imgViewCnt.offsetWidth) {
				zoomPrct -= 0.1
			}
		}catch {}
		try {
			while (imgH * zoomPrct > imgViewCnt.offsetHeight) {
				zoomPrct -= 0.1
			}
		}catch {}
	}
	imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2);
	imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2);
	animateZoomPos();
	posImg();
})

addEventListener('resize', (event) => {
	if (imgW * zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2)
	}
	if (imgH * zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2)
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
});
document.addEventListener("mousemove", function(event) {
	mouseX = event.x;
	mouseY = event.y;
})

function riNR() {
	if (imgW * zoomPrct < imgViewCnt.offsetWidth) {
		imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2)
	}else if (imgX > 0) {imgX = 0}else if (imgX < -((imgW * zoomPrct) - imgViewCnt.offsetWidth)) {	imgX = -((imgW * zoomPrct) - imgViewCnt.offsetWidth)}
	
	if (imgH * zoomPrct < imgViewCnt.offsetHeight) {
		imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2)
	}else if (imgY > 0) {imgY = 0}else if (imgY < -((imgH * zoomPrct) - imgViewCnt.offsetHeight)) {imgY = -((imgH * zoomPrct) - imgViewCnt.offsetHeight)}
}

function riHR() {
	if (imgW * zoomPrct < imgViewCnt.offsetHeight) {
		imgX = (imgViewCnt.offsetHeight / 2) - (imgW * zoomPrct / 2)
	}else if (imgX > 0) {imgX = 0}else if (imgX < -((imgW * zoomPrct) - imgViewCnt.offsetHeight)) {	imgX = -((imgW * zoomPrct) - imgViewCnt.offsetHeight)}
	
	if (imgH * zoomPrct < imgViewCnt.offsetWidth) {
		imgY = (imgViewCnt.offsetWidth / 2) - (imgH * zoomPrct / 2)
	}else if (imgY > 0) {imgY = 0}else if (imgY < -((imgH * zoomPrct) - imgViewCnt.offsetWidth)) {imgY = -((imgH * zoomPrct) - imgViewCnt.offsetWidth)}
}

function retimgIfOut() {
	if (rot == 90) {
	//	riHR();
	}else if (rot == 270) {
	//	riHR();
	}else if (rot == -90) {
	//	riHR();
	}else if (rot == -270) {
	//	riHR();
	}else {
		riNR();
	}
}
imgViewCnt.addEventListener("mousedown", function() {dragging = true})
imgViewCnt.addEventListener("mouseup", function() {dragging = false})
imgViewCnt.addEventListener("mousemove", function(evt) {
	if (dragging) {
		imgX += evt.clientX - oldpos.x;
		imgY += evt.clientY - oldpos.y;
		retimgIfOut();
		//console.log(imgX,imgY);
		posImg();
	}
	oldpos = {"x": evt.clientX,"y": evt.clientY}
})
imgViewCnt.addEventListener("wheel",function(evt) {
	if (evt.deltaY != 0) {
		if (evt.deltaY < 0) {
			zoomIn();
		}else {
			zoomOut();
		}
		if (imgW * zoomPrct > imgViewCnt.offsetWidth) {
			imgX -= (mouseX - (imgViewCnt.offsetWidth / 2)) / 2;
			retimgIfOut();
			animateZoomPos();
		}
		if (imgH * zoomPrct > imgViewCnt.offsetHeight) {
			imgY -= (mouseY - (imgViewCnt.offsetHeight / 2)) / 2;
			retimgIfOut();
			animateZoomPos();
		}
		posImg();
	}
})

function fsize() {
	imgView.style.height = imgW * zoomPrct;
	imgView.style.width = imgH * zoomPrct;
}

function posImg() {
	imgView.style.top = imgY + "px";
	imgView.style.left = imgX + "px";
	//if (rot == 90) {
	//	fsize();
	//}else if (rot == 270) {
	//	fsize();
	//}else if (rot == -90) {
	//	fsize();
	//}else if (rot == -270) {
	//	fsize();
	//}else {	
		imgView.style.width = imgW * zoomPrct;
		imgView.style.height = imgH * zoomPrct;
	//}
	var extStr = "";
	//if (isRoted) {
	//	extStr = " translate(" + (25 * zoomPrct) + "% , -" + (25 * zoomPrct) + "%)"
	//}
	imgView.style.transform = "rotate(" + rot + "deg)" + extStr;
}

var remfunc = null;

function animateZoomPos() {
	if (remfunc != null) {
		clearTimeout(remfunc);
	}
	imgView.classList.add("aniLR");
	//setTimeout(functodo ,1);
	remfunc = setTimeout(function() {
		imgView.classList.remove("aniLR")
	}, 201)
}

function openFile() {
	ipcRenderer.send("openfile", "")
}

function prvFile() {
	ipcRenderer.send("prvfile", "")
}

function nextFile() {
	ipcRenderer.send("nextfile", "")
}

function zoomIn() {
	zoomPrct += 0.1;
	if (imgW * zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2)
	}
	if (imgH * zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2)
	}
	retimgIfOut();
	posImg();
}

function zoomOut() {
	zoomPrct -= 0.1;
	if (zoomPrct <= 0) {zoomPrct = 0.1}
	if (imgW * zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2)
	}
	if (imgH * zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2)
	}
	retimgIfOut();
	posImg();
}

function imageLoaded() {
	loadingText.style.display = "none";
	//setTimeout(function() {
	imgW = ghostImg.clientWidth;
	imgH = ghostImg.clientHeight;
	console.log("set width",imgW,imgH);
	zoomPrct = 1;
	try {
		while (imgW * zoomPrct > imgViewCnt.offsetWidth) {
			zoomPrct -= 0.1
		}
	}catch {}
	try {
		while (imgH * zoomPrct > imgViewCnt.offsetHeight) {
			zoomPrct -= 0.1
		}
	}catch {}
	if (imgW * zoomPrct < imgViewCnt.offsetWidth) {
		animateZoomPos()
		imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2)
	}
	if (imgH * zoomPrct < imgViewCnt.offsetHeight) {
		animateZoomPos()
		imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2)
	}
	animateZoomPos();
	posImg();
	//},1)
}

ghostImg.addEventListener("onload",function () {
	imgW = ghostImg.clientWidth;
	imgH = ghostImg.clientHeight;
	console.log("set width",imgW,imgH);
	posImg();
})

function recyleImg() {
	ipcRenderer.send("recylefile", fileInf.path)
}

function openFWindow(html) {
	var win = document.createElement("div");
	win.classList.add("fullscreenWindow");
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
	var sets = openFWindow("<h1>" + langpack.settings + "</h1><h3>Language</h3><select value='" + settingsdata["language"] + "' class='langsb'>" + optSelectHTML + "</select>");
	sets.querySelector(".langsb").addEventListener("change",function() {
		settingsdata["language"] = sets.querySelector(".langsb").value;
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
			if (imgW * zoomPrct < imgViewCnt.offsetWidth) {
				imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2)
			}
			if (imgH * zoomPrct < imgViewCnt.offsetHeight) {
				imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2)
			}
			posImg();
			retimgIfOut();
		},1)
		setTimeout(function() {
			maincont.removeChild(sb);
			if (imgW * zoomPrct < imgViewCnt.offsetWidth) {
				animateZoomPos()
				imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2)
			}
			if (imgH * zoomPrct < imgViewCnt.offsetHeight) {
				animateZoomPos()
				imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2)
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
		if (imgW * zoomPrct < imgViewCnt.offsetWidth) {
			imgX = (imgViewCnt.offsetWidth / 2) - (imgW * zoomPrct / 2)
		}
		if (imgH * zoomPrct < imgViewCnt.offsetHeight) {
			imgY = (imgViewCnt.offsetHeight / 2) - (imgH * zoomPrct / 2)
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
	rot -= 90;
	if (rot == -360) {
		rot = 0
	}
	isRoted = !isRoted;
	//var imgHold = imgH;
	//imgH = imgW;
	//imgW = imgHold;
	posImg();
}

function rotR() {
	rot += 90;
	if (rot == 360) {
		rot = 0
	}
	isRoted = !isRoted;
	//var imgHold = imgH;
	//imgH = imgW;
	//imgW = imgHold;
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

const nodeList = document.querySelectorAll(".circular");
for (let i = 0; i < nodeList.length; i++) {
	var roat = 0;
	setInterval(async function() {
		roat+= 1.5;
		if (roat === 360) {roat = 0}
		nodeList[i].style.transform = "rotate(" + roat + "deg)"
	},1)
}

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    ipcRenderer.send('openfilep', event.dataTransfer.files[0].path);
});