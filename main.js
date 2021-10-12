const electron = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const services = require('./utils/services');
const nodeMachineId = require('node-machine-id');
const _ = require('underscore');

// SET ENV
process.env.NODE_ENV = 'development';

const {app, BrowserWindow, Menu, ipcMain, Notification, screen, shell, dialog, globalShortcut} = electron;

let mainWindow;
let addFileWindow;
let searchFileWindow;
let searchFileTableWindow;
let addUserWindow;
let settingWindow;
let userManagementWindow;
let addHostNameWindow;
let addFilingHostNameWindow;
let filePrintWindow;
let contactListWindow;
let addContactWindow;
let screenWidth = 0;
let screenHeight = 0;
let deviceId = undefined;
let file = undefined;
let user = undefined;
let fileList = [];
let fileValidationArray = [];

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

    globalShortcut.register('Alt+CommandOrControl+I', () => {
        createAddFilingHostNameWindow();
    });

    screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
    screenHeight = screen.getPrimaryDisplay().workAreaSize.height;
    // Create new window
    mainWindow = new BrowserWindow({
        resizable: false,
        width: 1024,
        height: 768,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    mainWindow.webContents.on('crashed', () => {
        mainWindow.reload();
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
    const mainMenu = Menu.buildFromTemplate([]);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);

    //Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));
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
        }).catch((error) => {
            mainWindow.webContents.send('hideLoading');
            const notification = {
                title: 'خطا',
                body: 'خطا در ثبت نام آژانس.'
            };
            new Notification(notification).show()
        })

    }).catch((error) => {
        mainWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در ثبت نام آژانس.'
        };
        new Notification(notification).show()
    });
});

// logout callback
ipcMain.on('logout', function (e, requestBody) {
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'loginWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

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

// editUser callback
ipcMain.on('editUser', function (e, requestBody) {
    addUserWindow.webContents.send('showLoading');

    services.editUser(requestBody).then(() => {
        addUserWindow.close();
        const notification = {
            title: 'موفقیت',
            body: 'کاربر با موفقیت اصلاح شد.'
        };
        new Notification(notification).show()
    }).catch(() => {
        addUserWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در اصلاح کاربر.'
        };
        new Notification(notification).show()
    })

});

// setFile callback
ipcMain.on('setFile', async function (e, requestArray) {
    const Store = require('electron-store');
    const store = new Store();
    if (store.get('userData').insertFile) {
        addFileWindow.webContents.send('showLoading');
        let fileId = '';
        services.getFileTotalCount().then(async (response) => {
            fileId = 'cl-' + (10000 + parseInt(response.data));
            for (var i in requestArray) {
                requestArray[i].Id = fileId.split("-")[0] + "-" + parseInt(parseInt(fileId.split("-")[1]) + parseInt(i));
                requestArray[i].Number = parseInt(parseInt(fileId.split("-")[1]) + parseInt(i));
                var result = await services.insertFile(requestArray[i]);
                if (parseInt(i) === (requestArray.length - 1)) {
                    addFileWindow.reload();
                    const notification = {
                        title: 'موفقیت',
                        body: 'فایل با موفقیت ذخیره شد.'
                    };
                    new Notification(notification).show()
                }
            }
        }).catch(() => {
            const notification = {
                title: 'خطا',
                body: 'خطا در دریافت کد فایل.'
            };
            new Notification(notification).show()
        })
    } else {
        const notification = {
            title: 'خطا',
            body: 'دسترسی برای ایجاد فایل وجود ندارد.'
        };
        new Notification(notification).show()
    }

});

// showFileValidationError callback
ipcMain.on('showFileValidationError', async function (e, validationArray) {
    fileValidationArray = validationArray;
    fileValidationWindow = new BrowserWindow({
        parent: addFileWindow,
        modal: true,
        width:300, height:400,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    fileValidationWindow.loadFile('fileValidationModal.html');
});

// showFileValidationError callback
ipcMain.on('closeFileValidationModal', async function (e) {
    fileValidationWindow.close();
});

// getFileValidation callback
ipcMain.on('getFileValidation', async function (e) {
    fileValidationWindow.webContents.send('showFileValidation', fileValidationArray);
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

// setFileTableHeader callback
ipcMain.on('setFileTableHeader', function (e, headerTitleList) {
    const Store = require('electron-store');
    const store = new Store();
    store.set('showFilesTitle', headerTitleList);
    const notification = {
        title: 'موفقیت',
        body: 'چیدمان جدول نمایش فایل با موفقیت تغییر کرد.'
    };
    new Notification(notification).show()
});

// login callback
ipcMain.on('loginData', function (e, loginDataObject, isInstallationSystem) {
    mainWindow.webContents.send('showLoading');
    if (isInstallationSystem) {
        services.loginFiling(loginDataObject).then((response) => {
            services.setAndResetSession(response.headers['set-cookie']);
            services.getConfigs().then((response) => {
                if (response.data && response.data[0] && response.data[0].realStateName) {
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
            }).catch((error) => {
                mainWindow.webContents.send('hideLoading');
                const notification = {
                    title: 'خطا',
                    body: 'خطا در دریافت کانفیگ های برنامه.'
                };
                new Notification(notification).show()
            })
        }).catch(error => {
            mainWindow.webContents.send('hideLoading');
            const notification = {
                title: 'خطا',
                body: 'خطا در ورود کاربر.'
            };
            new Notification(notification).show()
        })
    } else {
        services.login(loginDataObject).then((responseData) => {
            const Store = require('electron-store');
            const store = new Store();
            store.set('userData', responseData.data);
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
// ipcMain.on('setFile', async function (e, requestArray) {
//     addFileWindow.webContents.send('showLoading');
//     for (var i in requestArray) {
//         requestArray[i].Id = requestArray[i].Id.split("-")[0] + "-" + parseInt(parseInt(requestArray[i].Id.split("-")[1]) + parseInt(i));
//         var result = await services.insertFile(requestArray[i]);
//         if (parseInt(i) === (requestArray.length - 1)) {
//             addFileWindow.close();
//             const notification = {
//                 title: 'موفقیت',
//                 body: 'فایل با موفقیت ذخیره شد.'
//             };
//             new Notification(notification).show()
//         }
//     }
//
// });

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
    createSearchFileTableWindow();

});

// searchFile callback
ipcMain.on('getFileList', function (e, requestBody) {
    const Store = require('electron-store');
    const store = new Store();
    var request = store.get('fileSearchBody');
    request.offset = requestBody.offset.toString();
    request.length = requestBody.length.toString();
    searchFileTableWindow.webContents.send('showLoading');

    services.searchFile(request).then((response) => {
        fileList = response.data.data;
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

// showZonkanFiles callback
ipcMain.on('showZonkanFiles', function (e, fileList, zoonkanName) {
    let files = {};
    files['data'] = fileList;
    files['totalCount'] = fileList.length;

    zonkanFileTableWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
        width: screenWidth,
        height: screenHeight,
        title: 'نمایش فایل ها'
    });
    zonkanFileTableWindow.loadFile('zonkanFileTableWindow.html');

    zonkanFileTableWindow.webContents.on("did-finish-load", function () {
        zonkanFileTableWindow.webContents.send('getFileListFromMain', files, zoonkanName);
    });
});

// getUserList callback
ipcMain.on('getUserList', function (e, requestBody) {
    userManagementWindow.webContents.send('showLoading');
    services.getUserList(requestBody).then((response) => {
        userManagementWindow.webContents.send('hideLoading');
        userManagementWindow.webContents.send('getUserListFromMain', response.data);
    }).catch(() => {
        userManagementWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در نمایش کاربران های املاک.'
        };
        new Notification(notification).show()
    })

});

// getUserFilterList callback
ipcMain.on('getUserFilterList', function (e, requestBody) {
    userManagementWindow.webContents.send('showLoading');
    services.getUserList(requestBody).then((response) => {
        userManagementWindow.webContents.send('hideLoading');
        userManagementWindow.webContents.send('getUserListFromMain', response.data);
    }).catch(() => {
        userManagementWindow.webContents.send('hideLoading');
        const notification = {
            title: 'خطا',
            body: 'خطا در نمایش کاربران های املاک.'
        };
        new Notification(notification).show()
    })

});

// deleteUser callback
ipcMain.on('deleteUser', function (e, username) {
    let options  = {
        buttons: ["بله","خیر"],
        message: "آیا از حذف کاربر اطمینان دارید؟"
    };
    dialog.showMessageBox(userManagementWindow, options).then(result => {
        if (result.response === 0) {
            userManagementWindow.webContents.send('showLoading');
            services.deleteUser({username}).then((response) => {
                userManagementWindow.webContents.send('hideLoading');
                userManagementWindow && userManagementWindow.reload();
            }).catch(() => {
                userManagementWindow.webContents.send('hideLoading');
                const notification = {
                    title: 'خطا',
                    body: 'خطا در حذف کاربر.'
                };
                new Notification(notification).show()
            })
        }
    }).catch(err => {
        console.log(err)
    })

});

// editUser callback
ipcMain.on('userEdit', function (e, editUser) {
    user = editUser;
    userManagementWindow.close();
    createAddUserWindow();
});

// getEditUser callback
ipcMain.on('getEditUser', function (e) {
    let editUser = user;
    user = undefined;
    addUserWindow.webContents.send('sendUserFromMain', editUser);
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

// showError callback
ipcMain.on('showError', function (e, errorMessage) {
    const notification = {
        title: 'خطا',
        body: errorMessage
    };
    new Notification(notification).show()
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

// getPrevFile callback
ipcMain.on('getPrevFile', function (e, currentFile) {
    let index = findWithAttr(fileList, 'Id', currentFile.Id);
    if (index > 0) {
        services.searchFile({Id: fileList[index - 1].Id}).then((response) => {
            if (!_.isEmpty(response.data)) {
                file = response.data[0];
                addFileWindow.close();
                createAddFileWindow();
            }
        }).catch((error) => {
        })
    } else {
        const notification = {
            title: 'خطا',
            body: 'فایلی قبل از فایل جاری موجود نیست.'
        };
        new Notification(notification).show()
    }
});

// getNextFile callback
ipcMain.on('getNextFile', function (e, currentFile) {
    let index = findWithAttr(fileList, 'Id', currentFile.Id);
    if (index < fileList.length - 1) {
        services.searchFile({Id: fileList[index + 1].Id}).then((response) => {
            if (!_.isEmpty(response.data)) {
                file = response.data[0];
                addFileWindow.close();
                createAddFileWindow();
            }
        }).catch((error) => {
        })
    } else {
        const notification = {
            title: 'خطا',
            body: 'فایلی بعد  از فایل جاری موجود نیست.'
        };
        new Notification(notification).show()
    }
});

function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

// getEditFile callback
ipcMain.on('getEditFile', function (e) {
    let editFile = file;
    file = undefined;
    addFileWindow.webContents.send('sendFileFromMain', editFile);
});

// getEditFile callback
ipcMain.on('editFile', async function (e, request) {
    const Store = require('electron-store');
    const store = new Store();
    if (store.get('userData').editFile) {
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
    } else {
        const notification = {
            title: 'خطا',
            body: 'دسترسی برای اصلاح فایل وجود ندارد.'
        };
        new Notification(notification).show()
    }
});

// addToContactList callback
ipcMain.on('addToContactList', async function (e, contact) {
    const Store = require('electron-store');
    const store = new Store();
    var contactList = !_.isEmpty(store.get('contactList')) ? store.get('contactList') : [];
    contactList.push(contact);
    store.set('contactList', contactList);
    if (!_.isEmpty(contactListWindow)) {
        contactListWindow.reload();
        const notification = {
            body: 'اطلاعات با موفقیت ذخیره شد.'
        };
        new Notification(notification).show()
    }
});

// contactDeleted callback
ipcMain.on('contactDeleted', async function (e, contact) {
    if (!_.isEmpty(contactListWindow)) {
        contactListWindow.reload();
        const notification = {
            body: 'مخاطب پاک شد.'
        };
        new Notification(notification).show()
    }
});

// changeHostName callback
ipcMain.on('changeHostName', async function (e, serverAddress) {
    const Store = require('electron-store');
    const store = new Store();
    store.set('serverAddress', serverAddress);
    addHostNameWindow.close();
});

// changeFilingHostName callback
ipcMain.on('changeFilingHostName', async function (e, address) {
    const Store = require('electron-store');
    const store = new Store();
    store.set('filingServerAddress', address.filingServerAddress);
    store.set('installationServerAddress', address.installationServerAddress);
    addFilingHostNameWindow.close();
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
    if (!fs.existsSync(path.join(__dirname, './assets'))){
        fs.mkdirSync(path.join(__dirname, './assets'));
    }
    let filepath = path.join(__dirname, './assets/print.pdf');

    let options = {
        marginsType: 0,
        pageSize: 'A5',
        printBackground: true,
        printSelectionOnly: false,
        landscape: true
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

// get print file callback
ipcMain.on('zonkanFiles', async function (e, fileList) {
    chooseZonkanWindow = new BrowserWindow({
        parent: searchFileTableWindow,
        modal: true,
        width:300, height:200,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    chooseZonkanWindow.loadFile('chooseZonkanWindow.html');

    chooseZonkanWindow.webContents.on("did-finish-load", function () {
        chooseZonkanWindow.webContents.send('sendZonkanFilesFromMain', fileList);
    })
});

// get print file callback
ipcMain.on('contactInfo', async function (e, contactInfo) {
    contactInfoWindow = new BrowserWindow({
        parent: contactListWindow,
        modal: true,
        width:800, height:200,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    contactInfoWindow.loadFile('contactInfoWindow.html');

    contactInfoWindow.webContents.on("did-finish-load", function () {
        contactInfoWindow.webContents.send('sendContactInfoFromMain', contactInfo);
    })
});

// create add file window
function createAddFileWindow() {
    addFileWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
        resizable: false,
        width: 1024,
        height: 740,
        title: 'ثبت فایل'
    });
    addFileWindow.webContents.on('crashed', () => {
        addFileWindow.destroy();
        createAddFileWindow();
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
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
        resizable: false,
        width: 1024,
        height: 768,
        title: 'جستجو فایل'
    });
    searchFileWindow.webContents.on('crashed', () => {
        searchFileWindow.destroy();
        createSearchFileWindow();
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
function createSearchFileTableWindow() {
    searchFileTableWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
        width: screenWidth,
        height: screenHeight,
        title: 'نمایش فایل ها'
    });
    searchFileTableWindow.webContents.on('crashed', () => {
        searchFileTableWindow.destroy();
        createSearchFileTableWindow();
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
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        width: screenWidth,
        height: screenHeight,
        title: 'ثبت کاربر'
    });
    addUserWindow.webContents.on('crashed', () => {
        addUserWindow.destroy();
        createAddUserWindow();
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
function createContactListWindow() {
    contactListWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        resizable: false,
        width: 1024,
        height: 768,
        title: 'لیست مخاطبین'
    });
    contactListWindow.webContents.on('crashed', () => {
        contactListWindow.destroy();
        createContactListWindow();
    });
    contactListWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'contactWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    contactListWindow.on('close', function () {
        contactListWindow = null;
    });
}

// create add user window
function createAddContactWindow() {
    addContactWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 800,
        height: 600,
        title: 'افزودن مخاطب'
    });
    addContactWindow.webContents.on('crashed', () => {
        addContactWindow.destroy();
        createAddContactWindow();
    });
    addContactWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addContactWindow/addContactWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    addContactWindow.on('close', function () {
        addContactWindow = null;
    });
}

// create add user window
function createSettingWindow() {
    settingWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 600,
        height: 500,
        title: 'تنظیمات'
    });
    settingWindow.webContents.on('crashed', () => {
        settingWindow.destroy();
        createSettingWindow();
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

// create add user window
function createZoncanWindow() {
    zoncanWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 800,
        height: 600,
        title: 'زونکن'
    });
    zoncanWindow.webContents.on('crashed', () => {
        zoncanWindow.destroy();
        createZoncanWindow();
    });
    zoncanWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'zonkanWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    zoncanWindow.on('close', function () {
        zoncanWindow = null;
    });
}

// create search user window
function createUserManagementWindow() {
    userManagementWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        width: screenWidth,
        height: screenHeight,
        title: 'لیست کاربران'
    });
    userManagementWindow.webContents.on('crashed', () => {
        userManagementWindow.destroy();
        createUserManagementWindow();
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
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        resizable: false,
        width: 833,
        // height: 420,
        title: 'فایل'
    });
    filePrintWindow.webContents.on('crashed', () => {
        filePrintWindow.destroy();
        createFilePrintWindow();
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

// create print file window
function createAddHostWindow() {
    addHostNameWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 500,
        height: 400,
        title: 'افزودن سرویس جدید'
    });
    addHostNameWindow.webContents.on('crashed', () => {
        addHostNameWindow.destroy();
        createAddHostWindow();
    });
    addHostNameWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addHostNameWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    addHostNameWindow.on('close', function () {
        addHostNameWindow = null;
    });
}

// create print file window
function createAddFilingHostNameWindow() {
    addFilingHostNameWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 500,
        height: 400,
        title: 'افزودن سرویس جدید'
    });
    addFilingHostNameWindow.webContents.on('crashed', () => {
        addFilingHostNameWindow.destroy();
        createAddFilingHostNameWindow();
    });
    addFilingHostNameWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addFilingHostNameWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Handle garbage collection
    addFilingHostNameWindow.on('close', function () {
        addFilingHostNameWindow = null;
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

//add user menu press
ipcMain.on('addUser', function (e) {
    const Store = require('electron-store');
    const store = new Store();
    if (store.get('userData').userRole === 'مدیر سیستم') {
        createAddUserWindow();
    } else {
        const notification = {
            title: 'خطا',
            body: 'دسترسی وجود ندارد.'
        };
        new Notification(notification).show()
    }
});

//add user menu press
ipcMain.on('contactList', function (e) {
    createContactListWindow();
});

//add user menu press
ipcMain.on('addContact', function (e) {
    createAddContactWindow();
});

//setting menu press
ipcMain.on('setting', function (e) {
    createSettingWindow();
});

//zoncan menu press
ipcMain.on('zoncan', function (e) {
    createZoncanWindow();
});

//search user menu press
ipcMain.on('searchUser', function (e) {
    const Store = require('electron-store');
    const store = new Store();
    if (store.get('userData').userRole === 'مدیر سیستم') {
        createUserManagementWindow();
    } else {
        const notification = {
            title: 'خطا',
            body: 'دسترسی وجود ندارد.'
        };
        new Notification(notification).show()
    }
});

//addService
ipcMain.on('addHostName', function (e) {
    createAddHostWindow();
});

// Create menu template
/*const mainMenuTemplate = [{
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
}*/
