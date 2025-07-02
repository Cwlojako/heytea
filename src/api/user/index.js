import axios from '../axios'
const Prefix = '/user'

export function login(params) {
    return axios.post(Prefix + '/login', params)
}

export function checkLogin() {
    return axios.get(Prefix + '/checkLogin')
}