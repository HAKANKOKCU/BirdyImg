//global.sharedObject = {prop1: process.argv};

const {BrowserWindow,app,Menu,ipcMain,dialog,nativeTheme} = require("electron");
//const { FileManager } = require("./lib/FileManager");
const fs = require("fs-extra");
const pathlib = require('path');
//const { trash } = require('trash');
var sizeOf = require('image-size');
const args = process.argv;
console.log(args);
var app_window;
const os = require('os');
var filelist = [];
let locale = Intl.DateTimeFormat().resolvedOptions().locale;
var langdata;
const allowedext = [".png",".jpg",".jpeg",".bmp",".gif",".ico",".ıco",".svg"];
const flts = [{
				name: 'Images',
				extensions: ["png","jpg","jpeg","bmp","gif","ico","svg"]
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
			}]
var fileID;

app.on("ready", bulidapp);

function bulidapp() {
	try {
		if (!fs.existsSync("resources/asset/bitmap/appico.png")) {
			//file not exists and set path to main directory of app
			var dpath = pathlib.dirname(app.getPath("exe"));
			console.log(app.getPath("exe"))
			process.chdir(dpath)
		}
		if (!fs.existsSync(os.homedir() + "/BirdyImg")){
			fs.mkdirSync(os.homedir() + "/BirdyImg");
		}
		if (!fs.existsSync(os.homedir() + "/BirdyImg/extensions.data")) {
			fs.appendFile(os.homedir() + "/BirdyImg/extensions.data", "")
		}
		datastr = fs.readFileSync(os.homedir() + "/BirdyImg/extensions.data")
		datastr.toString().split("|").forEach((item) => {
			try {
				fs.readFile(item, function(err, data) {eval(item)})
			}catch {}
		})
		var rawdata;
		if (fs.existsSync("resources/lang/" + locale + ".json")) {
			rawdata = fs.readFileSync("resources/lang/" + locale + ".json");
		}else if (fs.existsSync("resources/lang/" + locale.split("-")[0] + ".json")) {
			rawdata = fs.readFileSync("resources/lang/" + locale.split("-")[0] + ".json");
		}else {	
			rawdata = fs.readFileSync("resources/lang/en.json");
		}
		langdata = JSON.parse(rawdata);
	} catch(err) {
		console.error(err)
	}
	app_window = new BrowserWindow({
		webPreferences: {
			nodeIntegration:true
		},
		icon: "resources/asset/bitmap/appico.png",
		show: false
	});
	app_window.loadFile("resources/asset/index.html");
	//app_window.openDevTools();
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
					label: langdata.filelist,
					click: function() {
						app_window.webContents.send("showfilelist", "");
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
	const menu_design = Menu.buildFromTemplate(menu_list);
	Menu.setApplicationMenu(menu_design);
	app_window.webContents.on('did-finish-load', function() {
		if (args.length > 1) {
			if (args[1].toString() != ".") {
				console.log(typeof args[1]);
				openFil(args[1].toString());
			}
		}
		app_window.webContents.send("langpack", langdata); 
		app_window.show();
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
		var cid = 0;
		fs.readdir(pathlib.dirname(path), (err, files) => {
			files.forEach(file => {
				if (allowedext.includes(pathlib.extname(file).toLowerCase())) {
					//console.log(pathlib.resolve(pathlib.dirname(path), file));
					var pathresolve = pathlib.resolve(pathlib.dirname(path), file);
					filelist.push(pathresolve);
					if (pathresolve.toLowerCase() == path.toLowerCase()) {
						fileID = cid;
					}
					cid++;
				}
			});
			app_window.webContents.send("filelist", {
				fileID: fileID,
				list: filelist
			});
		});
	}
}
function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}