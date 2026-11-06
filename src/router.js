import { createRouter, createWebHistory } from "vue-router"
import HomeView from "./views/HomeView.vue"
import ProductlistView from "./views/ProductlistView.vue"
import CartView from "./views/CartView.vue"
import FavoriteView from "./views/FavoriteView.vue"
import UserView from "./views/UserView.vue"
import NotificationView from "./views/NotificationView.vue"
import ProductView from "./views/ProductView.vue"
import CampaignsView from '@/views/CampaignsView.vue'
import CheckoutView from "./views/CheckoutView.vue"
import CheckoutfinishView from "./views/CheckoutfinishView.vue"
import MyOrdersView from "./views/MyOrdersView.vue"
import OrderdetailView from "./views/OrderdetailView.vue"
import LoginView from "./views/LoginView.vue"
import NofundView from "./views/NofundView.vue"
import RegisterView from "./views/RegisterView.vue"
import FeedbackView from "./views/FeedbackView.vue"
import LineCallbackView from "./views/LineCallbackView.vue"

import ForgotPasswordView from "./views/ForgotPasswordView.vue"
import SpecialNoodleView from "./views/SpecialNoodleView.vue"
import OneSpecialNoodleView from "./views/OneSpecialNoodleView.vue"
import AdminChat from "./views/Admin/AdminChat.vue"
import CouponAddView from '@/views/Admin/CouponAddView.vue'
import CouponDetailView from '@/views/Admin/CouponDetailView.vue'
import OrderDetailView from "./views/Admin/OrderDetailView.vue"
import StreamViewer from "./views/StreamViewer.vue"
import DrinkView from "./views/DrinkView.vue"
import IntroView from "./views/IntroView.vue"

const routes = [
    //http://localhost:5173/ => http://localhost:5173/
    { path: "/", component: IntroView, name: "intro", meta: { hideHeaderFooter: true } },
    //首頁
    //http://localhost:5173/home
    { path: "/home", component: HomeView, name: "home" },
    //商品列表 --玥彤
    //http://localhost:5173/productlist
    { path: "/productlist", component: ProductlistView, name: "productlist" },
    // 
    //http://localhost:5173/Product
    { path: "/Product", component: ProductView, name: "product" },
    // 特別商品列表 
    //http://localhost:5173/Specialnoodle
    { path: "/Specialnoodle", component: SpecialNoodleView, name: "specialnoodle" },
    // 商品詳細頁面
    //http://localhost:5173/OneSpecialNoodle
    { path: "/OneSpecialNoodle", component: OneSpecialNoodleView, name: "onespecialnoodle" },
    //http://localhost:5173/Drink
    { path: "/Drink", component: DrinkView, name: "drink" },
    //購物車 --梓瑋
    //http://localhost:5173/cart
    { path: "/cart", component: CartView, name: "cart" },
    //我的最愛 --如謙
    //http://localhost:5180/favorite
    { path: "/favorite", component: FavoriteView, name: "favorite" },
    //會員中心 --佳馨
    //http://localhost:5173/user
    { path: "/user", component: UserView, name: "user" },
    //通知 --佳馨
    //http://localhost:5173/notification
    { path: "/notification", component: NotificationView, name: "notification" },
    //活動 --如謙
    //http://localhost:5180/campaigns
    { path: "/campaigns", component: CampaignsView, name: "campaigns" },
    //進度追蹤 --如謙
    //http://localhost:5180/feedback
    { path: "/feedback", component: FeedbackView, name: "feedback" },
    //直播 --如謙
    //http://localhost:5180/stream meta 標籤，告訴系統「這是管理頁面」。
    { path: "/stream", component: StreamViewer, name: "stream-viewer", meta: { isAdminPage: true } },
    //客服管理者 --如謙 ~ meta 標籤，告訴系統「這是管理頁面」。
    //http://localhost:5180/AdminChat
    { path: "/AdminChat", component: AdminChat, name: "AdminChat", meta: { isAdminPage: true } },
    //訂單結帳 -- 梓瑋
    //http://localhost:5173/checkout
    { path: "/checkout", component: CheckoutView, name: "checkout" },
    //完成結帳 -- 梓瑋
    //http://localhost:5173/checkoutfinish
    { path: "/checkoutfinish", component: CheckoutfinishView, name: "checkoutfinish" },
    //我的訂單 -- 梓瑋
    //http://localhost:5173/myorders
    { path: "/myorders", component: MyOrdersView, name: "myorders" },
    //訂單明細 -- 梓瑋
    //http://localhost:5173/orderdetail
    { path: "/orderdetail/:id", component: OrderdetailView, name: "OrderDetail" },
    //登入頁面
    {
        path: "/login", component: LoginView, name: "login", meta: {
            hideHeaderFooter: true, //讓登入頁面不要套用Header及Footer(方法寫在app.vue)
            isAdminPage: true, //rr新增隱藏客服
            title: ' Fat Cat 購物商城'
        }
    },
    //註冊頁面
    {
        path: "/register", component: RegisterView, name: "register", meta: {
            hideHeaderFooter: true, //讓註冊頁面不要套用Header及Footer
            isAdminPage: true, //rr新增隱藏客服
            title: ' Fat Cat 購物商城'
        }
    },
    //忘記密碼頁面
    {
        path: "/forgot-password", component: ForgotPasswordView, name: "forgot-password", meta: {
            hideHeaderFooter: true,
            isAdminPage: true, //rr新增隱藏客服
            title: ' Fat Cat 購物商城'
        }
    },
    //重設密碼頁面
    {
        path: "/reset-password", component: () => import('./views/ResetPasswordView.vue'), name: "reset-password", meta: {
            hideHeaderFooter: true,
            isAdminPage: true, //rr新增隱藏客服
            title: '重設密碼 - Fat Cat 購物商城'
        }
    },
    // LINE 登入回調頁面
    {
        path: "/line-callback", component: LineCallbackView, name: "line-callback", meta: {
            hideHeaderFooter: true,
            isAdminPage: true,
            title: 'LINE 登入處理中...'
        }
    },
    //===================================================================
    // --- rr 管理者後台路由區塊 ---//http://localhost:5180/admin/login
    //===================================================================
    {
        path: '/admin/login',
        name: 'AdminLogin',
        component: () => import('./views/Admin/AdminLogin.vue'),
        meta: { hideHeaderFooter: true, isAdminPage: true }
    },
    {
        path: '/admin',
        component: () => import('./views/Admin/AdminLayout.vue'),
        meta: { hideHeaderFooter: true, isAdminPage: true },
        beforeEnter: (to, from, next) => {
            if (localStorage.getItem('adminToken')) {
                next();
            } else {
                next('/admin/login');
            }
        },
        children: [
            { path: '', redirect: '/admin/dashboard' },
            { path: 'dashboard', name: 'AdminDashboard', component: () => import('./views/Admin/DashboardView.vue') },
            { path: 'members', name: 'AdminMembers', component: () => import('./views/Admin/AdminMemberView.vue') },
            { path: 'orders', name: 'AdminOrders', component: () => import('./views/Admin/AdminOrderView.vue') },
            { path: 'shipping', name: 'AdminShipping', component: () => import('./views/Admin/AdminShippingView.vue') },
            { path: 'productcreate', name: 'AdminProductCreate', component: () => import('./views/Admin/AdminProductCreateView.vue') },
            { path: 'products', name: 'AdminProducts', component: () => import('./views/Admin/AdminProductListView.vue') },
            { path: 'productedit/:id', name: 'AdminProductEdit', component: () => import('./views/Admin/AdminProductEditView.vue') },
            { path: 'coupons', name: 'AdminCoupons', component: () => import('./views/Admin/AdminCouponView.vue') },
            { path: 'customer-service', name: 'AdminCustomerService', component: () => import('./views/Admin/AdminCustomerServiceView.vue') },
            { path: 'complaints', name: 'AdminComplaints', component: () => import('./views/Admin/AdminComplaintView.vue') },
            { path: 'reviews', name: 'AdminReviews', component: () => import('./views/Admin/AdminReportView.vue') },
            { path: 'analysis', name: 'AdminAnalysis', component: () => import('./views/Admin/AdminAnalysisView.vue') },
            { path: 'store-setup', name: 'AdminStoreSetup', component: () => import('./views/Admin/AdminStoreSetupView.vue') },
            { path: 'settings', name: 'AdminSettings', component: () => import('./views/Admin/AdminSettingsView.vue') },
            { path: 'settings/deleted', name: 'AdminDeleted', component: () => import('./views/Admin/AdminDeletedView.vue') },
            { path: 'logs', name: 'AdminLogs', component: () => import('./views/Admin/AdminLogsView.vue') },
            { path: 'notifications', name: 'AdminNotifications', component: () => import('./views/Admin/AdminNotificationView.vue') },
            { path: 'stream', name: 'AdminStream', component: () => import('./views/Admin/AdminStreamView.vue') },
            { path: '/coupon-add', component: CouponAddView },
            { path: '/coupon-detail/:id', component: CouponDetailView, props: true },
            {
                path: '/admin/shippings/add',
                component: () => import('@/views/Admin/ShippingAddView.vue')
            },
            {
                path: '/admin/shippings/edit/:id',
                component: () => import('@/views/Admin/ShippingEditView.vue')
            },
            {
                path: '/admin/orderdetail/:id',
                name: 'AdminOrderDetail',
                component: () => import('@/views/Admin/OrderDetailView.vue')
            }



        ]
    },





















    //404頁面 !!一定要放在最下面!! 若要新增頁面請放上面↑↑
    // (.*)* 任意字元
    { path: "/:pathMatch(.*)*", component: NofundView, name: 'NotFund', meta: { hideHeaderFooter: true } }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // 如果有錨點，滾動到指定元素
        if (to.hash) {
            return new Promise((resolve) => {
                // 等待頁面渲染完成後再滾動
                setTimeout(() => {
                    const element = document.querySelector(to.hash);
                    if (element) {
                        resolve({
                            el: to.hash,
                            behavior: 'smooth'
                        });
                    } else {
                        resolve({ top: 0 });
                    }
                }, 300);
            });
        }
        // 如果有保存的位置（例如返回上一頁）
        if (savedPosition) {
            return savedPosition;
        }
        // 否則滾動到頂部
        return { top: 0 };
    }
});

router.afterEach((to, from) => {
    // 1. 優先檢查：這個頁面有沒有自己指定的標題？
    if (to.meta.title) {
        document.title = to.meta.title;
    }
    // 2. 如果沒有，再檢查是不是管理頁面
    else if (to.meta.isAdminPage) {
        document.title = '肥貓後台管理系統';
    }
    // 3. 如果以上都不是，就用預設的前台標題
    else {
        document.title = 'Fat Cat 購物商城';
    }
});


export default router