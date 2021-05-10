const electron = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const services = require('./utils/services');
const nodeMachineId = require('node-machine-id');
const _ = require('underscore');

// SET ENV
process.env.NODE_ENV = 'development';

const {app, BrowserWindow, Menu, ipcMain, Notification, screen, shell} = electron;

let mainWindow;
let addFileWindow;
let searchFileWindow;
let searchFileTableWindow;
let addUserWindow;
let settingWindow;
let userManagementWindow;
let filePrintWindow;
let screenWidth = 0;
let screenHeight = 0;
let deviceId = undefined;
let file = undefined;
let fileList = [];

// Listen for app to be ready
app.on('ready', function () {
    nodeMachineId.machineId().then((id) => {
        const Store = require('electron-store');
        const store = new Store();
        store.set('myDevice', id);
        deviceId = id;
        var requestData = {
            deviceId: id
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

    Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
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
                services.getDevices().then((response) => {
                    const Store = require('electron-store');
                    const store = new Store();
                    store.set('devices', response.data);
                    mainWindow.webContents.send('hideLoading');
                    const notification = {
                        title: 'موفقیت',
                        body: 'دستگاه با موفقیت فعال شد.'
                    };
                    new Notification(notification).show();
                    mainWindow.reload();
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
    }).catch(() => {
        mainWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا فعالسازی دستگاه.'
        };
        new Notification(notification).show()
    })
});

// registerDevice callback
ipcMain.on('registerFilingDevice', function (e, realStateCode, realStateTemporaryCode) {
    mainWindow.webContents.send('showLoading');
    const Store = require('electron-store');
    const store = new Store();
    var deviceId = store.get('myDevice');
    var requestData = {
        agencyCode: realStateCode,
        registrationCode: realStateTemporaryCode
    };
    services.registerAgency(requestData).then(response => {
        store.set('realStateCode', realStateCode);
        store.set('realStateTemporaryCode', realStateTemporaryCode);
        mainWindow.webContents.send('hideLoading');
        const notification = {
            title: 'موفقیت',
            body: 'دستگاه شما با موفقیت در سامانه رجیستر شد.'
        };
        new Notification(notification).show()
    }).catch(error => {
        mainWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در رجیستر کردن.'
        };
        new Notification(notification).show()
    })
});

// getFileFromFilling callback
ipcMain.on('getFileFromFilling', function (e, request) {
    settingWindow.webContents.send('showLoading');
    services.getFileFromFilling(request).then(async response => {
        let requestArray = response.data;
        for (var i in requestArray) {
            requestArray[i].Id = requestArray[i].Id.split("-")[0] + "-" + parseInt(parseInt(requestArray[i].Id.split("-")[1]) + parseInt(i));
            var result = await services.insertFromFiling(requestArray[i]);
            if (parseInt(i) === (requestArray.length - 1)) {
                settingWindow.webContents.send('hideLoading');
                const notification = {
                    title: 'موفقیت',
                    body: 'فایل با موفقیت ذخیره شد.'
                };
                new Notification(notification).show()
            }
        }
    }).catch(error => {
        settingWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در رجیستر کردن.'
        };
        new Notification(notification).show()
    })
});

// getConfigsFromFilling callback
ipcMain.on('getConfigsFromFilling', function (e) {
    settingWindow.webContents.send('showLoading');
    services.getFilingConfigs().then((response) => {
        const Store = require('electron-store');
        const store = new Store();
        store.set('configList', response.data);
        services.insertConfig(response.data).then(() => {
            settingWindow.webContents.send('hideLoading');
            const notification = {
                title: 'موفقیت',
                body: 'فایل با موفقیت ذخیره شد.'
            };
            new Notification(notification).show()
        }).catch(() => {
            settingWindow.webContents.send('hideLoading');
            const notification = {
                title: 'خطا',
                body: 'خطا در دریافت کانفیگ های برنامه.'
            };
            new Notification(notification).show()
        });
    }).catch(() => {
        settingWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در دریافت کانفیگ های برنامه.'
        };
        new Notification(notification).show()
    })
});

// setPublisher callback
ipcMain.on('setPublisher', function (e, publisher) {
    const Store = require('electron-store');
    const store = new Store();
    store.set('publisher', publisher);
    const notification = {
        title: 'موفقیت',
        body: 'تنظیم کننده با موفقیت تغییر کرد.'
    };
    new Notification(notification).show()
});

// login callback
ipcMain.on('loginData', function (e, loginDataObject, isInstallationSystem) {
    mainWindow.webContents.send('showLoading');
    if (isInstallationSystem) {
        services.loginFiling(loginDataObject).then((response) => {
            services.setAndResetSession(response.headers['set-cookie']);
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
        services.login(loginDataObject).then((responseData) => {
            const Store = require('electron-store');
            const store = new Store();
            store.set('userData', loginDataObject);
            services.setAndResetSession(responseData.headers['set-cookie']);
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
ipcMain.on('setFile', async function (e, requestArray) {
    addFileWindow.webContents.send('showLoading');
    for (var i in requestArray) {
        requestArray[i].Id = requestArray[i].Id.split("-")[0] + "-" + parseInt(parseInt(requestArray[i].Id.split("-")[1]) + parseInt(i));
        var result = await services.insertFile(requestArray[i]);
        if (parseInt(i) === (requestArray.length - 1)) {
            addFileWindow.close();
            const notification = {
                title: 'موفقیت',
                body: 'فایل با موفقیت ذخیره شد.'
            };
            new Notification(notification).show()
        }
    }

});

// searchFile callback
ipcMain.on('listFile', function (e, requestBody) {
    // searchFileWindow.webContents.send('showLoading');
    //
    // services.searchFile(requestBody).then((response) => {
    //     searchFileWindow.close();
    //     createSearchFileTableWindow(response.data);
    // }).catch(() => {
    //     searchFileWindow.webContents.send('hideLoading');
    //     const notification = {
    //         title: 'خطا',
    //         body: 'خطا در جستجو فایل.'
    //     };
    //     new Notification(notification).show()
    // })
    const Store = require('electron-store');
    const store = new Store();
    store.set('fileSearchBody', requestBody);
    searchFileWindow.close();
    createSearchFileTableWindow();

});

// searchFile callback
ipcMain.on('getFileList', function (e, requestBody) {
    const Store = require('electron-store');
    const store = new Store();
    var request = store.get('fileSearchBody');
    request.offset = requestBody.offset;
    request.length = requestBody.length;
    searchFileTableWindow.webContents.send('showLoading');

    services.searchFile(request).then((response) => {
        fileList = response.data;
        searchFileTableWindow.webContents.send('hideLoading');
        searchFileTableWindow.webContents.send('getFileListFromMain', response.data);
    }).catch(() => {
        searchFileTableWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در جستجو فایل.'
        };
        new Notification(notification).show()
    })

});

// getUserList callback
ipcMain.on('getUserList', function (e, requestBody) {
    services.getUserList(requestBody).then((response) => {
        userManagementWindow.webContents.send('getUserListFromMain', response.data);
    }).catch(() => {
        const notification = {
            title: 'خطا',
            body: 'خطا در نمایش کاربران های املاک.'
        };
        new Notification(notification).show()
    })

});

// getFilesTotalCountFromMain callback
ipcMain.on('getFileTotalCount', function (e) {
    services.getFileTotalCount().then((response) => {
        addFileWindow.webContents.send('getFilesTotalCountFromMain', response.data);
    }).catch(() => {
        const notification = {
            title: 'خطا',
            body: 'خطا در دریافت کد فایل.'
        };
        new Notification(notification).show()
    })

});

// searchFileOnTelephoneNumber callback
ipcMain.on('searchFileOnTelephoneNumber', function (e, request) {
    if (_.isEmpty(searchFileTableWindow)) {
        services.searchFile(request).then((response) => {
            if (!_.isEmpty(response.data)) {
                const Store = require('electron-store');
                const store = new Store();
                store.set('fileSearchBody', request);
                createSearchFileTableWindow();
            }
        }).catch((error) => {
        })
    }
});

// getFileForEditing callback
ipcMain.on('getFileForEditing', function (e, id) {
    if (_.isEmpty(addFileWindow)) {
        services.searchFile({Id: id}).then((response) => {
            if (!_.isEmpty(response.data)) {
                file = response.data[0];
                createAddFileWindow();
            }
        }).catch((error) => {
        })
    }
});

// getEditFile callback
ipcMain.on('getEditFile', function (e) {
    let editFile = file;
    file = undefined;
    addFileWindow.webContents.send('sendFileFromMain', editFile);
});

// getEditFile callback
ipcMain.on('editFile', async function (e, request) {
    addFileWindow.webContents.send('showLoading');
    services.editFile(request).then(() => {
        addFileWindow.close();
        const notification = {
            title: 'موفقیت',
            body: 'فایل با موفقیت اصلاح شد.'
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

// open print file callback
ipcMain.on('openPrintFile', async function (e, printFile) {
    file = printFile;
    createFilePrintWindow();
});

// get print file callback
ipcMain.on('getPrintFile', async function (e, request) {
    let printFile = file;
    file = undefined;
    filePrintWindow.webContents.send('sendPrintFileFromMain', printFile);
});

// get print file callback
ipcMain.on('printFile', async function (e) {
// Importing BrowserWindow from Main
    let filepath = path.join(__dirname, './assets/print.pdf');

    let options = {
        marginsType: 0,
        pageSize: 'A5',
        printBackground: true,
        printSelectionOnly: false,
        landscape: false
    };

    filePrintWindow.webContents.printToPDF(options).then(data => {
        fs.writeFile(filepath, data, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('PDF Generated Successfully');
                shell.openPath(filepath);
            }
        });
    }).catch(error => {
        console.log(error)
    });
});

// addNewUserFromManagementPanel callback
ipcMain.on('addNewUserFromManagementPanel', function (e, requestBody) {
    createAddUserWindow();
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

// create add user window
function createSettingWindow() {
    settingWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 600,
        height: 500,
        title: 'تنظیمات'
    });
    settingWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'settingWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    settingWindow.on('close', function () {
        settingWindow = null;
    });
}

// create search user window
function createUserManagementWindow() {
    userManagementWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        width: screenWidth,
        height: screenHeight,
        title: 'لیست کاربران'
    });
    userManagementWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'userManagementWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    userManagementWindow.on('close', function () {
        userManagementWindow = null;
    });
}

// create print file window
function createFilePrintWindow() {
    filePrintWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 600,
        height: 550,
        title: 'فایل'
    });
    filePrintWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'filePrintWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    filePrintWindow.on('close', function () {
        filePrintWindow = null;
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

//setting menu press
ipcMain.on('setting', function (e) {
    createSettingWindow();
});

//search user menu press
ipcMain.on('searchUser', function (e) {
    createUserManagementWindow();
});

// Create menu template
const mainMenuTemplate = [{
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
