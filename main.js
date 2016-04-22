'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const clipboard = require('electron').clipboard;
const ipcMain = require('electron').ipcMain;
//const ipc = require('electron').ipcRenderer;

const globalShortcut = electron.globalShortcut;
const dialog = require('electron').dialog;

const shell = require('electron').shell;

const fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, autoHideMenuBar:false});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Register shortcut listener.
  var data = [];
  const register_copy = globalShortcut.register('CommandOrControl+Shift+C', function() {
    data = setClipboard(data);
    onSetClipboard(data);
  });

  if (!register_copy) {
    console.log('registration failed');
  }

  const register_paste = globalShortcut.register('CommandOrControl+Shift+V', function() {
    getClipboard(data);
  });

  if (!register_paste) {
    console.log('registration failed');
  }

  ipcMain.on('onTrash', function(event, arg) {
    data = arg;
    onSetClipboard(arg);

  });

  const filePath = '.\\list.txt';

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    saveFile(data, filePath);
    
    console.log('mainWindow closed');
    mainWindow = null;
  });


  mainWindow.webContents.on('did-finish-load', function() {
    data = readFile(filePath);
    onSetClipboard(data);
  });
}

function setClipboard(data){
  
  //autohotkey로 작성한 exe파일 실행
  shell.openItem(".\\clipboard-copy.exe");

  //0.3초 sleep
  sleep(300);
  
  var readText = clipboard.readText();
  console.log('setClipboard : '+readText);

  var msg = ' \' is faild to save';

  //데이터가 없을때는 Array로 초기화 해줌 
  if(!Array.isArray(data)){
    data = [];
  }

  if(readText.length > 0){
    if(isExistInArray(data, readText)){
      msg = '\' is already saved';
    }else{
      data.push(readText);
      msg = '\' is saved';
    }
  } 
  
  dialog.showMessageBox({type:"info", buttons:["ok"], title:"Clipboard Stack", message: '\''+readText+msg});
  
  return data;
}

function onSetClipboard(data){
  mainWindow.webContents.send('onSetClipboard', data);
}

function getClipboard(data){
  dialog.showMessageBox({type:"none", buttons:data, title:"Clipboard Stack", message: "선택하세요"}, function(response){
    //console.log(response); //response는 index (0 ~ X)
    clipboard.writeText(data[response]);
    console.log('getClipboard : '+ data[response]);

    //autohotkey로 작성한 exe파일 실행
    shell.openItem(".\\clipboard-paste.exe");

  });
}



function saveFile(data, filePath){
  console.log('saveFile : '+ data.join('||'));

  fs.writeFileSync(filePath, data.join('||'),'utf-8', (err) => {
    if (err) throw err; //if error 
    console.log("sucessfully saved");
  });
}


function readFile(filePath){
    
   var readData = fs.readFileSync(filePath, 'utf8');
   console.log('readData.length : '+readData.length);
   if(readData.length > 0){
      return readData.split('||');
   }
}


function sleep(milliSeconds) {
  var startTime = new Date().getTime();
  while (new Date().getTime() < startTime + milliSeconds);
}

function isExistInArray(data, value){
  
  if(data.indexOf(value) > -1){
    return true;
  }else{
    return false;
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', function() {
  // Unregister a shortcut.
  //globalShortcut.unregister('CommandOrControl+Shift+C');

  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});
