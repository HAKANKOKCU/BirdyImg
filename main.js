console.time("startup");
console.log("require electron")
const {BrowserWindow,app,Menu,ipcMain,dialog,nativeTheme} = require("electron");
//const { FileManager } = require("./lib/FileManager");
console.log("require fs-extra")
const fs = require("fs-extra");
console.log("require path")
const pathlib = require('path');
//const { trash } = require('trash');
const args = process.argv;
var os;
console.log(args);
var app_window;
var filelist = [];
var filesizes = [];
let locale = Intl.DateTimeFormat().resolvedOptions().locale;
var langdata;
var settingsdata;
console.log("init allowed image types")
const allowedext = [".png",".jpg",".jpeg",".bmp",".gif",".ico",".ıco",".svg",".webp"];
const flts = [{
				name: 'Images',
				extensions: ["png","jpg","jpeg","bmp","gif","ico","svg","webp"]
			},{
				name: 'PNG Image',
				extensions: ['png']
			},{
				name: 'JPG Image',
				extensions: ['jpg']
			},{
				name: 'JPEG Image',
				extensions: ['jpeg']
			},{
				name: 'BMP Image',
				extensions: ['bmp']
			},{
				name: 'GIF Image',
				extensions: ['gif']
			},{
				name: 'ICO Image',
				extensions: ['ico']
			},{
				name: 'SVG Image',
				extensions: ['svg']
			},{
				name: 'WebP Image',
				extensions: ['webp']
			}]
var fileID;

app.on("ready", bulidapp);

function bulidapp() {
	console.log("Ready!")
	try {
		if (!fs.existsSync("resources/asset/bitmap/appico.png")) {
			//file not exists and set path to main directory of app
			var dpath = pathlib.dirname(app.getPath("exe"));
			console.log(app.getPath("exe"))
			process.chdir(dpath)
		}
		console.log("import os")
		os = require('os');
		initPath = os.homedir() + "/BirdyImg/";
		if (!fs.existsSync(os.homedir() + "/BirdyImg")){
			fs.mkdirSync(os.homedir() + "/BirdyImg");
		}
		if (!fs.existsSync(os.homedir() + "/BirdyImg/extensions.data")) {
			fs.appendFile(os.homedir() + "/BirdyImg/extensions.data", "")
		}
		if (!fs.existsSync(os.homedir() + "/BirdyImg/settings.json")) {
			fs.appendFile(os.homedir() + "/BirdyImg/settings.json", "{}")
		}
		settingsdata = JSON.parse(fs.readFileSync(os.homedir() + "/BirdyImg/settings.json"));
		var njs = {"language":"AUTO"}
		for (var tgn in njs) {
			if(!settingsdata.hasOwnProperty(tgn)) {
				settingsdata[tgn] = njs[tgn];
			}
		}
		saveSettings();
		datastr = fs.readFileSync(os.homedir() + "/BirdyImg/extensions.data")
		datastr.toString().split("|").forEach((item) => {
			try {
				fs.readFile(item, function(err, data) {eval(item)})
			}catch {}
		})
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
	console.log("creating window")
	var windowinf = {
		webPreferences: {
			nodeIntegration:true
		},
		icon: "resources/asset/bitmap/appico.png",
		show: false,
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
					click: function() {
						app_window.webContents.send("imageinfo", "");
					}
				},
				{
					label: langdata.fileList,
					click: function() {
						app_window.webContents.send("showfilelist", "");
					}
				},
				{type:"separator"},
				{
					label: langdata.settings,
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
						fileID -= 1
						if (fileID < 0 ) {
							fileID = 0;
						}
						openFil(filelist[fileID]);
					}
				},
				{
					label: langdata.nextImage,
					click: function() {
						fileID += 1
						if (fileID < 0 ) {
							fileID = 0;
						}
						openFil(filelist[fileID]);
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
				}
			]
		}
	];
	try {
		if (args[1].toString() == ".") {
			menu_list.push({
				label: "Dev",
				submenu: [
					{
						label: "DevTools",
						click: function() {app_window.openDevTools()}
					}
				]
			});
		}
	} catch {}
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

ipcMain.on("savesettings", (e,arg) => {
	settingsdata = arg;
	saveSettings();
});

ipcMain.on("prvfile", (e,arg) => {
	fileID -= 1
	if (fileID < 0 ) {
		fileID = 0;
	}
	openFil(filelist[fileID]);
});
ipcMain.on("openfilep", (e,arg) => {
	openFil(arg);
})
ipcMain.on("nextfile", (e,arg) => {
	fileID += 1
	if (fileID > filelist.length - 1 ) {
		fileID = filelist.length - 1;
	}
	openFil(filelist[fileID]);
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
		app_window.webContents.send("filedata", {
			path: path,
			size: dimensions,
			filesize: getFilesizeInBytes(path)
		});
		cfil = path;
		filelist = [];
		filesizes = [];
		var cid = 0;
		fs.readdir(pathlib.dirname(path), (err, files) => {
			files.forEach(file => {
				if (allowedext.includes(pathlib.extname(file).toLowerCase())) {
					//console.log(pathlib.resolve(pathlib.dirname(path), file));
					var pathresolve = pathlib.resolve(pathlib.dirname(path), file);
					filelist.push(pathresolve);
					filesizes.push(getFilesizeInBytes(pathresolve));
					if (pathresolve.toLowerCase() == path.toLowerCase()) {
						fileID = cid;
					}
					cid++;
				}
			});
			app_window.webContents.send("filelist", {
				fileID: fileID,
				list: filelist,
				filesizes:filesizes
			});
		});
	}
}
function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}
function saveSettings() {
	let data = JSON.stringify(settingsdata);
	fs.writeFileSync(os.homedir() + "/BirdyImg/settings.json", data);
}