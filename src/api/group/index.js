import axios from '../axios'
const Prefix = '/group'

export function addGroup(params) {
    return axios.post(Prefix + '/addGroup', params)
}

export function editGroup(params) {
    return axios.post(Prefix + '/editGroup', params)
}

export function getGroups() {
    return axios.get(Prefix + '/getGroups')
}