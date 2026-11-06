import axios from 'axios'

const BASE_URL = 'https://localhost:7017/api'

export const getOrders = () => axios.get(`${BASE_URL}/Orders`)
export const getOrderStatuses = () => axios.get(`${BASE_URL}/OrderStatus`)
export const getShippings = () => axios.get(`${BASE_URL}/Shippings`)
export const getShippingStatuses = () => axios.get(`${BASE_URL}/ShippingStatus`)

export const getOrderById = (id) => axios.get(`${BASE_URL}/Orders/${id}`)
export const createOrder = (order) => axios.post(`${BASE_URL}/Orders`, order)
export const updateOrder = (id, order) => axios.put(`${BASE_URL}/Orders/${id}`, order)
export const deleteOrder = (id) => axios.delete(`${BASE_URL}/Orders/${id}`)
