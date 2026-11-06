import axios from 'axios'



const API_URL = 'https://localhost:7017/api/Coupons'  // 修改成你的 API 網址

export const getCoupons = () => axios.get(API_URL)
export const getCouponById = (id) => axios.get(`${API_URL}/${id}`)
export const getCouponTypes = () => {
    return axios.get('/api/CouponTypes')
}
export const createCoupon = (coupon) => axios.post(API_URL, coupon)
export const updateCoupon = (id, coupon) => axios.put(`${API_URL}/${id}`, coupon)
export const deleteCoupon = (id) => axios.delete(`${API_URL}/${id}`)
