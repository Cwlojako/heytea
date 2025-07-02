import axios from '../axios'
const Prefix = '/order'

export function getOrders(params) {
    return axios.post(Prefix + '/getOrders', params)
}

export function orderDetail(u = '', phone = '') {
    return axios.get(Prefix + `/orderDetail?signal=${u}&phone=${phone}`)
}