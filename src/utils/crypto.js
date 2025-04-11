import CryptoJS from 'crypto-js'

const secretKey = 'cwlojako'

export function encrypt(text) {
    return CryptoJS.AES.encrypt(text, secretKey).toString()
}

export function decrypt(text) {
    const bytes = CryptoJS.AES.decrypt(text, secretKey)
    return bytes.toString(CryptoJS.enc.Utf8)
}