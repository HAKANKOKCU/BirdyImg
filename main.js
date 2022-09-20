console.time("startup");
console.log("require electron")
const {BrowserWindow,app,Menu,ipcMain,dialog,nativeTheme} = require("electron");
console.log("require fs-extra")
const fs = require("fs-extra");
const pathlib = require('path');
//const { trash } = require('trash');
const os = require('os');
var app_window;
let locale = Intl.DateTimeFormat().resolvedOptions().locale;
var settingsdata;

function saveSettings() {
	let data = JSON.stringify(settingsdata);
	fs.writeFileSync(os.homedir() + "/BirdyImg/settings.json", data);
}

if (!fs.existsSync("resources/asset/bitmap/appico.png")) {
	//file not exists and set path to main directory of app
	var dpath = pathlib.dirname(app.getPath("exe"));
	console.log(app.getPath("exe"))
	process.chdir(dpath)
}

try {
	if (!fs.existsSync(os.homedir() + "/BirdyImg")){
		fs.mkdirSync(os.homedir() + "/BirdyImg");
	}
	if (!fs.existsSync(os.homedir() + "/BirdyImg/extensions.data")) {
		fs.appendFile(os.homedir() + "/BirdyImg/extensions.data", "")
	}
	if (!fs.existsSync(os.homedir() + "/BirdyImg/settings.json")) {
		fs.appendFile(os.homedir() + "/BirdyImg/settings.json", "{}")
	}
}catch{}

//initPath = os.homedir() + "/BirdyImg/";
settingsdata = JSON.parse(fs.readFileSync(os.homedir() + "/BirdyImg/settings.json"));
var njs = {"language":"AUTO","enableTabs":true}
for (var tgn in njs) {
	if(!settingsdata.hasOwnProperty(tgn)) {
		settingsdata[tgn] = njs[tgn];
	}
}
saveSettings();
var gotTheLock = true;

if (settingsdata["enableTabs"] == true) {
	gotTheLock = app.requestSingleInstanceLock()
}
    
if (!gotTheLock) {
  app.quit()
} else {
console.log("init allowed image types")
const allowedext = [".png",".jpg",".jpeg",".bmp",".gif",".ico",".ıco",".svg",".webp",".avif",".avıf"];
const args = process.argv;
console.log(args);
var tabID;
var tabs = {};
var flts;
var langdata;

if (settingsdata["enableTabs"]) {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		console.log(commandLine);
		if (app_window) {
			if (app_window.isMinimized()) app_window.restore()
			app_window.focus()
			if (commandLine.length > 2) {
				if (commandLine[2].toString() != ".") {
					console.log(typeof commandLine[2]);
					app_window.webContents.send("createnewtab","");
					openFil(commandLine[2].toString());
				}
			}
		}
	})
}
app.on("ready", bulidapp);

function bulidapp() {
	console.log("Ready!")
	try {
		var rawdata;
		console.log(settingsdata["language"]);
		if (settingsdata["language"] == "AUTO") {
			if (fs.existsSync("resources/lang/" + locale + ".json")) {
				rawdata = fs.readFileSync("resources/lang/" + locale + ".json");
			}else if (fs.existsSync("resources/lang/" + locale.split("-")[0] + ".json")) {
				rawdata = fs.readFileSync("resources/lang/" + locale.split("-")[0] + ".json");
			}else {	
				rawdata = fs.readFileSync("resources/lang/en.json");
			}
		}else {
			rawdata = fs.readFileSync("resources/lang/" + settingsdata["language"] + ".json");
		}
		langdata = JSON.parse(rawdata);
	} catch(err) {
		console.error(err)
	}
	console.log("Init Open File Types")
	flts = [{
				name: langdata["images"],
				extensions: ["png","jpg","jpeg","bmp","gif","ico","svg","webp","avif"]
			},{
				name: langdata["typeImage"].replace("{TYPE}","PNG"),
				extensions: ['png']
			},{
				name: langdata["typeImage"].replace("{TYPE}","JPG"),
				extensions: ['jpg']
			},{
				name: langdata["typeImage"].replace("{TYPE}","JPEG"),
				extensions: ['jpeg']
			},{
				name: langdata["typeImage"].replace("{TYPE}","BMP"),
				extensions: ['bmp']
			},{
				name: langdata["typeImage"].replace("{TYPE}","GIF"),
				extensions: ['gif']
			},{
				name: langdata["typeImage"].replace("{TYPE}","ICO"),
				extensions: ['ico']
			},{
				name: langdata["typeImage"].replace("{TYPE}","SVG"),
				extensions: ['svg']
			},{
				name: langdata["typeImage"].replace("{TYPE}","WebP"),
				extensions: ['webp']
			},{
				name: langdata["typeImage"].replace("{TYPE}","AVIF"),
				extensions: ['avif']
			}];
	console.log("creating window")
	var windowinf = {
		webPreferences: {
			nodeIntegration:true,
			contextIsolation: false
		},
		icon: "resources/asset/bitmap/appico.png",
		show: false,
		backgroundColor: 'black'
	};
	if (settingsdata.bounds != null) {
		windowinf.x = settingsdata.bounds.x;
		windowinf.y = settingsdata.bounds.y;
		windowinf.width = settingsdata.bounds.width;
		windowinf.height = settingsdata.bounds.height;
	}
	app_window = new BrowserWindow(windowinf);
	app_window.loadFile("resources/asset/index.html");
	//app_window.openDevTools();
	console.log("generating menu list")
	let menu_list = [
		{
			label: langdata.file,
			submenu: [
				{
					label: langdata.open,
					click: function() {
						dialog
							.showOpenDialog(this.app_window, {properties: ["openFile"],
								filters: flts
							})
							.then((res) => {
								if (!res.canceled) {
									openFil(res.filePaths[0]);
								}
							})
					}
				},
				{
					label: langdata.imageInfo,
					accelerator: 'CmdOrCtrl+I',
					click: function() {
						app_window.webContents.send("imageinfo", "");
					}
				},
				{
					label: langdata.fileList,
					accelerator: 'CmdOrCtrl+L',
					click: function() {
						app_window.webContents.send("showfilelist", "");
					}
				},
				{type:"separator"},
				{
					label: langdata.settings,
					accelerator: 'CmdOrCtrl+S',
					click: function() {
						app_window.webContents.send("showsettings", "");
					}
				}
			]
		},
		{
			label: langdata.view,
			submenu: [
				{
					label: langdata.previousImage,
					click: function() {
						tabs[tabID].fileID -= 1
						if (tabs[tabID].fileID < 0 ) {
							tabs[tabID].fileID = 0;
						}
						openFil(tabs[tabID].filelist[tabs[tabID].fileID]);
					}
				},
				{
					label: langdata.nextImage,
					click: function() {
						tabs[tabID].fileID += 1
						if (tabs[tabID].fileID < 0 ) {
							tabs[tabID].fileID = 0;
						}
						openFil(tabs[tabID].filelist[tabs[tabID].fileID]);
					}
				},
				{type: 'separator'},
				{
					label: langdata.centerImage,
					click: function() {
						app_window.webContents.send("centerimg", "");
					}
				},
				{
					label: langdata.showFullImage,
					click: function() {
						app_window.webContents.send("fullimg", "");
					}
				},
				{
					label: langdata.showRealImageSize,
					click: function() {
						app_window.webContents.send("dsimg", "");
					}
				},
				{type: "separator"},
				{ role: 'togglefullscreen',label:langdata.fullscreen }
			]
		}
	];
	if (settingsdata.enableTabs == true) {
		menu_list.push({
			label: langdata.tabs,
			submenu: [
				{
					label: langdata.newTab,
					click: function() {app_window.webContents.send("createnewtab","")}
				}
			]
		});
	}
	try {
		if (args[1].toString() == ".") {
			menu_list.push({
				label: "Dev",
				submenu: [
					{ role: 'reload' },
					{ role: 'forceReload' },
					{ role: 'toggleDevTools' }
				]
			});
		}
	} catch {}
	try{
		datastr = fs.readFileSync(os.homedir() + "/BirdyImg/extensions.data")
		datastr.toString().split("|").forEach((item) => {
			try {
				fs.readFile(item, function(err, data) {try{eval(data.toString())}catch{}})
			}catch {}
		})
	}catch{}
	console.log("generating menu from list")
	const menu_design = Menu.buildFromTemplate(menu_list);
	Menu.setApplicationMenu(menu_design);
	console.log("done generating menu from list")
	app_window.webContents.on('dom-ready', function() {
		console.log("dom is ready")
		if (args.length > 1) {
			if (args[1].toString() != ".") {
				console.log(typeof args[1]);
				openFil(args[1].toString());
			//}else {
			//	app_window.openDevTools();
			}
		}
		app_window.webContents.send("langpack", langdata);
		app_window.webContents.send("settingsdata", settingsdata);
		console.log("show window")
			if (settingsdata.isMaximized == true) {
				app_window.maximize();
			}
		app_window.show();
		var langs = [];
		fs.readdir("resources/lang", (err, files) => {
			console.log(files);
			files.forEach((file) => {
				langs.push(pathlib.parse(pathlib.resolve("resources/lang/", file)).name);
			});
			app_window.webContents.send("langs", langs);
		});
		console.timeEnd("startup");
	});
	app_window.on("close", function() {
		settingsdata.bounds = app_window.getBounds();
		fs.writeFileSync(os.homedir() + "/BirdyImg/settings.json", JSON.stringify(settingsdata));
	})
	app_window.on("maximize",function() {
		settingsdata.isMaximized = true;
	});
	app_window.on("unmaximize",function() {
		settingsdata.isMaximized = false;
	});
}

ipcMain.handle('dark-mode:toggle', () => {
	if (nativeTheme.shouldUseDarkColors) {
		nativeTheme.themeSource = 'light'
	} else {
		nativeTheme.themeSource = 'dark'
	}
	return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('dark-mode:system', () => {
	nativeTheme.themeSource = 'system'
})

ipcMain.on("openfile", (e,arg) => {
	dialog
		.showOpenDialog(this.app_window, {properties: ["openFile"],
		filters: flts})
		.then((res) => {
			if (!res.canceled) {
				openFil(res.filePaths[0]);
			}
		})
})

ipcMain.on("launchpath", (e,arg) => {
	require('child_process').exec(getStartCommand() + " \"" + arg + "\"");
})

ipcMain.on("newtab", (e,arg) => {
	tabs[arg] =	{
				filelist: [],
				filesizes: [],
				fileID: null
			};
})
ipcMain.on("switchtab", (e,arg) => {
	tabID = arg;
})

ipcMain.on("savesettings", (e,arg) => {
	settingsdata = arg;
	saveSettings();
});

ipcMain.on("prvfile", (e,arg) => {
	tabs[tabID].fileID -= 1
	if (tabs[tabID].fileID < 0 ) {
		tabs[tabID].fileID = 0;
	}
	openFil(tabs[tabID].filelist[tabs[tabID].fileID]);
});
ipcMain.on("openfilep", (e,arg) => {
	openFil(arg);
})
ipcMain.on("nextfile", (e,arg) => {
	tabs[tabID].fileID += 1
	if (tabs[tabID].fileID > tabs[tabID].filelist.length - 1 ) {
		tabs[tabID].fileID = tabs[tabID].filelist.length - 1;
	}
	openFil(tabs[tabID].filelist[tabs[tabID].fileID]);
});
ipcMain.on("recylefile", (e,arg) => {
	alert(arg);
});

var cfil;

function openFil(path) {
	if (path != undefined) {
		var sizeOf = require('image-size');
		var dimensions;
		try {
			dimensions = sizeOf(path);
		}catch {
			dimensions = {width:0,height:0}
		}
		var stats = fs.statSync(path);
		app_window.webContents.send("filedata", {
			path: path,
			size: dimensions,
			filesize: stats.size,
			stats: stats
		});
		cfil = path;
		tabs[tabID].filelist = [];
		tabs[tabID].filesizes = [];
		var cid = 0;
		fs.readdir(pathlib.dirname(path), (err, files) => {
			files.forEach(file => {
				if (allowedext.includes(pathlib.extname(file).toLowerCase())) {
					//console.log(pathlib.resolve(pathlib.dirname(path), file));
					var pathresolve = pathlib.resolve(pathlib.dirname(path), file);
					tabs[tabID].filelist.push(pathresolve);
					tabs[tabID].filesizes.push(getFilesizeInBytes(pathresolve));
					if (pathresolve.toLowerCase() == path.toLowerCase()) {
						tabs[tabID].fileID = cid;
					}
					cid++;
				}
			});
			app_window.webContents.send("filelist", {
				fileID: tabs[tabID].fileID,
				list: tabs[tabID].filelist,
				filesizes:tabs[tabID].filesizes
			});
		});
	}
}
function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}

function getStartCommand() {
   switch (process.platform) { 
      case 'darwin' : return 'open';
      case 'win32' : return 'start ""';
      case 'win64' : return 'start ""';
      default : return 'xdg-open';
   }
}
}