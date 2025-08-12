import axios from '../axios'
const Prefix = '/token'

export function getAccounts() {
    return axios.get(Prefix + '/getAllTokens')
}

export function setOrUpdateToken(params) {
    return axios.post(Prefix + '/setOrUpdateToken', params)
}

export function getTokens(params) {
    return axios.post(Prefix + '/getTokens', params)
}

export function deleteTokens(params) {
    return axios.post(Prefix + '/deleteTokens', params)
}

export function getNewToken(params) {
    return axios.post(Prefix + '/getNewToken', params)
}