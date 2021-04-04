const electron = require('electron');
const axios = require('axios');
let HOST_NAME = 'http://localhost:3500/';
let FILING_HOST_NAME = 'http://localhost:3600/';
let INSTALLATION_HOST_NAME = 'http://localhost:3650/';

const filingInstance = axios.create({
    baseURL: FILING_HOST_NAME
});

const installationInstance = axios.create({
    baseURL: INSTALLATION_HOST_NAME
});

const instance = axios.create({
    baseURL: HOST_NAME
});

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

function insertUser(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    return instance.post(`/users/insert`, requestData)
}

function insertFile(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    return instance.post(`/files/insert`, requestData)
}

function searchFile(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    return instance.get(`/files/list`, requestData)
}

function getConfigs(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    return instance.get(`/configs/list`, requestData)
}

function getFilingConfigs(requestData) {
    filingInstance.defaults.headers.post['Content-Type'] = 'application/json';
    return filingInstance.get(`/configs/list`, requestData)
}

function installDevice(requestData) {
    installationInstance.defaults.headers.post['Content-Type'] = 'application/json';
    return installationInstance.post(`/devices/activeDevice`, requestData)
}

function getDevices(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    return instance.get(`/devices/list`, requestData)
}

function insertDevice(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    return instance.post(`/devices/insert`, requestData)
}

function insertConfig(requestData) {
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    return instance.post(`/configs/insert`, requestData)
}

module.exports = {loginFiling, login, insertUser, insertFile, installDevice, getDevices, insertDevice, searchFile, getFilingConfigs, getConfigs, insertConfig};
