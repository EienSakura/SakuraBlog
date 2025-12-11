<template>
  <div ref="live2dContainer" id="live2d-widget-container">
    <transition name="fade">
      <div v-if="fallbackActive" class="live2d-degrade-layer">
        <p>{{ fallbackMessage }}</p>
        <button class="live2d-degrade-action" type="button" @click="retryLoad">重新加载</button>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import axios from 'axios'
import { defineComponent, nextTick, onMounted, onUnmounted, ref, watch, type WatchStopHandle } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNavigatorStore } from '@/stores/navigator'
import {
  FAST_SCROLL_DISTANCE,
  FAST_SCROLL_WINDOW,
  HOME_STAY_THRESHOLD,
  IDLE_TIMEOUT,
  LIVE2D_ERROR_EVENT,
  LIVE2D_METRIC_EVENT,
  LIVE2D_PRESETS,
  LIVE2D_READY_EVENT,
  LIVE2D_ROUTE_EVENT,
  LIVE2D_SCENE_FALLBACK,
  LIVE2D_SESSION_KEYS,
  Live2dActionType,
  Live2dActivityConfig,
  Live2dHotArticle,
  Live2dSceneKey,
  Live2dTagSummary,
  resolveSceneFromRoute
} from '@/data/live2d-presets'

interface Live2dConfig {
  enableDynamicTips: boolean
  enableRouteHooks: boolean
  enableToolbarActions: boolean
  enableIdleWatcher: boolean
  enableDegradeGuard: boolean
  enableScrollWatcher: boolean
  preloadDelay: number
  interactionThreshold: number
  apiTTL: number
  nightStartHour: number
  nightEndHour: number
  apiBase?: string
}

interface SessionCache<T> {
  data: T
  timestamp: number
}

declare global {
  interface Window {
    initWidget?: (options: any) => void
    __AURORA_ENV__?: { live2d?: { apiBase?: string } }
    env?: { live2d?: { apiBase?: string } }
  }
}

const defaultConfig: Live2dConfig = {
  enableDynamicTips: true,
  enableRouteHooks: true,
  enableToolbarActions: true,
  enableIdleWatcher: true,
  enableDegradeGuard: true,
  enableScrollWatcher: true,
  preloadDelay: 3000,
  interactionThreshold: 3,
  apiTTL: 1800,
  nightStartHour: 21,
  nightEndHour: 6
}

interface Live2dToolbarAction {
  id: string
  label: string
  action: Live2dActionType
  icon: string
  tooltip?: string
}

const TOOLBAR_ICONS = {
  explore:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 2a8 8 0 018 8 7.9 7.9 0 01-1.37 4.45l-3.34-3.34a2 2 0 00-2.76-.07l-.09.07-3.34 3.34A8 8 0 0112 4zm0 5.5a1.5 1.5 0 11-1.5 1.5A1.5 1.5 0 0112 9.5z"/></svg>',
  toc:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 6h14a1 1 0 000-2H5a1 1 0 000 2zm0 7h14a1 1 0 000-2H5a1 1 0 000 2zm0 7h9a1 1 0 000-2H5a1 1 0 000 2z"/></svg>'
}

const TOOLBAR_ACTIONS: Live2dToolbarAction[] = [
  { id: 'waifu-tool-explore', label: '去看看', action: 'explore', icon: TOOLBAR_ICONS.explore, tooltip: '去首页' },
  { id: 'waifu-tool-toc', label: '目录', action: 'toc', icon: TOOLBAR_ICONS.toc, tooltip: '唤起导航浮窗' }
]

const LIVE2D_PATH = '/live2d-widget/'

export default defineComponent({
  name: 'Live2DWidget',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const navigatorStore = useNavigatorStore()

    const live2dContainer = ref<HTMLElement>()
    const config = ref<Live2dConfig>({ ...defaultConfig })
    const widgetLoaded = ref(false)
    const widgetLoading = ref(false)
    const fallbackActive = ref(false)
    const fallbackMessage = ref('Live2D 小助手正在休息，随时可以唤醒我～')
    const disabled = ref(sessionStorage.getItem(LIVE2D_SESSION_KEYS.disableFlag) === 'true')
    const interactionCount = ref(0)
    const currentScene = ref<Live2dSceneKey>(sessionStorage.getItem(LIVE2D_SESSION_KEYS.lastScene) as Live2dSceneKey || 'default')
    const hotArticles = ref<Live2dHotArticle[]>([])
    const randomTags = ref<Live2dTagSummary[]>([])
    const activities = ref<Live2dActivityConfig[]>([])
    const errorWindowStart = ref(0)
    const errorHits = ref(0)
    const progressNotified = ref(false)
    const nightNotified = ref(false)
    const dynamicContentOffline = ref(sessionStorage.getItem(LIVE2D_SESSION_KEYS.dynamicOffline) === 'true')

    let preloadTimer: number | undefined
    let idleTimer: number | undefined
    let homeStayTimer: number | undefined
    let tipHideTimer: number | undefined
    let idleRefreshHandle: number | undefined
    let earlyFallbackTimer: number | undefined
    const routeChangeHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail
      handleRouteEvent(detail)
    }

    const lastTipPriority = ref(0)
    const lastScrollY = ref(0)
    const lastScrollTs = ref(0)

    const envApiBase = ref(resolveEnvApiBase())
    let stopRouteWatch: WatchStopHandle | undefined

    const metric = (detail: Record<string, any>) => {
      window.dispatchEvent(new CustomEvent(LIVE2D_METRIC_EVENT, { detail }))
    }

    const emitReady = (loadTime: number) => {
      window.dispatchEvent(new CustomEvent(LIVE2D_READY_EVENT, { detail: { loadTime } }))
      metric({ type: 'load_success', loadTime })
    }

    const emitError = (error: Error | string) => {
      window.dispatchEvent(new CustomEvent(LIVE2D_ERROR_EVENT, { detail: { message: typeof error === 'string' ? error : error.message } }))
      metric({ type: 'load_error', message: typeof error === 'string' ? error : error.message })
    }

    const readSession = <T>(key: string): SessionCache<T> | null => {
      try {
        const raw = sessionStorage.getItem(key)
        return raw ? (JSON.parse(raw) as SessionCache<T>) : null
      } catch (error) {
        sessionStorage.removeItem(key)
        return null
      }
    }

    const writeSession = <T>(key: string, data: T) => {
      try {
        sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
      } catch (error) {
        console.warn('Live2D session cache 写入失败', error)
      }
    }

    const resolveApiBase = () => {
      return config.value.apiBase || envApiBase.value || ''
    }

    const resolveApiUrl = (path: string) => {
      const base = resolveApiBase()
      if (!base) return path
      return `${base.replace(/\/$/, '')}${path}`
    }

    const fetchWithCache = async <T>(key: string, url: string) => {
      const ttl = (config.value.apiTTL || defaultConfig.apiTTL) * 1000
      const cached = readSession<T>(key)
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data
      }
      const { data } = await axios.get(url)
      writeSession(key, data.data || data)
      return data.data || data
    }

    const markDynamicContentOffline = (reason?: string) => {
      if (dynamicContentOffline.value) return
      dynamicContentOffline.value = true
      sessionStorage.setItem(LIVE2D_SESSION_KEYS.dynamicOffline, 'true')
      console.warn('Live2D 动态内容降级，继续使用静态预设。', reason)
    }

    const hydrateDynamicContent = async () => {
      if (dynamicContentOffline.value) return
      try {
        const [hot, tags, activity] = await Promise.all([
          fetchWithCache<Live2dHotArticle[]>(LIVE2D_SESSION_KEYS.hotArticles, resolveApiUrl('/api/articles/hot?limit=5')),
          fetchWithCache<Live2dTagSummary[]>(LIVE2D_SESSION_KEYS.randomTags, resolveApiUrl('/api/tags/random?limit=5')),
          fetchWithCache<Live2dActivityConfig[]>(LIVE2D_SESSION_KEYS.activities, resolveApiUrl('/api/activities/live2d'))
        ])
        hotArticles.value = hot || []
        randomTags.value = tags || []
        activities.value = activity || []
        maybeShowActivityHighlight()
      } catch (error) {
        console.warn('Live2D 动态数据拉取失败', error)
        markDynamicContentOffline((error as Error)?.message)
      }
    }

    const requestIdleJob = (job: () => void, timeout = 3_000) => {
      if (typeof window.requestIdleCallback === 'function') {
        idleRefreshHandle = window.requestIdleCallback(job, { timeout })
      } else {
        idleRefreshHandle = window.setTimeout(job, timeout)
      }
    }

    const cancelIdleJob = () => {
      if (idleRefreshHandle) {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleRefreshHandle)
        } else {
          clearTimeout(idleRefreshHandle)
        }
        idleRefreshHandle = undefined
      }
    }

    const handleInteraction = () => {
      if (disabled.value) return
      interactionCount.value += 1
      resetIdleTimer()
      if (!widgetLoaded.value && !widgetLoading.value && interactionCount.value >= config.value.interactionThreshold) {
        triggerLoad()
      }
    }

    const handleScroll = () => {
      handleInteraction()
      if (!config.value.enableScrollWatcher) return
      const now = performance.now()
      const delta = Math.abs(window.scrollY - lastScrollY.value)
      if (delta > FAST_SCROLL_DISTANCE && now - lastScrollTs.value < FAST_SCROLL_WINDOW) {
        showTip('list', { tag: randomTags.value[0]?.name || '导航' }, 1)
      }
      lastScrollY.value = window.scrollY
      lastScrollTs.value = now

      if (currentScene.value === 'article') {
        const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        const progress = Math.min(1, (window.scrollY + window.innerHeight) / scrollMax)
        if (progress >= 0.7 && !progressNotified.value) {
          showTip('article', { progress: Math.round(progress * 100), articleTitle: document.title })
          progressNotified.value = true
        }
        if (progress < 0.4) {
          progressNotified.value = false
        }
      }
    }

    const resetIdleTimer = () => {
      if (!config.value.enableIdleWatcher) return
      if (idleTimer) window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        showTip('idle', { staySeconds: Math.round(IDLE_TIMEOUT / 1000) }, 0)
      }, IDLE_TIMEOUT)
    }

    const scheduleHomeStayTip = () => {
      if (homeStayTimer) window.clearTimeout(homeStayTimer)
      if (currentScene.value !== 'home') return
      homeStayTimer = window.setTimeout(() => {
        const hot = hotArticles.value[0]
        showTip('home', { articleTitle: hot?.title || document.title, staySeconds: Math.round(HOME_STAY_THRESHOLD / 1000) })
      }, HOME_STAY_THRESHOLD)
    }

    const maybeShowNightTip = () => {
      if (nightNotified.value) return
      const hour = new Date().getHours()
      const { nightStartHour, nightEndHour } = config.value
      const inNight = nightStartHour <= nightEndHour
        ? hour >= nightStartHour && hour < nightEndHour
        : hour >= nightStartHour || hour < nightEndHour
      if (inNight) {
        showTip('night', { timeLabel: `${hour}:00` }, 2)
        nightNotified.value = true
      }
    }

    const showTip = (scene: Live2dSceneKey, payload: Record<string, any> = {}, priority = 1, duration = 8000) => {
      if (!config.value.enableDynamicTips || !widgetLoaded.value) return
      const tips = LIVE2D_PRESETS[scene]
      if (!tips || !tips.length) {
        const fallbackScene = LIVE2D_SCENE_FALLBACK[scene]?.[0]
        if (fallbackScene) showTip(fallbackScene, payload, priority, duration)
        return
      }
      if (priority < lastTipPriority.value) return
      const { __tipId, ...displayPayload } = payload
      const tip = __tipId ? tips.find((item) => item.id === __tipId) || tips[0] : tips[Math.floor(Math.random() * tips.length)]
      const tipEl = document.getElementById('waifu-tips')
      if (!tipEl) return
      lastTipPriority.value = priority
      const text = tip.text.replace(/{{(\w+)}}/g, (_, key) => displayPayload[key] ?? displayPayload[key.toLowerCase()] ?? '')
      let ctaPayload: Record<string, any> | undefined
      if (tip.cta?.payload) {
        const clonedPayload: Record<string, any> = JSON.parse(JSON.stringify(tip.cta.payload))
        Object.keys(clonedPayload).forEach((ctaKey) => {
          const value = clonedPayload[ctaKey]
          if (typeof value === 'string') {
            clonedPayload[ctaKey] = value.replace(/{{(\w+)}}/g, (_, key) => displayPayload[key] ?? '')
          }
        })
        ctaPayload = clonedPayload
      }
      const actionHtml = tip.cta
        ? `<button class="live2d-tip-action" data-live2d-action="${tip.cta.action}" data-live2d-payload='${encodeURIComponent(JSON.stringify(ctaPayload || {}))}'>${tip.cta.label}</button>`
        : ''
      tipEl.innerHTML = `${text}${actionHtml}`
      tipEl.classList.add('waifu-tips-active')
      metric({ type: 'tip_show', scene, tipId: tip.id })
      if (tipHideTimer) window.clearTimeout(tipHideTimer)
      tipHideTimer = window.setTimeout(() => {
        tipEl.classList.remove('waifu-tips-active')
        tipEl.innerHTML = ''
        lastTipPriority.value = 0
      }, duration)
    }

    const tipActionHandler = (event: Event) => {
      const target = (event.target as HTMLElement).closest('[data-live2d-action]') as HTMLElement | null
      if (!target) return
      const action = target.getAttribute('data-live2d-action') as Live2dActionType
      const payloadRaw = target.getAttribute('data-live2d-payload')
      let payload: Record<string, any> | undefined
      if (payloadRaw) {
        try {
          payload = JSON.parse(decodeURIComponent(payloadRaw))
        } catch (error) {
          console.warn('Live2D CTA payload 解析失败', error)
        }
      }
      handleAction(action, payload)
    }

    const handleAction = (action: Live2dActionType, payload?: Record<string, any>) => {
      metric({ type: 'action', action, scene: currentScene.value })
      switch (action) {
        case 'explore':
          handleExploreAction()
          break
        case 'toc':
          navigatorStore.toggleOpenNavigator()
          break
        case 'navigate':
          if (payload?.route) {
            router.push(payload.route)
          } else if (payload?.url) {
            window.open(payload.url, '_blank', 'noopener')
          }
          break
        case 'scroll':
          if (payload?.selector) {
            const el = document.querySelector(payload.selector)
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          } else {
            window.scrollTo({ top: payload?.to ?? 0, behavior: 'smooth' })
          }
          break
        case 'share':
          shareCurrentArticle()
          break
        case 'favorite':
          favoriteCurrentArticle()
          break
        case 'dismiss':
        default:
          hideTipInstantly()
      }
    }

    const hideTipInstantly = () => {
      const tipEl = document.getElementById('waifu-tips')
      if (!tipEl) return
      tipEl.classList.remove('waifu-tips-active')
      tipEl.innerHTML = ''
      lastTipPriority.value = 0
    }

    const shareCurrentArticle = async () => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href)
        }
        showTip('default', { articleTitle: document.title }, 3, 4000)
      } catch (error) {
        console.warn('复制链接失败', error)
      }
    }

    const favoriteCurrentArticle = () => {
      try {
        const favorites = JSON.parse(localStorage.getItem('live2d.favorites') || '[]') as Array<{ url: string; title: string; ts: number }>
        favorites.unshift({ url: window.location.href, title: document.title, ts: Date.now() })
        localStorage.setItem('live2d.favorites', JSON.stringify(favorites.slice(0, 20)))
        showTip('default', { articleTitle: '收藏成功' }, 3, 3000)
      } catch (error) {
        console.warn('收藏失败', error)
      }
    }

    const handleExploreAction = () => {
      if (!hotArticles.value.length) {
        router.push('/')
        return
      }
      // const pick = hotArticles.value[Math.floor(Math.random() * hotArticles.value.length)]
      // router.push(`/articles/${pick.id}`)
    }

    const maybeShowActivityHighlight = () => {
      if (!widgetLoaded.value || !activities.value.length) return
      if (!['home', 'default'].includes(currentScene.value)) return
      const sorted = [...activities.value].sort((a, b) => (b.priority || 0) - (a.priority || 0))
      const activity = sorted.find((item) => item.title && item.url)
      if (!activity) return
      showTip('home', { activityTitle: activity.title, activityUrl: activity.url, __tipId: 'home-activity' }, 2)
    }

    const injectToolbarActions = () => {
      if (!config.value.enableToolbarActions) return
      const tool = document.getElementById('waifu-tool')
      if (!tool) return
      TOOLBAR_ACTIONS.forEach((item) => {
        if (document.getElementById(item.id)) return
        const button = document.createElement('button')
        button.id = item.id
        button.type = 'button'
        button.className = 'waifu-tool-item live2d-tool-extra'
        button.setAttribute('data-live2d-action', item.action)
        button.setAttribute('title', item.tooltip || item.label)
        button.innerHTML = item.icon
        button.addEventListener('click', (event) => {
          event.stopPropagation()
          handleAction(item.action)
        })
        tool.appendChild(button)
      })
    }

    const ensureStyles = () => {
      if (!document.querySelector('link[data-live2d-css]')) {
        const cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.href = `${LIVE2D_PATH}waifu.css`
        cssLink.dataset.live2dCss = 'true'
        document.head.appendChild(cssLink)
      }
      if (!document.querySelector('style[data-live2d-override]')) {
        const overrideStyle = document.createElement('style')
        overrideStyle.dataset.live2dOverride = 'true'
        overrideStyle.textContent = `
          #waifu { z-index: 9999 !important; transform-origin: bottom left !important; }
          #waifu-tool {
            z-index: 10000 !important;
            transform-origin: bottom right !important;
            right: -10px !important;
            top: 70px !important;
            bottom: auto !important;
          }
          #waifu-tips {
            z-index: 10001 !important;
            transform-origin: bottom left !important;
            background: rgba(12, 16, 24, 0.95) !important;
            color: #f7f9fc !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            box-shadow: 0 18px 35px rgba(3, 4, 7, 0.55) !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65) !important;
          }
          #live2d { width: 280px !important; height: 280px !important; transform-origin: center !important; }
          #live2d-widget { z-index: 9999 !important; }
        `
        document.head.appendChild(overrideStyle)
      }
    }

    const ensureScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (document.querySelector('script[data-live2d-entry]')) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.type = 'module'
        script.dataset.live2dEntry = 'true'
        script.src = `${LIVE2D_PATH}waifu-tips.js`
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Live2D 脚本加载失败'))
        document.head.appendChild(script)
      })
    }

    const toggleDegradeClass = (enabled: boolean) => {
      document.body.classList.toggle('live2d-degrade-mode', enabled)
    }

    const activateFallback = (message: string) => {
      fallbackMessage.value = message
      fallbackActive.value = true
      toggleDegradeClass(true)
    }

    const triggerLoad = async () => {
      if (widgetLoaded.value || widgetLoading.value || disabled.value) return
      widgetLoading.value = true
      earlyFallbackTimer = window.setTimeout(() => {
        if (!widgetLoaded.value) activateFallback('Live2D 加载较慢，已暂时使用精简模式。')
      }, 2000)
      const startTime = performance.now()
      try {
        ensureStyles()
        await ensureScript()
        await nextTick()
        if (typeof window.initWidget !== 'function') {
          throw new Error('window.initWidget 未就绪')
        }
        window.initWidget({
          waifuPath: `${LIVE2D_PATH}waifu-tips.json`,
          cdnPath: 'https://fastly.jsdelivr.net/gh/fghrsh/live2d_api/',
          cubism2Path: `${LIVE2D_PATH}live2d.min.js`,
          cubism5Path: 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
          modelId: 0,
          tools: ['hitokoto', 'switch-model', 'switch-texture', 'photo'],
          logLevel: 'error',
          drag: false
        })
        widgetLoaded.value = true
        fallbackActive.value = false
        toggleDegradeClass(false)
        if (earlyFallbackTimer) window.clearTimeout(earlyFallbackTimer)
        emitReady(Math.round(performance.now() - startTime))
        injectToolbarActions()
        scheduleHomeStayTip()
        maybeShowNightTip()
        resetIdleTimer()
        maybeShowActivityHighlight()
      } catch (error) {
        activateFallback('Live2D 加载失败，显示文本提示中。')
        emitError(error as Error)
        handleErrorWindow()
      } finally {
        widgetLoading.value = false
      }
    }

    const handleErrorWindow = () => {
      const now = Date.now()
      if (!errorWindowStart.value || now - errorWindowStart.value > 60_000) {
        errorWindowStart.value = now
        errorHits.value = 1
        return
      }
      errorHits.value += 1
      if (config.value.enableDegradeGuard && errorHits.value >= 3) {
        sessionStorage.setItem(LIVE2D_SESSION_KEYS.disableFlag, 'true')
        disabled.value = true
      }
    }

    const scheduleBootstrap = () => {
      if (disabled.value) return
      preloadTimer = window.setTimeout(triggerLoad, config.value.preloadDelay)
    }

    const teardown = () => {
      if (preloadTimer) window.clearTimeout(preloadTimer)
      if (idleTimer) window.clearTimeout(idleTimer)
      if (homeStayTimer) window.clearTimeout(homeStayTimer)
      if (tipHideTimer) window.clearTimeout(tipHideTimer)
      if (earlyFallbackTimer) window.clearTimeout(earlyFallbackTimer)
      cancelIdleJob()
      toggleDegradeClass(false)
    }

    const retryLoad = () => {
      if (disabled.value) {
        disabled.value = false
        sessionStorage.removeItem(LIVE2D_SESSION_KEYS.disableFlag)
      }
      triggerLoad()
    }

    const handleRouteEvent = (detailRoute: any) => {
      const nextScene = resolveSceneFromRoute(detailRoute)
      currentScene.value = nextScene
      sessionStorage.setItem(LIVE2D_SESSION_KEYS.lastScene, nextScene)
      scheduleHomeStayTip()
    }

    onMounted(async () => {
      document.addEventListener('click', handleInteraction, true)
      document.addEventListener('keydown', handleInteraction, true)
      document.addEventListener('mousemove', handleInteraction, true)
      document.addEventListener('click', tipActionHandler)
      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener(LIVE2D_ROUTE_EVENT, routeChangeHandler)

      try {
        const response = await fetch(`${LIVE2D_PATH}config.json`)
        if (response.ok) {
          const cfg = await response.json()
          config.value = { ...config.value, ...cfg }
        }
      } catch (error) {
        console.warn('Live2D 配置加载失败', error)
      }

      scheduleBootstrap()
      hydrateDynamicContent()
      requestIdleJob(() => hydrateDynamicContent())
      stopRouteWatch = watch(
        () => route.fullPath,
        () => handleRouteEvent(route),
        { immediate: true }
      )
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleInteraction, true)
      document.removeEventListener('keydown', handleInteraction, true)
      document.removeEventListener('mousemove', handleInteraction, true)
      document.removeEventListener('click', tipActionHandler)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener(LIVE2D_ROUTE_EVENT, routeChangeHandler)
      stopRouteWatch?.()
      teardown()
    })

    return {
      live2dContainer,
      fallbackActive,
      fallbackMessage,
      retryLoad
    }
  }
})

function resolveEnvApiBase() {
  if (window.env?.live2d?.apiBase) return window.env.live2d.apiBase
  if (window.__AURORA_ENV__?.live2d?.apiBase) return window.__AURORA_ENV__.live2d.apiBase
  if (process.env.VUE_APP_LIVE2D_API_BASE) return process.env.VUE_APP_LIVE2D_API_BASE
  return ''
}
</script>

<style lang="scss" scoped>
#live2d-widget-container {
  position: fixed;
  right: 80px;
  bottom: 0;
  z-index: 9999;
  width: 220px;
  height: 260px;
  transform: translateZ(0) scale(1);
  will-change: transform;
  isolation: isolate;
  transform-origin: bottom right;
}

.live2d-degrade-layer {
  position: absolute;
  right: 0;
  bottom: 20px;
  padding: 12px 16px;
  background: rgba(21, 23, 30, 0.85);
  color: var(--text-normal, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  max-width: 220px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.live2d-degrade-action {
  margin-top: 8px;
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 6px 0;
  background: var(--main-gradient, linear-gradient(135deg, #4facfe 0%, #00f2fe 100%));
  color: #0f1115;
  font-weight: 600;
  cursor: pointer;
}

:global(#waifu-tips .live2d-tip-action) {
  margin-left: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--main-gradient, linear-gradient(135deg, #f093fb 0%, #f5576c 100%));
  border: none;
  color: #0f1115;
  font-size: 0.78rem;
  cursor: pointer;
}

:global(#waifu-tips) {
  color: #f7f9fc;
}

:global(#waifu-tips span) {
  color: var(--text-accent, #4facfe);
}

:global(body.live2d-degrade-mode #waifu-tool) {
  display: none !important;
}

:global(.live2d-tool-extra) {
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: #7b8c9d !important;
  cursor: pointer;
}

:global(.live2d-tool-extra svg) {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

:global(.live2d-tool-extra:hover) {
  color: #0684bd !important;
  transform: translateY(-1px);
}

:global(#live2d-widget) {
  z-index: 9999;
  background: transparent !important;
  canvas {
    background: transparent !important;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  #live2d-widget-container {
    right: 16px;
    width: 140px;
    height: 180px;
  }
}
</style>
