import { createApp } from 'vue'
import App from './App.vue'
// 初始化 Live2D 全局变量
import '@/live2d-widget/globals'
import router from './router'
import './router/guard'
import '@/styles/index.scss'
import 'normalize.css/normalize.css'
import { createPinia } from 'pinia'
import { i18n } from './locales'
import VueClickAway from 'vue3-click-away'
import lazyPlugin from 'vue3-lazy'
import { registerSvgIcon } from '@/icons'
import { registerObSkeleton } from '@/components/LoadingSkeleton'
import 'prismjs/themes/prism.css'
import 'prismjs'
import 'element-plus/theme-chalk/index.css'
import { components, plugins } from './plugins/element-plus'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import infiniteScroll from 'vue3-infinite-scroll-better'
import v3ImgPreview from 'v3-img-preview'
import 'mavon-editor/dist/css/index.css'
import api from './api/api'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
export const app = createApp(App)
  .use(router)
  .use(pinia)
  .use(i18n)
  .use(VueClickAway)
  .use(infiniteScroll)
  .use(v3ImgPreview, {})
  .use(lazyPlugin, {
    loading: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    error: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80'
  })
const userStore = useUserStore()
axios.interceptors.request.use((config: any) => {
  config.headers['Authorization'] = 'Bearer ' + sessionStorage.getItem('token')
  return config
})
const proxy = app.config.globalProperties
axios.interceptors.response.use(
  (response) => {
    if (response.data.flag) {
      return response
    }
    switch (response.data.code) {
      case 50000: {
        proxy.$notify({
          title: 'Error',
          message: '系统异常',
          type: 'error'
        })
        break
      }
      case 40001: {
        proxy.$notify({
          title: 'Error',
          message: '用户未登录',
          type: 'error'
        })
        if (userStore.userInfo !== '') {
          userStore.userInfo = ''
          userStore.token = ''
          userStore.accessArticles = []
          sessionStorage.removeItem('token')
        }
        break
      }
      default: {
        proxy.$notify({
          title: 'Error',
          message: response.data.message,
          type: 'error'
        })
        break
      }
    }
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)
components.forEach((component) => {
  app.component(component.name, component)
})
plugins.forEach((plugin) => {
  app.use(plugin)
})
registerSvgIcon(app)
registerObSkeleton(app)
router.isReady().then(() => {
  app.mount('#app')
})
console.log('%c 网站作者:EienSakura', 'color:#bada55')
api.report()

// 可爱提示：当用户离开页面时随机切换标题，返回后恢复
const cuteAwayTitles = [
  '我在这里等你一起冒险呢~ (๑•̀ㅂ•́)و✧',
  '彩虹和极光都在呼唤你回来呀~ (っ•̀ω•́)っ',
  '别忘了给我分享新故事喔~ (≧▽≦)/',
  '出去太久我会闹小脾气的~ (｡ì _ í｡)',
  '快回来查看最新的冒险日志~ (つ✧ω✧)つ',
  '我偷偷为你准备了可爱彩蛋~ (づ￣ ³￣)づ',
  '前方还有星光之旅等你领航~ ☆ﾐ(o*･ω･)ﾉ',
  '回来给我一个虚拟拥抱好吗~ (╯✧▽✧)╯',
  '页面在你离开时都黯淡了~ (；´∀｀)',
  '欢迎归队，小队长~ (ง •̀_•́)ง'
]
let previousTitle = document.title
const pickRandomCuteTitle = () => {
  const index = Math.floor(Math.random() * cuteAwayTitles.length)
  return cuteAwayTitles[index]
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    previousTitle = document.title || previousTitle
    document.title = pickRandomCuteTitle()
  } else {
    document.title = previousTitle
  }
})
