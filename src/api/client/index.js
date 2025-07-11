import axios from '../axios'
const Prefix = '/client'

export function findStore(params) {
    return axios.post(Prefix + '/findStore', params)
}

export function findGoods(params) {
    return axios.post(Prefix + '/findGoods', params)
}

export function goodsDetail(params) {
    return axios.post(Prefix + '/goodsDetail', params)
}

export function settle(params) {
    return axios.post(Prefix + '/settle', params)
}

export function orderDetail(u = '', phone = '') {
    return axios.get(Prefix + `/orderDetail?signal=${u}&phone=${phone}`)
}

export function checkOrder(u) {
    return axios.get(Prefix + `/checkOrder?signal=${u}`)
}

export function getExpectTime(id = '', no='', phone = '') {
    return axios.get(Prefix + `/getExpectTime?orderId=${id}&orderNo=${no}&phone=${phone}`, { loading: true })
}

export function isLinkClosed(u) {
    return axios.get(Prefix + `/isLinkClosed?uuid=${u}`)
}

export function getLinkDetails(uuid) {
    return axios.get(Prefix + `/getLinkDetails?uuid=${uuid}`)
}