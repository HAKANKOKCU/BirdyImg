console.time("startup");
console.log("require electron")
const { BrowserWindow, app, Menu, ipcMain, dialog, nativeTheme,clipboard, desktopCapturer, screen } = require("electron");
console.log("require fs-extra")
var fs = require("fs-extra");
const os = require('os');
var settingsdata;
global.workInBackground = false;
var isfirstopen = true

function saveSettings() {
	let data = JSON.stringify(settingsdata);
	fs.writeFileSync(os.homedir() + "/BirdyImg/settings.json", data);
}

try {
	if (!fs.existsSync(os.homedir() + "/BirdyImg")) {
		fs.mkdirSync(os.homedir() + "/BirdyImg");
	}
	if (!fs.existsSync(os.homedir() + "/BirdyImg/extensions.data")) {
		fs.appendFile(os.homedir() + "/BirdyImg/extensions.data", "")
	}
	if (!fs.existsSync(os.homedir() + "/BirdyImg/settings.json")) {
		fs.appendFileSync(os.homedir() + "/BirdyImg/settings.json", "{}")
	}
} catch { }

//initPath = os.homedir() + "/BirdyImg/";
settingsdata = JSON.parse(fs.readFileSync(os.homedir() + "/BirdyImg/settings.json"));
var njs = { 
	"language": "AUTO", 
	"enableTabs": true, 
	"defaultPanelSide": "Right", 
	"history": [], 
	"recentlySaved": [], 
	"favorites": [],
	"showPositionAndSizeInfo": false, 
	"blurOverlays": false, 
	"autoHideTabs": false, 
	"enableOffImageRendering":true,
	"showTransparencyTexture":true,
	"classicToolbar":false,
	"reversedFileListOrder":false,
	"whenAllTabsAreClosed": 1,
	"toolbarSizeScale":1,
	"imageRenderingType": 0,
	"usemmddyyyydateformat":false,
	"colors": {
		"enableCustomColors": false,
		"accentColor": {
			/*"auto": false,*/
			"value": "#FFAC1C",
			"applyToToolbarButtons": false,
			"applyAsTextColor": false
		}
	}
}
for (var tgn in njs) {
	if (!settingsdata.hasOwnProperty(tgn)) {
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
	var eventfires = {
		menuBulid: [],
		windowLoaded: []
	}
	function addMenuBulidListener(func) {eventfires.menuBulid.push(func)}
	function addWindowLoadedListener(func) {eventfires.windowLoaded.push(func)}
	
	function loadLang() {
		rawdata = "";
		console.log(settingsdata["language"]);
		if (settingsdata["language"] == "AUTO") {
			if (fs.existsSync("resources/lang/" + locale + ".json")) {
				rawdata = fs.readFileSync("resources/lang/" + locale + ".json");
			} else if (fs.existsSync("resources/lang/" + locale.split("-")[0] + ".json")) {
				rawdata = fs.readFileSync("resources/lang/" + locale.split("-")[0] + ".json");
			} else {
				rawdata = fs.readFileSync("resources/lang/en.json");
			}
		} else {
			rawdata = fs.readFileSync("resources/lang/" + settingsdata["language"] + ".json");
		}
		langdata = JSON.parse(rawdata);
		delete rawdata;
	}
	var app_window;
	let locale = Intl.DateTimeFormat().resolvedOptions().locale;
	const pathlib = require('path');
	console.log("init allowed image types")
	const allowedext = [".png", ".jpg", ".jpeg", ".bmp", ".gif", ".ico", ".ıco", ".svg", ".webp", ".avif", ".avıf", ".tif", ".tıf",".tiff",".tıff", ".apng", ".dib", ".dıb",".jfif",".jfıf",".jpe"];
	const args = process.argv;
	console.log(args);
	var tabID;
	var tabs = {};
	var flts;
	var langdata;
	var iswindowloaded = false;
	
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		console.log(commandLine);
		if (BrowserWindow.getAllWindows().length === 0) {
			console.time("startup");
			bulidapp();
		}
		var tryloop = setInterval(function() {
			if (iswindowloaded) {
				if (settingsdata["enableTabs"]) {
					if (app_window.isMinimized()) app_window.restore()
					app_window.focus()
					var newtabcreate = true
					commandLine.forEach((item, index) => {
						if (index != 0) {
							if (!item.startsWith("--")) {
								console.log(item);
								app_window.webContents.send("createnewtab", "");
								setTimeout(function() {
									openFil(item);
								},200)
								newtabcreate = false
							}
						}
					});
					if (newtabcreate) app_window.webContents.executeJavaScript("newTab()");
				}else {
					app_window.webContents.executeJavaScript("newTab()");
				}
				clearInterval(tryloop);
			}
		},100)
		
	})
	var launchApp = true
	if (args.includes("--background-task")) {
		launchApp = false
	}
	if (launchApp) app.on("ready", bulidapp);
	var extensions = []
	function bulidapp() {
		//isFirstFolderLoad = true
		iswindowloaded = false
		console.log("Ready!")
		try {
			if (!fs.existsSync("resources/asset/bitmap/appico.png")) {
				//file not exists and set path to main directory of app
				var exep = app.getPath("exe");
				var dpath = pathlib.dirname(exep);
				console.log(exep)
				process.chdir(dpath)
			}
			loadLang()
		} catch (err) {
			console.error(err)
		}
		console.log("Init Open File Types")
		flts = [{
			name: langdata["images"],
			extensions: ["png", "jpg", "jpeg", "bmp", "gif", "ico", "svg", "webp", "avif", "tif","tiff", "apng", "dib","jfif","jpe"]
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "PNG"),
			extensions: ['png']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "APNG"),
			extensions: ['apng']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "JPG"),
			extensions: ['jpg']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "JPEG"),
			extensions: ['jpeg']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "BMP"),
			extensions: ['bmp']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "GIF"),
			extensions: ['gif']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "ICO"),
			extensions: ['ico']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "SVG"),
			extensions: ['svg']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "WebP"),
			extensions: ['webp']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "AVIF"),
			extensions: ['avif']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "TIFF (TIF)"),
			extensions: ['tif']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "TIFF"),
			extensions: ['tiff']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "DIB"),
			extensions: ['dib']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "JFIF"),
			extensions: ['jfif']
		}, {
			name: langdata["typeImage"].replace("{TYPE}", "JPE"),
			extensions: ['jpe']
		}];
		console.log("creating window")
		var windowinf = {
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false
			},
			icon: "resources/asset/bitmap/appico.png",
			show: false,
			title: "BirdyImg",
			backgroundColor: nativeTheme.shouldUseDarkColors ? '#000000' : '#FFFFFF'
		};
		if (settingsdata.bounds != null) {
			windowinf.x = settingsdata.bounds.x;
			windowinf.y = settingsdata.bounds.y;
			windowinf.width = settingsdata.bounds.width;
			windowinf.height = settingsdata.bounds.height;
		}
		app_window = new BrowserWindow(windowinf);
		app_window.loadFile("resources/asset/index.html");
		console.log("generating menu list")
		extensions = []
		try {
			datastr = fs.readFileSync(os.homedir() + "/BirdyImg/extensions.data")
			if (datastr.toString().trim() != "") {
				list = {}
				try {
					list = JSON.parse(datastr.toString())
				}catch {
					list = datastr.toString().split("|")
				}
				list.forEach((item) => {
					try {
						let jdata = fs.readFileSync(item)
						let json = JSON.parse(jdata)
						let dirpath = pathlib.dirname(item)
						let data = fs.readFileSync(json["MainPath"].replace(/_DIR_/g,dirpath))
						json["CURRENTDIR"] = dirpath;
						json["CURRENTPATH"] = item;
						extensions.push(json)
						try { eval(data.toString()) } catch (e) { console.error(e) } 
					} catch (e) { console.error(e) }
				})
			}
		} catch (e) { console.error(e) }
		bulidMAmenu()
		if (settingsdata.isMaximized == true) {
			app_window.maximize();
		}
		app_window.show();
		app_window.on("enter-full-screen",function() {
			app_window.setAutoHideMenuBar(true)
		})
		app_window.on("leave-full-screen",function() {
			app_window.setAutoHideMenuBar(false)
			app_window.setMenuBarVisibility(true)
		})
		app_window.webContents.on('dom-ready', function () {
			console.log("dom is ready")
			if (isfirstopen) {
				try {
					if (!args[1].startsWith("--")) app_window.webContents.executeJavaScript("newTab()");
				}catch {app_window.webContents.executeJavaScript("newTab()");}
				setTimeout(function() {
					if (args.length > 1) {
						if (args[1].toString() != ".") {
							var da = true;
							try {da = !args[1].startsWith("--");}catch{}
							if (da) {
								console.log(typeof args[1]);
								openFil(args[1].toString());
							}
							//}else {
							//	app_window.openDevTools();
						}
					}
				},200)
				eventfires.windowLoaded.forEach((func) => func())
				isfirstopen = false
			}
			app_window.webContents.send("langpack", langdata);
			app_window.webContents.send("settingsdata", settingsdata);
			console.log("show window")

			app_window.show();
			var langs = [];
			fs.readdir("resources/lang", (err, files) => {
				console.log(files);
				files.forEach((file) => {
					langs.push(pathlib.parse(pathlib.resolve("resources/lang/", file)).name);
				});
				app_window.webContents.send("langs", langs);
			});
			extensions.forEach((extension) => {
				try {
					if (extension.hasOwnProperty("RendererPath")) {
						let dirpath = extension.CURRENTDIR
						app_window.webContents.executeJavaScript(fs.readFileSync(extension["RendererPath"].replace(/_DIR_/g,dirpath)),true)
					}
				}catch (e) {console.error(e)}
			})
			console.timeEnd("startup");
			iswindowloaded = true;
		});
		app_window.on("close", function () {
			settingsdata.bounds = app_window.getBounds();
			fs.writeFileSync(os.homedir() + "/BirdyImg/settings.json", JSON.stringify(settingsdata));
			tabs = {}
		})
		app_window.on("maximize", function () {
			settingsdata.isMaximized = true;
		});
		app_window.on("unmaximize", function () {
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

	ipcMain.on("enterEditor", (e, arg) => {
		Menu.setApplicationMenu(editormenu_design);
	})
	
	ipcMain.on("writeImage", (e, arg) => {
		clipboard.writeImage(arg)
	})
	
	ipcMain.on("saveextensions", (e,arg) => {
		var jsonarray = []
		arg.forEach(function(i) {
			jsonarray.push(i.CURRENTPATH)
		})
		var stringify = JSON.stringify(jsonarray);
		extensions = arg;
		fs.writeFileSync(os.homedir() + "/BirdyImg/extensions.data", stringify)
	})
	
	ipcMain.on("importExtension", (e,arg) => {
		dialog
			.showOpenDialog(this.app_window, {
				properties: ["openFile"],
				filters: [
					{
						name: "JSON",
						extensions: ["json"]
					}
				]
			})
			.then((res) => {
				if (!res.canceled) {
					var jsonarray = []
					extensions.forEach(function(i) {
						jsonarray.push(i.CURRENTPATH)
					})
					jsonarray.push(res.filePaths[0])
					var stringify = JSON.stringify(jsonarray);
					fs.writeFileSync(os.homedir() + "/BirdyImg/extensions.data", stringify)
				}
			})
	})

	ipcMain.on("exitEditor", (e, arg) => {
		Menu.setApplicationMenu(menu_design);
	})
	
	ipcMain.on("close",(e,arg) => {
		app_window.close()
	})
	
	ipcMain.on("deleteCurrentFile", (e,arg) => {
		deleteCurrentFile(arg)
	})
	
	function deleteCurrentFile(arg) {
		dialog.showMessageBox(app_window,{message: langdata.doYouWantToDeleteThisFileFromDisk,title: langdata.deleteFile, type: "question", buttons:[langdata.no,langdata.yes]}).then((res) => {
			console.log(res)
			if (res.response == 1) {
				fs.unlinkSync(arg);
				tabs[tabID].oldDirPath = ""
				isFirstFolderLoad = true
				tabs[tabID].fileID += 1
				if (tabs[tabID].fileID > tabs[tabID].filelist.length - 1) {
					console.log("Reset to 0")
					tabs[tabID].fileID = 0;
				}
				openFil(tabs[tabID].filelist[tabs[tabID].fileID]);
			}
		})
	}

	ipcMain.on("openfile", (e, arg) => {
		dialog
			.showOpenDialog(this.app_window, {
				properties: ["openFile"],
				filters: flts
			})
			.then((res) => {
				if (!res.canceled) {
					openFil(res.filePaths[0]);
				}
			})
	})

	ipcMain.on("launchpath", (e, arg) => {
		require('child_process').exec(getStartCommand() + " \"" + arg + "\"");
	})

	ipcMain.on("newtab", (e, arg) => {
		tabs[arg] = {
			filelist: [],
			filesizes: [],
			fileID: null,
			oldDirPath: null,
			filesInDIR: [],
			isFirstFolderLoad: true,
			currentFile: null
		};
		e.returnValue = "";
	})
	ipcMain.on("switchtab", (e, arg) => {
		tabID = arg;
		e.returnValue = "";
	})

	ipcMain.on("savesettings", (e, arg) => {
		settingsdata = arg;
		saveSettings();
		loadLang();
		try {
			app_window.webContents.send("langpack", langdata);
			bulidMAmenu();
		}catch (e) {
			
		}
	});

	ipcMain.on("prvfile", (e, arg) => {
		console.log("Back!")
		tabs[tabID].fileID -= 1
		if (tabs[tabID].fileID < 0) {
			console.log("Reset To End")
			tabs[tabID].fileID = tabs[tabID].filelist.length - 1;
		}
		openFil(tabs[tabID].filelist[tabs[tabID].fileID]);
	});

	ipcMain.on("openfilep", (e, arg) => {
		openFil(arg);
		e.returnValue = "";
	})
	ipcMain.on("nextfile", (e, arg) => {
		console.log("Next!")
		tabs[tabID].fileID += 1
		if (tabs[tabID].fileID > tabs[tabID].filelist.length - 1) {
			console.log("Reset to 0")
			tabs[tabID].fileID = 0;
		}
		openFil(tabs[tabID].filelist[tabs[tabID].fileID]);
	});
	ipcMain.on("recylefile", (e, arg) => {
		alert(arg);
	});
	
	ipcMain.on("messagebox", (event,arg) => {
		event.returnValue = dialog.showMessageBoxSync(BrowserWindow.fromWebContents(event.sender),arg)
	})

	ipcMain.on("closeTab", (e, arg) => {
		delete tabs[arg];
	});
	ipcMain.on("saveFile", (e,arg) => {
		dialog
			.showSaveDialog(this.app_window, {
				properties: ["createDirectory"],
				filters: [{name:"*.*",extensions:"*.*"}]
			})
			.then((res) => {
				if (!res.canceled) {
					fs.writeFile(res.filePath, arg, 'base64', function (err) {
						console.log(err);
					});
					settingsdata.recentlySaved.push(res.filePath);
					saveSettings();
					app_window.webContents.send("settingsdata", settingsdata);
				}
			})
	})
	
	ipcMain.on('showimagecontext', (event) => {
		try {
			const template = [
				{
					label: getFileName(tabs[tabID].filelist[tabs[tabID].fileID]),
					enabled: false
				},
				{type: "separator"},
				{
					label: langdata.imageInfo,
					click: () => { event.sender.send("imageinfo", "") }
				},
				{
					label: langdata.copyImage,
					click: function () {
						app_window.webContents.send("copyimage", "");
					}
				},
				{
					label: langdata.editImage,
					click: function () {
						app_window.webContents.send("editIMG", true);
					}
				},
				{
					label: settingsdata.favorites.includes(tabs[tabID].filelist[tabs[tabID].fileID]) ? langdata.removeFromFavorites : langdata.addToFavorites,
					click: function () {
						app_window.webContents.send("addToFavorites","");
					}
				},
				{
					label: langdata.fileList,
					click: function () {
						app_window.webContents.send("showfilelist", "");
					}
				}
			]
			const menu = Menu.buildFromTemplate(template)
			menu.popup(BrowserWindow.fromWebContents(event.sender))
		}catch (e) {console.error(e)}
	})
	function typedArrayToBuffer(array) {
		return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
	}
	function getFileExtension(pathorfilename) {
		if (pathorfilename.includes(".")) { //Check if file name has a "."
			var pt = pathorfilename.split(".");
			return pt[pt.length - 1]
		}else {
			return "???" //No implementation for file names doesnt have "."
		}
	}
	function openFil(path) {
		try {
			if (path != undefined) {
				tabs[tabID].currentFile = path
				console.log(path)
				var isuri = path.includes("://");
				var stats = {}
				if (!isuri) {
					stats = fs.statSync(path);
				}
				//console.log(pathlib.extname(path).toLowerCase());
				var dimensions = { width: 0, height: 0 };
				if (!isuri) {
					var sizeOf = require('image-size');
					try {
						dimensions = sizeOf(path);
					} catch {
					}
				}
				var extension
				if (isuri) {
					extension = pathlib.extname(path).toLowerCase();
				}else {
					extension = getFileExtension(path).toLowerCase();
				}
				var exif = {}
				fileData = null;
				try {
					if (extension == "svg") {
						//if file is svg, send file data to renderer to read birdy-image-info etc.
						fileData = fs.readFileSync(path,"utf-8");
						
					}
				}catch (e) {
					console.error(e);
				}
				try {
					if ((!isuri) && (extension == "jpg" || extension == "jpeg" || extension == "jpe" || extension == "jfif")) {
						var filedata = fs.readFileSync(path);
						var parser = require('exif-parser').create(typedArrayToBuffer(filedata)); //typedArrayToBuffer(filedata)
						parser.enableBinaryFields(true);
						parser.enableTagNames(true);
						parser.enableReturnTags(true);
						val = parser.parse()
						exif = val.tags;
						delete val
					}
				}catch (e) {
					console.error(e);
				}
				if (extension == "tif" || extension == "tiff") {
					var filedata = fs.readFileSync(path);
					app_window.webContents.send("filedata", {
						path: path,
						size: dimensions,
						stats: stats,
						useDURL: true,
						DURL: filedata,
						fileID: tabs[tabID].fileID,
						exif:exif
					});
				} else {
					app_window.webContents.send("filedata", {
						path: path,
						size: dimensions,
						stats: stats,
						useDURL: false,
						fileID: tabs[tabID].fileID,
						exif:exif,
						filedata:fileData
					});
				}
				delete exif;
				if (!isuri) {
					var dirpath = pathlib.dirname(path);
					if (tabs[tabID].oldDirPath != dirpath) {
						tabs[tabID].filelist = [];
						tabs[tabID].filesizes = [];
						fs.readdir(dirpath, (err, files) => {
							console.log("Loading Folder! - Found " + files.length + " files in directory.")
							if (settingsdata["reversedFileListOrder"]) {
								files = files.reverse();
							}
							tabs[tabID].filesInDIR = files;
							tabs[tabID].isFirstFolderLoad = true
							updateFileID(dirpath,path);
							app_window.webContents.send("filelist", {
								fileID: tabs[tabID].fileID,
								list: tabs[tabID].filelist,
								filesizes: tabs[tabID].filesizes
							});
						});
						tabs[tabID].oldDirPath = dirpath;
					}else {
						updateFileID(dirpath,path);
						app_window.webContents.send("filelist", {
							fileID: tabs[tabID].fileID,
							list: tabs[tabID].filelist,
							filesizes: tabs[tabID].filesizes
						});
					}
				}
				delete fileData
				delete stats;
			}
		}catch (e) {
			console.error(e);
			dialog.showErrorBox("Error!", e.toString())
		}
	}
	global.isFirstFolderLoad = true
	function updateFileID(dirpath,path) {
		var cid = 0;
		//tabs[tabID].filelist = []
		//tabs[tabID].filesizes = []
		for (let i = 0; i < tabs[tabID].filesInDIR.length; i++) { 
			var file = tabs[tabID].filesInDIR[i];
		//tabs[tabID].filesInDIR.forEach((file) => {
			if (allowedext.includes(pathlib.extname(file).toLowerCase())) {
				//console.log(pathlib.resolve(pathlib.dirname(path), file));
				var pathresolve = pathlib.resolve(dirpath, file);
				if (tabs[tabID].isFirstFolderLoad) {
					tabs[tabID].filelist.push(pathresolve);
					tabs[tabID].filesizes.push(getFilesizeInBytes(pathresolve));
					console.log("Added " + pathresolve + " to list.")
				}
				if (pathresolve == path) {
					tabs[tabID].fileID = cid;
					console.log("Found " + pathresolve + " changed file ID to " + cid + "!")
				}else {
					console.log("Found " + pathresolve + " it's not at same path.")
				}
				cid++;
			}
		//});
		}
		tabs[tabID].isFirstFolderLoad = false
	}

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) bulidapp();
	})
	app.on('window-all-closed', () => {
		if (process.platform == 'darwin') {
		}else if (workInBackground) {
		}else {
			app.quit()
		}
	})

	function getFilesizeInBytes(filename) {
		var stats = fs.statSync(filename);
		var fileSizeInBytes = stats.size;
		return fileSizeInBytes;
	}

	function getStartCommand() {
		switch (process.platform) {
			case 'darwin': return 'open';
			case 'win32': return 'start ""';
			case 'win64': return 'start ""';
			default: return 'xdg-open';
		}
	}
	function getFileName(path) {
		var pathR = path.replace(/\\/g, "/");
		var pt = pathR.split("/");
		return pt[pt.length - 1]
	}
	
	function capture(screenid) {
		//const winBounds = app_window.getBounds();
		//const whichScreen = screen.getDisplayNearestPoint({x: winBounds.x, y: winBounds.y});
		var scree = screen.getAllDisplays()[screenid]
		console.log(scree.size)
		desktopCapturer.getSources({ types: ['screen'],thumbnailSize: scree.size })
			.then( sources => {
				var arg = sources[screenid].thumbnail.toPNG()
				dialog
					.showSaveDialog({
						properties: ["createDirectory"],
						filters: [{name:langdata["typeImage"].replace("{TYPE}", "PNG"),extensions:["png"]}]
					})
					.then((res) => {
						if (!res.canceled) {
							fs.writeFile(res.filePath, arg, 'base64', function (err) {
								console.log(err);
							});
							settingsdata.recentlySaved.push(res.filePath);
							saveSettings();
							app_window.webContents.send("settingsdata", settingsdata);
						}
					})
				delete sources;
			})
	}
	
	function bulidMAmenu() {
		var atflabel
		try {
			atflabel = settingsdata.favorites.includes(tabs[tabID].filelist[tabs[tabID].fileID]) ? langdata.removeFromFavorites : langdata.addToFavorites
		}catch {
			atflabel = langdata.addToFavorites;
		}
		global.menu_list = [
			{
				label: langdata.file,
				submenu: [
					{
						label: langdata.open,
						click: function () {
							dialog
								.showOpenDialog(this.app_window, {
									properties: ["openFile"],
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
						click: function () {
							app_window.webContents.send("imageinfo", "");
						}
					},
					{
						label: langdata.fileList,
						accelerator: 'CmdOrCtrl+L',
						click: function () {
							app_window.webContents.send("showfilelist", "");
						}
					},
					{
						label: langdata.galleryView,
						accelerator: 'CmdOrCtrl+G',
						click: function () {
							app_window.webContents.send("showGalleryViewFullScreen", "");
						}
					},
					{
						label: langdata.startSlideshow,
						accelerator: 'CmdOrCtrl+H',
						click: function () {
							app_window.webContents.send("slideshow", "");
						}
					},
					{ type: "separator" },
					{
						label: langdata.screenshot,
						accelerator: 'CmdOrCtrl+U',
						click: function () {
							var btns = []
							Array.prototype.forEach.call(screen.getAllDisplays(),function(item,id) {
								btns.push((id + 1).toString() + " (" + item.size.width.toString() + "x" + item.size.height.toString() + ") " + item.id)
							})
							dialog.showMessageBox({message: langdata.screenshotps,title: langdata.screenshot, type: "question", buttons:btns}).then((res) => {
								dialog.showMessageBox({message: langdata.screenshotMessage, title: langdata.screenshot}).then(() => {
									setTimeout(function() {
										capture(res.response)
									},5000)
								})
							})
						}
					},
					{ type: "separator" },
					{
						label: langdata.copyImage,
						accelerator: 'CmdOrCtrl+C',
						click: function () {
							app_window.webContents.send("copyimage", "");
						}
					},
					{
						label: langdata.editImage,
						accelerator: 'CmdOrCtrl+E',
						click: function () {
							app_window.webContents.send("editIMG", true);
						}
					},
					{
						label: atflabel,
						accelerator: "CmdOrCtrl+Shift+F",
						click: function () {
							app_window.webContents.send("addToFavorites","");
						}
					},
					{ type: "separator" },
					{
						label: langdata.reload,
						accelerator: "F5",
						click: function () {
							app_window.webContents.send("reloadimage","");
						}
					},
					{
						label: langdata.deleteFile,
						accelerator: 'Shift+Delete',
						click: function () {
							deleteCurrentFile(tabs[tabID].currentFile)
						}
					},
					{ type: "separator" },
					{
						label: langdata.birdyImgExtensions,
						accelerator: 'CmdOrCtrl+Shift+E',
						click: viewExtensions
					},
					{
						label: langdata.settings,
						accelerator: 'CmdOrCtrl+S',
						click: function () {
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
						click: function () {
							tabs[tabID].fileID -= 1
							if (tabs[tabID].fileID < 0) {
								tabs[tabID].fileID = 0;
							}
							openFil(tabs[tabID].filelist[tabs[tabID].fileID]);
						}
					},
					{
						label: langdata.nextImage,
						click: function () {
							tabs[tabID].fileID += 1
							if (tabs[tabID].fileID < 0) {
								tabs[tabID].fileID = 0;
							}
							openFil(tabs[tabID].filelist[tabs[tabID].fileID]);
						}
					},
					{ type: 'separator' },
					{
						label: langdata.rotateLeft,
						click: function () {
							app_window.webContents.send("rotateleft", "");
						}
					},
					{
						label: langdata.rotateRight,
						click: function () {
							app_window.webContents.send("rotateright", "");
						}
					},
					{ type: 'separator' },
					{
						label: langdata.zoomIn,
						accelerator: 'CmdOrCtrl+numadd',
						click: function () {
							app_window.webContents.send("zoomin", "");
						}
					},
					{
						label: langdata.zoomOut,
						accelerator: 'CmdOrCtrl+numsub',
						click: function () {
							app_window.webContents.send("zoomout", "");
						}
					},
					{ type: 'separator' },
					{
						label: langdata.centerImage,
						click: function () {
							app_window.webContents.send("centerimg", "");
						}
					},
					{
						label: langdata.showFullImage,
						click: function () {
							app_window.webContents.send("fullimg", "");
						}
					},
					{
						label: langdata.showRealImageSize,
						click: function () {
							app_window.webContents.send("dsimg", "");
						}
					},
					{ type: "separator" },
					{ role: 'togglefullscreen', label: langdata.fullscreen }
				]
			}
		];
		if (settingsdata.enableTabs == true) {
			menu_list.push({
				label: langdata.tabs,
				submenu: [
					{
						label: langdata.newTab,
						click: function () { app_window.webContents.send("createnewtab", "") }
					},{
						label: langdata.closeCurrentTab,
						click: function () { app_window.webContents.send("closecurrenttab", "") }
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
		} catch { }
		global.editorMenu_list = [
			{
				label: langdata.file,
				submenu: [
					{
						label: langdata.export,
						accelerator: 'CmdOrCtrl+S',
						click: function () {
							app_window.webContents.send("exportImg", "");
						}
					},
					{
						label: langdata.undo,
						accelerator: 'CmdOrCtrl+Z',
						click: function () {
							app_window.webContents.send("undoEditor", "");
						}
					},
					{ type: 'separator' },
					{
						label: langdata.exitEditor,
						accelerator: 'Shift+ESC',
						click: function () {
							app_window.webContents.send("exitEditorA", "");
						}
					}
				]
			},
			{
				label: langdata.view,
				submenu: [
					{
						label: langdata.zoomIn,
						accelerator: 'CmdOrCtrl+numadd',
						click: function () {
							app_window.webContents.send("ezoomin", "");
						}
					},
					{
						label: langdata.zoomOut,
						accelerator: 'CmdOrCtrl+numsub',
						click: function () {
							app_window.webContents.send("ezoomout", "");
						}
					},
					{ type: 'separator' },
					{ role: 'togglefullscreen', label: langdata.fullscreen }
				]
			}
		];
		eventfires.menuBulid.forEach((func) => func())
		console.log("generating menu from list")
		global.editormenu_design = Menu.buildFromTemplate(editorMenu_list);
		global.menu_design = Menu.buildFromTemplate(menu_list);
		Menu.setApplicationMenu(menu_design);
		console.log("done generating menu from list")
	}
	const viewExtensions = function() {
		var extensionsWin = new BrowserWindow({
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false
			},
			icon: "resources/asset/bitmap/appico.png",
			title: langdata.birdyImgExtensions,
			backgroundColor: nativeTheme.shouldUseDarkColors ? '#000000' : '#FFFFFF',
			width:420,
			height:720
		});
		extensionsWin.setMenu(null);
		extensionsWin.loadFile("resources/asset/extensions.html");
		extensionsWin.webContents.on('dom-ready', function () {
			extensionsWin.webContents.send("langpack", langdata);extensionsWin.webContents.send("exfPath",os.homedir() + "/BirdyImg/extensions.data");extensionsWin.webContents.send("extensions",extensions);
		})
		//extensionsWin.openDevTools();
	}
}