import axios from '../axios'
const Prefix = '/link'

export function generateLink(params) {
    return axios.post(Prefix + '/generateLink', params)
}

export function generateLinksBatch(params) {
    return axios.post(Prefix + '/generateLinksBatch', params)
}

export function closeOrOpenLink(params) {
    return axios.post(Prefix + '/closeOrOpenLink', params)
}

export function batchDelLink(params) {
    return axios.post(Prefix + '/batchDelLink', params)
}

export function getLinks(params) {
    return axios.post(Prefix + '/getLinks', params)
}

export function refund(params) {
    return axios.post(Prefix + '/refund', params)
}

export function updatePrice(params) {
    return axios.post(Prefix + '/updatePrice', params)
}