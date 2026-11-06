import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import api from '@/services/jjapi.js'

export const useCartStore = defineStore('cart', () => {
    const items = ref(JSON.parse(localStorage.getItem('cart')) || [])
    const cartItemIds = ref(JSON.parse(localStorage.getItem('cartItemIds')) || [])

    const total = computed(() =>
        items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
    )

    async function addItem(product) {
        const id = product.productsId || product.id
        console.log('購物車 Store: 開始加入商品', { id, product })
        
        const found = items.value.find(i => i.id === id)
        if (found) {
            found.quantity += 1
            console.log('購物車 Store: 商品已存在，數量+1', { id, newQuantity: found.quantity })
        } else {
            // 如果沒有提供圖片或圖片路徑無效，立即從 API 載入
            let imageUrl = product.image || ''
            console.log('購物車 Store: 檢查商品圖片', { originalImage: imageUrl })
            
            if (!imageUrl || imageUrl === '/ProductImages/default.jpg' || imageUrl === '/default.jpg') {
                console.log('購物車 Store: 圖片無效，從 API 載入...')
                imageUrl = await fetchMainImage(id)
                console.log('購物車 Store: API 載入圖片完成', { imageUrl })
            }
            
            const newItem = {
                id,
                name: product.name,
                price: product.price ?? 0,
                quantity: 1,
                image: imageUrl
            }
            
            items.value.push(newItem)
            console.log('購物車 Store: 新商品已加入', newItem)
            console.log('購物車 Store: 目前購物車內容', items.value)
        }
    }

    const increaseQty = (item) => {
        const found = items.value.find(i => i.id === item.id)
        if (found) found.quantity++
    }

    const decreaseQty = (item) => {
        const found = items.value.find(i => i.id === item.id)
        if (found && found.quantity > 1) found.quantity--
    }

    function setQty(item, newQty) {
        const found = items.value.find(i => i.id === item.id)
        if (found) found.quantity = newQty
    }

    const removeItem = (itemId) => {
        items.value = items.value.filter(i => i.id !== itemId)
    }

    const clearCart = () => {
        items.value = []
        cartItemIds.value = []
        localStorage.removeItem('cart')
        localStorage.removeItem('cartItemIds')
    }

    // 載入購物車商品主圖（呼叫此函式會逐一載入每個商品的主圖並更新 items 裡的 image）
    async function loadImagesForCartItems() {
        for (const item of items.value) {
            // 只為沒有圖片或使用預設圖片的商品載入圖片
            if (!item.image || item.image === '/ProductImages/default.jpg' || item.image === '/default.jpg') {
                console.log(`為商品 ${item.name} (ID: ${item.id}) 載入圖片...`)
                item.image = await fetchMainImage(item.id)
                console.log(`商品 ${item.name} 圖片載入完成: ${item.image}`)
            }
        }
    }

    async function fetchMainImage(productId) {
        try {
            const res = await api.get(`/ProductImages/byProduct/${productId}`)
            const images = res.data || []
            const mainImage = images.find(img => img.isMain === 1) || images[0]
            return mainImage?.imageUrl || '/ProductImages/default.jpg'
        } catch {
            return '/ProductImages/default.jpg'
        }
    }

    // 從後端 API 載入購物車資料（包含產品與數量）
    async function loadCartFromApi() {
        try {
            const res = await api.get('/ShoppingCartItems')
            if (Array.isArray(res.data)) {
                items.value = res.data.map(item => ({
                    id: item.productsId,
                    name: item.productName || '',
                    price: item.unitprice,
                    quantity: item.quantity,
                    image: item.image || ''
                }))
                setCartItemIds(res.data.map(i => i.itemId))
                localStorage.setItem('cart', JSON.stringify(items.value))
            }
        } catch (error) {
            console.error('載入購物車失敗', error)
        }
    }

    function setCartItemIds(ids) {
        cartItemIds.value = ids
        localStorage.setItem('cartItemIds', JSON.stringify(ids))
    }

    watch(items, (val) => {
        localStorage.setItem('cart', JSON.stringify(val))
    }, { deep: true })

    watch(cartItemIds, (val) => {
        localStorage.setItem('cartItemIds', JSON.stringify(val))
    }, { deep: true })

    return {
        items,
        total,
        addItem,
        increaseQty,
        decreaseQty,
        setQty,
        removeItem,
        clearCart,
        loadImagesForCartItems,   // 一定要放這裡，讓外部能調用
        loadCartFromApi,
        cartItemIds,
        setCartItemIds,
    }
})
