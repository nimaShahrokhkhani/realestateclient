const electron = require('electron');
const axios = require('axios');
let HOST_NAME = 'http://localhost:3500/';
let FILING_HOST_NAME = 'http://localhost:3600/';
let INSTALLATION_HOST_NAME = 'http://localhost:3650/';
const Store = require('electron-store');
const store = new Store();

const filingInstance = axios.create({
    baseURL: FILING_HOST_NAME
});

const installationInstance = axios.create({
    baseURL: INSTALLATION_HOST_NAME
});

const instance = axios.create({
    baseURL: HOST_NAME
});

function setAndResetSession(cookieList) {
    for(let i in cookieList) {
        if(cookieList[i].includes('connect.sid=')) {
            store.set('session', cookieList[i].split(';')[0]);
        }
    }
}

function loginFiling(requestData) {
    filingInstance.defaults.headers.post['Content-Type'] = 'application/json';
    return filingInstance.post(`/login`, {
        username: requestData.username,
        password: requestData.password,
    })
}

function login(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    return instance.post(`/login`, {
        username: requestData.username,
        password: requestData.password,
    })
}

function getUserList(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.get(`/users/list`, {
        params: requestData
    })
}

function insertUser(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.post(`/users/insert`, requestData)
}

function insertFile(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.post(`/files/insert`, requestData)
}

function insertFromFiling(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.post(`/files/insertFromFiling`, requestData)
}

function editFile(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.post(`/files/edit`, requestData)
}

function searchFile(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.get(`/files/list`, {
        params: requestData
    })
}

function getFileTotalCount(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.get(`/files/totalCount`, requestData)
}

function getConfigs(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.get(`/configs/list`, requestData)
}

function getFilingConfigs(requestData) {
    filingInstance.defaults.headers.post['Content-Type'] = 'application/json';
    filingInstance.defaults.headers['Cookie'] = store.get('session');
    return filingInstance.get(`/clientConfig/list`, requestData)
}

function installDevice(requestData) {
    installationInstance.defaults.headers.post['Content-Type'] = 'application/json';
    return installationInstance.post(`/devices/activeDevice`, requestData)
}

function getDevices(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.get(`/devices/list`, requestData)
}

function insertDevice(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.post(`/devices/insert`, requestData)
}

function insertConfig(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers['Cookie'] = store.get('session');
    return instance.post(`/configs/insert`, requestData)
}

function registerAgency(requestData) {
    filingInstance.defaults.headers.post['Content-Type'] = 'application/json';
    filingInstance.defaults.headers['Cookie'] = store.get('session');
    return filingInstance.post(`/agency/registerAgency`, requestData)
}

function getFileFromFilling(requestData) {
    filingInstance.defaults.headers.post['Content-Type'] = 'application/json';
    filingInstance.defaults.headers['Cookie'] = store.get('session');
    return filingInstance.post(`/clientFiles/getClientFileList`, requestData)
}

module.exports = {
    loginFiling,
    login,
    insertUser,
    insertFile,
    insertFromFiling,
    installDevice,
    getDevices,
    insertDevice,
    searchFile,
    getFilingConfigs,
    getConfigs,
    insertConfig,
    setAndResetSession,
    registerAgency,
    getFileTotalCount,
    editFile,
    getUserList,
    getFileFromFilling
};
