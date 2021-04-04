const electron = require('electron');
const path = require('path');
const url = require('url');
const services = require('./utils/services');
const nodeMachineId = require('node-machine-id');

// SET ENV
process.env.NODE_ENV = 'development';

const {app, BrowserWindow, Menu, ipcMain, Notification, screen} = electron;

let mainWindow;
let addFileWindow;
let searchFileWindow;
let searchFileTableWindow;
let addUserWindow;
let screenWidth = 0;
let screenHeight = 0;

// Listen for app to be ready
app.on('ready', function () {
    nodeMachineId.machineId().then((id) => {
        console.log('iddddddd=>',id)
    })


    screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
    screenHeight = screen.getPrimaryDisplay().workAreaSize.height;
    // Create new window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
    });
    // Load html in window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'loginWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Quit app when closed
    mainWindow.on('closed', function () {
        app.quit();
    });

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);
});

// login callback
ipcMain.on('loginData', function (e, loginDataObject) {
    mainWindow.webContents.send('showLoading');
    services.login(loginDataObject).then(() => {
        const Store = require('electron-store');
        const store = new Store();
        store.set('userData', loginDataObject);
        services.getConfigs().then((response) => {
            store.set('configList', response.data);
            mainWindow.webContents.send('hideLoading');
            mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'mainWindow.html'),
                protocol: 'file:',
                slashes: true
            }));
        }).catch(() => {
            mainWindow.webContents.send('hideLoading');
            const notification = {
                title: 'خطا',
                body: 'خطا در دریافت کانفیگ های برنامه.'
            };
            new Notification(notification).show()
        })
    }).catch(() => {
        mainWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'نام کاربری یا رمز عبور نادرست است.'
        };
        new Notification(notification).show()
    })

});

// setUser callback
ipcMain.on('setUser', function (e, requestBody) {
    addUserWindow.webContents.send('showLoading');

    services.insertUser(requestBody).then(() => {
        addUserWindow.close();
        const notification = {
            title: 'موفقیت',
            body: 'کاربر با موفقیت ذخیره شد.'
        };
        new Notification(notification).show()
    }).catch(() => {
        addUserWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'نام کاربری یا رمز عبور نادرست است.'
        };
        new Notification(notification).show()
    })

});

// setFile callback
ipcMain.on('setFile', function (e, requestBody) {
    addFileWindow.webContents.send('showLoading');

    services.insertFile(requestBody).then(() => {
        addFileWindow.close();
        const notification = {
            title: 'موفقیت',
            body: 'فایل با موفقیت ذخیره شد.'
        };
        new Notification(notification).show()
    }).catch(() => {
        addFileWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در دخیره فایل.'
        };
        new Notification(notification).show()
    })

});

// searchFile callback
ipcMain.on('listFile', function (e, requestBody) {
    searchFileWindow.webContents.send('showLoading');

    services.searchFile(requestBody).then((response) => {
        searchFileWindow.close();
        createSearchFileTableWindow(response.data);
    }).catch(() => {
        searchFileWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در جستجو فایل.'
        };
        new Notification(notification).show()
    })

});

// showError callback
ipcMain.on('showError', function (e, errorMessage) {
        const notification = {
            title: 'خطا',
            body: errorMessage
        };
        new Notification(notification).show()
});

// create add file window
function createAddFileWindow(){
    addFileWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: screenWidth,
        height: screenHeight,
        title:'ثبت فایل'
    });
    addFileWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addFileWindow.html'),
        protocol: 'file:',
        slashes:true
    }));
    // Handle garbage collection
    addFileWindow.on('close', function(){
        addFileWindow = null;
    });
}

// create search file window
function createSearchFileWindow(){
    searchFileWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: screenWidth,
        height: screenHeight,
        title:'جستجو فایل'
    });
    searchFileWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'searchFileWindow.html'),
        protocol: 'file:',
        slashes:true
    }));
    // Handle garbage collection
    searchFileWindow.on('close', function(){
        searchFileWindow = null;
    });
}

// create search file table window
function createSearchFileTableWindow(responseData){
    const Store = require('electron-store');
    const store = new Store();
    store.set('searchFileList', responseData);
    searchFileTableWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: screenWidth,
        height: screenHeight,
        title:'نمایش فایل ها'
    });
    searchFileTableWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'searchFileTableWindow.html'),
        protocol: 'file:',
        slashes:true
    }));
    // Handle garbage collection
    searchFileTableWindow.on('close', function(){
        searchFileTableWindow = null;
    });
}

// create add user window
function createAddUserWindow(){
    addUserWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        width: screenWidth,
        height: screenHeight,
        title:'ثبت کاربر'
    });
    addUserWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addUserWindow/addUserWindow.html'),
        protocol: 'file:',
        slashes:true
    }));
    // Handle garbage collection
    addUserWindow.on('close', function(){
        addUserWindow = null;
    });
}

//add file menu press
ipcMain.on('addFile', function (e) {
    createAddFileWindow();
});

//add file menu press
ipcMain.on('searchFile', function (e) {
    createSearchFileWindow();
});

//add file menu press
ipcMain.on('addUser', function (e) {
    createAddUserWindow();
});

// Create menu template
const mainMenuTemplate = [];

// If OSX, add empty object to menu
if (process.platform === 'darwin') {
    mainMenuTemplate.unshift({label: ''});
}

// Add developer tools option if in dev
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                role: 'reload'
            },
            {
                label: 'Toggle DevTools',
                accelerator: process.platform === 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            }
        ]
    });
}
