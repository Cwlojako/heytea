import axios from 'axios'
import { showLoadingToast, showToast } from 'vant'

let loadingToast = null
const instance = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL
})

instance.interceptors.request.use(config => {
    config.header = { ...config.header }
    if (!config.timeout && !config.noTimeout) {
        config.timeout = 10000
    }
    if (config.loading) {
        loadingToast = showLoadingToast({
            message: '加载中...',
            duration: 0,
            forbidClick: true,
            loadingType: 'spinner'
        })
    }
    return config
})

instance.interceptors.response.use(response => {
    if (response.config.loading) {
        loadingToast.close()
    }
    if ([200, 0].includes(response.data.code)) {
        return response.data ? response.data : response
    } else {
        if (response.config?.showToast ?? true) {
            showToast({
                message: response.data.message,
                type: 'fail',
                duration: 2000
            })
        }
        return Promise.reject(response)
    }
}, error => {
    if (error.config.loading) {
        loadingToast.close()
    }
    if (response.config?.showToast ?? true) {
        showToast({
            message: error?.response?.data?.message ?? '服务器错误',
            type: 'fail',
            duration: 2000
        })
    }
    return Promise.reject(error)
})

export default instance