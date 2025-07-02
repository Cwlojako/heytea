import axios from '../axios'
const Prefix = '/coupon'

export function findCoupon(params) {
    return axios.post(Prefix + '/findCoupon', params)
}

export function batchBindCoupon(params) {
    return axios.post(Prefix + '/batchBindCoupon', params)
}

export function exchangeCoupon(params) {
    return axios.post(Prefix + '/exchangeCoupon', params, { showToast: false, loading: true, noTimeout: true })
}