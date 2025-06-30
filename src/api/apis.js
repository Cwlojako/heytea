import axios from './index'

export function findStore(params) {
    return axios.post('/findStore', params)
}

export function findGoods(params) {
    return axios.post('/findGoods', params)
}

export function goodsDetail(params) {
    return axios.post('/goodsDetail', params)
}

export function settle(params) {
    return axios.post('/settle', params)
}

export function orderDetail(u = '', phone = '') {
    return axios.get(`/orderDetail?signal=${u}&phone=${phone}`)
}

export function getExpectTime(id = '', no='', phone = '') {
    return axios.get(`/getExpectTime?orderId=${id}&orderNo=${no}&phone=${phone}`, { loading: true })
}

export function getAccounts() {
    return axios.get('/getAllTokens')
}

export function setOrUpdateToken(params) {
    return axios.post('/setOrUpdateToken', params)
}

export function generateLink(params) {
    return axios.post('/generateLink', params)
}

export function generateLinksBatch(params) {
    return axios.post('/generateLinksBatch', params)
}

export function closeOrOpenLink(params) {
    return axios.post('/closeOrOpenLink', params)
}

export function batchDelLink(params) {
    return axios.post('/batchDelLink', params)
}

export function getLinkDetails(uuid) {
    return axios.get(`/getLinkDetails?uuid=${uuid}`)
}

export function findCoupon(params) {
    return axios.post('/findCoupon', params)
}

export function batchBindCoupon(params) {
    return axios.post('/batchBindCoupon', params)
}

export function getLinks(params) {
    return axios.post('/getLinks', params)
}

export function getTokens(params) {
    return axios.post('/getTokens', params)
}

export function deleteTokens(params) {
    return axios.post('/deleteTokens', params)
}

export function getOrders(params) {
    return axios.post('/getOrders', params)
}

export function addGroup(params) {
    return axios.post('/addGroup', params)
}

export function editGroup(params) {
    return axios.post('/editGroup', params)
}

export function getGroups() {
    return axios.get('/getGroups')
}

export function refund(params) {
    return axios.post('/refund', params)
}

export function exchangeCoupon(params) {
    return axios.post('/exchangeCoupon', params, { showToast: false, loading: true, noTimeout: true })
}
