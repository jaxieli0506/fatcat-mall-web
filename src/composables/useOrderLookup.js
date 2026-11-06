import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useCheckoutStore } from '@/stores/checkout'

export function useOrderLookup() {
    const checkout = useCheckoutStore()
    const couponOptions = ref([])
    const shippingOptions = ref([])

    onMounted(async () => {
        try {
            const [couponRes, shippingRes] = await Promise.all([
                axios.get('https://localhost:7017/api/Coupons'),
                axios.get('https://localhost:7017/api/Shippings'),
            ])
            couponOptions.value = couponRes.data
            shippingOptions.value = shippingRes.data
        } catch (err) {
            console.error('❌ 無法載入優惠券與送貨方式資料:', err)
        }
    })

    const selectedCoupon = computed(() =>
        couponOptions.value.find(c => c.couponId === checkout.couponId)
    )

    const selectedShipping = computed(() =>
        shippingOptions.value.find(s => s.shippingId === checkout.shippingId)
    )

    return {
        selectedCoupon,
        selectedShipping
    }
}
