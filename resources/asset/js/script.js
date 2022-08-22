const { ipcRenderer } = require("electron");

var fileInf;
let imgView = document.getElementById("view");
let imgViewCnt = document.getElementById("imgView");
let maincont = document.getElementsByTagName("main")[0];
let loadingText = document.getElementById("loadingText");
var zoomPrct = 1;
var rot = 0;
var dragging = false;
var fileID;
var filelist;
var oldpos = {
	"x":0,
	"y":0
}
var imgX = 0;
var imgY = 0;
var imgW = 0;
var imgH = 0;
var langpack;
var ghostImg = document.createElement("img");
//ghostImg.style.opacity = "0";
document.body.appendChild(ghostImg);
var isRoted = false;
var mouseX = 0,mouseY = 0;

ipcRenderer.on("filedata", (event,data) => {
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
	posImg();
});

ipcRenderer.on("filelist", (event,data) => {
	fileID = data.fileID;
	filelist = data.list;
	var fil = document.getElementsByClassName("fileListItem");
	[].forEach.call(fil,(item) => {
		if (item.getAttribute("data-imageid") == fileID) {
			item.style.backgroundColor = "lightgray"
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
		HTMLs += "<div class='fileListItem' data-imageid='" + index + "' title='" + getFileName(item) + "' style='" + extraCSSLI + "' onclick='ipcRenderer.send(`openfilep`,`" + item.replace(/\\/g,"\\\\") + "`)'><center><img src='" + item + "' style='max-height:100px;max-width:245px' loading='lazy' class='limon darkshandow'></center></div>"
	});
	openRightPane(HTMLs)
}

ipcRenderer.on("langpack", (event,data) => {
	langpack = data;
	loadingText.innerText = langpack.loadingImage;
});
ipcRenderer.on("imageinfo", (event,data) => {
	openFileInfo();
});

function openFileInfo() {
	var filfo = fileInf;
	var namestr = getFileName(filfo.path);
	var fnstr;
	if (namestr.length > 24) {
		fnstr = "<marquee>" + namestr + "</marquee>"
	}else {
		fnstr = namestr
	}
	var pane = openRightPane("<h1>" + langpack.imageInfo + "</h1><p></p><p class='ilitem'>" + langpack.name + ": " + fnstr + "</p><p class='ilitem'>" + langpack.width + ": " + imgW.toString() + " (" + filfo.size.width + ")" + "</p><p class='ilitem'>" + langpack.height + ": " + imgH.toString() + " (" + filfo.size.height + ")" + "</p><p class='ilitem'>" + langpack.fileSize + ": <span class='PKAbleSizeUpdateSpan'>" + Math.round(filfo.filesize / 1024).toString() + "</span><select class='PKAbleSizeSelect'><option value='1'>B</option><option selected value='1024'>KB</option><option value='1048576'>MB</option></select></p>");
	var PKAbleSelect = pane.getElementsByClassName("PKAbleSizeSelect")[0];
	var PKAbleUpdate = pane.getElementsByClassName("PKAbleSizeUpdateSpan")[0];
	PKAbleSelect.addEventListener("change", function() {
		PKAbleUpdate.innerHTML = Math.round(filfo.filesize / PKAbleSelect.value).toString()
	});
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

document.body.addEventListener('keydown', function (event) {
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
	if (imgH * zoomPrct < imgViewCnt.offsetWidth) {
		imgX = (imgViewCnt.offsetWidth / 2) - (imgH * zoomPrct / 2)
	}else if (imgX > 0) {imgX = 0}else if (imgX < -((imgH * zoomPrct) - imgViewCnt.offsetWidth)) {	imgX = -((imgH * zoomPrct) - imgViewCnt.offsetWidth)}
	
	if (imgW * zoomPrct < imgViewCnt.offsetHeight) {
		imgY = (imgViewCnt.offsetHeight / 2) - (imgW * zoomPrct / 2)
		console.log((imgViewCnt.offsetHeight / 2) - (imgW * zoomPrct / 2))
	}else if (imgY > 0) {imgY = 0}else if (imgY < -((imgW * zoomPrct) - imgViewCnt.offsetHeight)) {imgY = -((imgW * zoomPrct) - imgViewCnt.offsetHeight)}
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

function openRightPane(html) {
	var sb = document.createElement("div");
	sb.style.height = "100%";
	sb.style.width = "0";
	//sb.style.maxWidth = "1px";
	sb.style.transition = "width 200ms"; //max-width 500ms,min-width 500ms
	sb.style.overflow = "auto";
	sb.style.position = "relative";
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

var fil = document.querySelectorAll("*");
[].forEach.call(fil,(item) => {
	item.addEventListener("mouseup",function() {item.blur()})
})