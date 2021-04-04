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
let deviceId = undefined;

// Listen for app to be ready
app.on('ready', function () {
    nodeMachineId.machineId().then((id) => {
        const Store = require('electron-store');
        const store = new Store();
        store.set('myDevice', id);
        deviceId = id;
        var requestData = {
            deviceId: id,
            isActiveDevice: false,
            isMasterDevice: false
        };
        services.insertDevice(requestData);
    });


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

    // Create the Application's main menu
    var template = [{
        label: "Application",
        submenu: [
            { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
        ]}, {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]}
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});

// setRealStateName callback
ipcMain.on('setRealStateName', function (e, dataObject) {
    mainWindow.webContents.send('showLoading');
    services.insertConfig(dataObject).then(() => {
        services.getDevices().then((response) => {
            const Store = require('electron-store');
            const store = new Store();
            store.set('devices', response.data);
            mainWindow.webContents.send('hideLoading');
            mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'managementPanel.html'),
                protocol: 'file:',
                slashes: true
            }));
        }).catch(() => {
            mainWindow.webContents.send('hideLoading');
            const notification = {
                title: 'خطا',
                body: 'خطا در ثبت نام آژانس.'
            };
            new Notification(notification).show()
        })

    }).catch(() => {
        mainWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در ثبت نام آژانس.'
        };
        new Notification(notification).show()
    });
});

// registerDevice callback
ipcMain.on('registerDevice', function (e, deviceId, activationCode) {
    mainWindow.webContents.send('showLoading');
    services.getConfigs().then((response) => {
        services.installDevice({
            deviceId: deviceId,
            deviceCode: activationCode,
            realStateName: response.data.realStateName
        }).then(() => {
            const Store = require('electron-store');
            const store = new Store();
            store.set('activationCode', activationCode);
            services.insertDevice({
                deviceId: deviceId,
                isActiveDevice: true
            }).then(() => {
                mainWindow.webContents.send('hideLoading');
                const notification = {
                    title: 'موفقیت',
                    body: 'دستگاه با موفقیت فعال شد.'
                };
                new Notification(notification).show()
            }).catch(() => {
                mainWindow.webContents.send('hideLoading');
                const notification = {
                    title: 'خطا',
                    body: 'خطا فعالسازی دستگاه.'
                };
                new Notification(notification).show()
            })
        }).catch(() => {
            mainWindow.webContents.send('hideLoading');
            const notification = {
                title: 'خطا',
                body: 'خطا فعالسازی دستگاه.'
            };
            new Notification(notification).show()
        })
    }).catch(() => {
        mainWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا فعالسازی دستگاه.'
        };
        new Notification(notification).show()
    })
});

// login callback
ipcMain.on('loginData', function (e, loginDataObject, isInstallationSystem) {
    mainWindow.webContents.send('showLoading');
    if (isInstallationSystem) {
        services.loginFiling(loginDataObject).then(() => {
            services.getFilingConfigs().then((response) => {
                const Store = require('electron-store');
                const store = new Store();
                store.set('configList', response.data);
                services.insertConfig(response.data).then(() => {
                    services.getConfigs().then((response) => {
                        if (response.data[0].realStateName) {
                            services.getDevices().then((response) => {
                                const Store = require('electron-store');
                                const store = new Store();
                                store.set('devices', response.data);
                                mainWindow.webContents.send('hideLoading');
                                mainWindow.loadURL(url.format({
                                    pathname: path.join(__dirname, 'managementPanel.html'),
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
                        } else {
                            mainWindow.webContents.send('hideLoading');
                            mainWindow.loadURL(url.format({
                                pathname: path.join(__dirname, 'realStateNameManagement.html'),
                                protocol: 'file:',
                                slashes: true
                            }));
                        }
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
                        body: 'خطا در دریافت کانفیگ های برنامه.'
                    };
                    new Notification(notification).show()
                });
            }).catch(() => {
                mainWindow.webContents.send('hideLoading');
                const notification = {
                    title: 'خطا',
                    body: 'خطا در دریافت کانفیگ های برنامه.'
                };
                new Notification(notification).show()
            })
        })
    } else {
        services.login(loginDataObject).then(() => {
            const Store = require('electron-store');
            const store = new Store();
            store.set('userData', loginDataObject);
            services.getConfigs().then((response) => {
                store.set('configList', response.data);
                services.insertConfig(response.data).then(() => {
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
                });
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
    }
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
function createAddFileWindow() {
    addFileWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: screenWidth,
        height: screenHeight,
        title: 'ثبت فایل'
    });
    addFileWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addFileWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    addFileWindow.on('close', function () {
        addFileWindow = null;
    });
}

// create search file window
function createSearchFileWindow() {
    searchFileWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: screenWidth,
        height: screenHeight,
        title: 'جستجو فایل'
    });
    searchFileWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'searchFileWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    searchFileWindow.on('close', function () {
        searchFileWindow = null;
    });
}

// create search file table window
function createSearchFileTableWindow(responseData) {
    const Store = require('electron-store');
    const store = new Store();
    store.set('searchFileList', responseData);
    searchFileTableWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: screenWidth,
        height: screenHeight,
        title: 'نمایش فایل ها'
    });
    searchFileTableWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'searchFileTableWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    searchFileTableWindow.on('close', function () {
        searchFileTableWindow = null;
    });
}

// create add user window
function createAddUserWindow() {
    addUserWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        width: screenWidth,
        height: screenHeight,
        title: 'ثبت کاربر'
    });
    addUserWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addUserWindow/addUserWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    addUserWindow.on('close', function () {
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
