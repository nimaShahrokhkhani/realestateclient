const electron = require('electron');
const axios = require('axios');
let HOST_NAME = 'http://localhost:3500/';

const instance = axios.create({
    baseURL: HOST_NAME
});

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

module.exports = {login, insertUser, insertFile, searchFile, getConfigs};
