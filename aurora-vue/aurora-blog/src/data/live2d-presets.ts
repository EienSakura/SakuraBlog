import type { RouteLocationNormalizedLoaded } from 'vue-router'

export type Live2dSceneKey = 'default' | 'home' | 'article' | 'list' | 'photos' | 'night' | 'idle'
export type Live2dActionType = 'explore' | 'toc' | 'navigate' | 'scroll' | 'share' | 'favorite' | 'dismiss'

export interface Live2dTipCTA {
  label: string
  action: Live2dActionType
  payload?: Record<string, any>
}

export interface Live2dTipTemplate {
  id: string
  text: string
  weight?: number
  cta?: Live2dTipCTA
}

export interface Live2dHotArticle {
  id: number | string
  title: string
  slug?: string
  cover?: string
  summary?: string
  views?: number
}

export interface Live2dTagSummary {
  id: number | string
  name: string
  slug?: string
}

export interface Live2dActivityConfig {
  id: number | string
  title: string
  url: string
  startAt?: string
  endAt?: string
  priority?: number
}

export const LIVE2D_SESSION_KEYS = {
  hotArticles: 'live2d.hotArticles',
  randomTags: 'live2d.randomTags',
  activities: 'live2d.activities',
  disableFlag: 'live2d.disableFlag',
  lastScene: 'live2d.lastScene'
}

export const LIVE2D_METRIC_EVENT = 'live2d:metric'
export const LIVE2D_READY_EVENT = 'live2d:ready'
export const LIVE2D_ERROR_EVENT = 'live2d:error'
export const LIVE2D_ROUTE_EVENT = 'live2d:route-change'

export const HOME_STAY_THRESHOLD = 15000
export const IDLE_TIMEOUT = 60000
export const FAST_SCROLL_DISTANCE = 800
export const FAST_SCROLL_WINDOW = 1200
export const LIVE2D_SCENE_FALLBACK: Record<Live2dSceneKey, Live2dSceneKey[]> = {
  default: ['home'],
  home: ['default'],
  article: ['home', 'default'],
  list: ['home', 'default'],
  photos: ['home', 'default'],
  night: ['home', 'default'],
  idle: ['home', 'default']
}

const baseCTA = {
  explore: { label: '去阅读', action: 'explore' as const },
  toc: { label: '打开导航', action: 'toc' as const },
  randomTag: { label: '查看标签', action: 'navigate' as const, payload: { route: '/tags' } },
  message: { label: '前往留言', action: 'navigate' as const, payload: { route: '/message' } },
  photos: { label: '去照片页', action: 'navigate' as const, payload: { route: '/photos' } }
}

export const LIVE2D_PRESETS: Record<Live2dSceneKey, Live2dTipTemplate[]> = {
  default: [
    { id: 'default-1', text: '欢迎回到 Aurora，新的灵感正在冒泡～', cta: baseCTA.explore },
    { id: 'default-2', text: '收藏夹的位置我记得牢牢的，不如现在就加一个吧？', cta: { label: '加入收藏', action: 'share', payload: { mode: 'share' } } },
    { id: 'default-3', text: '有问题随时点我，我比搜索栏更懂你。', cta: { label: '打开导航', action: 'toc' } },
    { id: 'default-4', text: '随手点开一篇文章试试，说不定今天就被治愈了。', cta: baseCTA.explore },
    { id: 'default-5', text: '站内助手在线值班，告诉我你想去哪里。', cta: baseCTA.toc }
  ],
  home: [
    { id: 'home-1', text: '{{articleTitle}} 最近热度飙升，我帮你开个头？', cta: baseCTA.explore },
    { id: 'home-2', text: '你在首页停留了 {{staySeconds}} 秒，挑一篇我喜爱的文章如何？', cta: { label: '交给你', action: 'explore' } },
    { id: 'home-3', text: '{{tag}} 话题正在升温，我给你准备了精选合集。', cta: baseCTA.randomTag },
    { id: 'home-4', text: '不知道读什么？掷给我吧，我负责带你去新的旅程。', cta: { label: '惊喜我', action: 'explore' } },
    { id: 'home-5', text: '目录面板里藏着栏目彩蛋，要不要戳一下？', cta: baseCTA.toc },
    { id: 'home-activity', text: '{{activityTitle}} 正在进行中，别错过活动提醒。', cta: { label: '查看活动', action: 'navigate', payload: { url: '{{activityUrl}}' } } }
  ],
  article: [
    { id: 'article-1', text: '{{articleTitle}} 已经读到 {{progress}}%，再坚持一下就可以收藏啦！', cta: { label: '收藏文章', action: 'favorite' } },
    { id: 'article-2', text: '喜欢这篇的话，不妨分享给同频的伙伴～', cta: { label: '复制链接', action: 'share' } },
    { id: 'article-3', text: '我猜你也会喜欢热门推荐里的另一篇 {{relatedTitle}}。', cta: baseCTA.explore },
    { id: 'article-4', text: '看完正文记得滑到评论区，我在那儿替你占了楼。', cta: baseCTA.message },
    { id: 'article-5', text: '需要我把重点段落标记一下吗？试试目录面板吧。', cta: baseCTA.toc }
  ],
  list: [
    { id: 'list-1', text: '{{tag}} 相关的内容我已经筛好，想要更精准？', cta: baseCTA.toc },
    { id: 'list-2', text: '最近 {{tag}} 文章发布频率有点高，要不要订阅一个？', cta: { label: '去订阅', action: 'navigate', payload: { route: '/about' } } },
    { id: 'list-3', text: '如果列表太长，我建议用搜索框精准命中目标。', cta: { label: '打开搜索', action: 'navigate', payload: { route: '/search' } } },
    { id: 'list-4', text: '想偷个懒？直接让我推荐一篇高赞文章给你。', cta: { label: '给惊喜', action: 'explore' } },
    { id: 'list-5', text: '顶部导航支持快速过滤，你可以随手切换分类。', cta: baseCTA.toc }
  ],
  photos: [
    { id: 'photos-1', text: '照片墙的色彩最适合放松，{{albumName}} 请查收。', cta: baseCTA.photos },
    { id: 'photos-2', text: '听说你喜欢新鲜感，要不要去最新的相册逛逛？', cta: { label: '随机相册', action: 'navigate', payload: { route: '/photos/latest' } } },
    { id: 'photos-3', text: '照片背后的故事写在博主动态里，顺路看看？', cta: { label: '前往说说', action: 'navigate', payload: { route: '/talks' } } },
    { id: 'photos-4', text: '如果你也想投稿，可以去留言板告诉博主。', cta: baseCTA.message },
    { id: 'photos-5', text: '滚动太快会错过惊喜，我可以帮你慢放。', cta: { label: '回到顶部', action: 'scroll', payload: { to: 0 } } }
  ],
  night: [
    { id: 'night-1', text: '夜间模式已自动为你点亮，记得护眼喔。', cta: { label: '知道啦', action: 'dismiss' } },
    { id: 'night-2', text: '现在是 {{timeLabel}}，喝口水再继续吧。', cta: { label: '喝水去', action: 'dismiss' } },
    { id: 'night-3', text: '夜猫子专属推荐：{{articleTitle}}，内容很治愈。', cta: baseCTA.explore },
    { id: 'night-4', text: '开个夜间播放清单如何？照片页有氛围感壁纸。', cta: baseCTA.photos },
    { id: 'night-5', text: '太晚了我会自动休眠，记得早点休息呀。', cta: { label: '我知道', action: 'dismiss' } }
  ],
  idle: [
    { id: 'idle-1', text: '60 秒没有操作，是在等我推荐内容吗？', cta: { label: '交给你', action: 'explore' } },
    { id: 'idle-2', text: '不如看看 Aurora Navigator，我已经帮你排好路线。', cta: baseCTA.toc },
    { id: 'idle-3', text: '要不要逛逛照片墙换换脑子？', cta: baseCTA.photos },
    { id: 'idle-4', text: '还有很多精选标签没打开，随我来？', cta: baseCTA.randomTag },
    { id: 'idle-5', text: '喜欢什么类型告诉我，评论区欢迎留言～', cta: baseCTA.message }
  ]
}

export const SCENE_ROUTE_MAPPING: Record<string, Live2dSceneKey> = {
  Home: 'home',
  Articles: 'article',
  ArticleDetail: 'article',
  ArticleList: 'list',
  Photos: 'photos',
  '404': 'default'
}

export function resolveSceneFromRoute(route?: RouteLocationNormalizedLoaded): Live2dSceneKey {
  if (!route) return 'default'
  const scene = SCENE_ROUTE_MAPPING[route.name as string]
  return scene || 'default'
}
