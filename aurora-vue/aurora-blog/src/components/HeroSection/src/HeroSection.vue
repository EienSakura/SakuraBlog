<template>
  <div class="hero-section">
    <div class="hero-content">
      <h1 class="hero-title">eiensakura's Blog</h1>
      <div class="hero-subtitle">
        <span class="typed-text">{{ displayText }}</span>
        <span class="cursor" :class="{ typing: isTyping }">|</span>
      </div>
    </div>
    <div class="hero-scroll-down" @click="scrollToContent">
      <svg-icon icon-class="arrow-right" style="transform: rotate(90deg);" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'

const DEFAULT_TEXTS = [
  'Every day is a new beginning.',
  'Life is not about waiting for the storm to pass, but learning to dance in the rain.',
  'Stay hungry, stay foolish.',
  '樱花落下的速度是秒速5厘米。'
]
const SCROLL_MARGIN = 80
const HITOKOTO_API = 'https://v1.hitokoto.cn'

export default defineComponent({
  name: 'HeroSection',
  setup() {
    const appStore = useAppStore()
    const displayText = ref('')
    const isTyping = ref(false)
    const fullText = ref('')
    const textList = ref<string[]>([...DEFAULT_TEXTS])
    let textIndex = 0
    let charIndex = 0
    let timer: any = null

    const getConfig = () =>
      typeof appStore.websiteConfig === 'object' && appStore.websiteConfig !== null ? appStore.websiteConfig : {}

    const getTextQueue = () => (textList.value.length ? textList.value : [...DEFAULT_TEXTS])

    const typeText = () => {
      if (charIndex < fullText.value.length) {
        isTyping.value = true
        displayText.value += fullText.value.charAt(charIndex)
        charIndex++
        timer = setTimeout(typeText, 100)
      } else {
        isTyping.value = false
        timer = setTimeout(eraseText, 2000)
      }
    }

    const eraseText = () => {
      if (charIndex > 0) {
        isTyping.value = true
        displayText.value = fullText.value.substring(0, charIndex - 1)
        charIndex--
        timer = setTimeout(eraseText, 50)
      } else {
        isTyping.value = false
        const queue = getTextQueue()
        textIndex = queue.length > 0 ? (textIndex + 1) % queue.length : 0
        fullText.value = queue[textIndex] || DEFAULT_TEXTS[0]
        timer = setTimeout(typeText, 500)
      }
    }

    const startTyping = () => {
      const queue = getTextQueue()
      fullText.value = queue[textIndex] || DEFAULT_TEXTS[0]
      displayText.value = ''
      charIndex = 0
      typeText()
    }

    const restartTyping = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      textIndex = 0
      startTyping()
    }

    const parseCustomTexts = (input: unknown): string[] => {
      if (Array.isArray(input)) {
        return input.map((item) => String(item).trim()).filter((item) => item.length)
      }
      if (typeof input === 'string') {
        return input
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter((item) => item.length)
      }
      return []
    }

    const adoptRemoteQuote = (text: string) => {
      const sanitized = text.trim()
      if (!sanitized) return
      const queue = getTextQueue().filter((item) => item !== sanitized)
      textList.value = [sanitized, ...queue]
      restartTyping()
    }

    const fetchHitokoto = async () => {
      try {
        const response = await fetch(HITOKOTO_API)
        const data = await response.json()
        if (data && data.hitokoto) {
          adoptRemoteQuote(String(data.hitokoto))
        }
      } catch (e) {
        console.error('Failed to fetch Hitokoto:', e)
      }
    }

    const applyTextSource = (options?: { skipRestart?: boolean }) => {
      const config = getConfig() as any
      const source = config.hitokotoSource || 'hitokoto'
      if (source === 'custom') {
        const customList = parseCustomTexts(config.hitokotoCustomText)
        textList.value = customList.length ? customList : [...DEFAULT_TEXTS]
      } else if (source === 'builtin') {
        textList.value = [...DEFAULT_TEXTS]
      } else {
        textList.value = [...DEFAULT_TEXTS]
      }
      if (!options?.skipRestart) {
        restartTyping()
      }
      if (source === 'hitokoto') {
        fetchHitokoto()
      }
    }

    const getHeaderOffset = () => {
      const header = document.querySelector('.header-container')
      if (header instanceof HTMLElement) {
        return header.getBoundingClientRect().height
      }
      return 0
    }

    const computeScrollTop = (element: HTMLElement | null, offset: number) => {
      if (!element) return null
      return Math.max(element.getBoundingClientRect().top + window.scrollY - offset, 0)
    }

    const scrollToContent = () => {
      const mainContent = document.getElementById('main-content')
      const featureSection = document.getElementById('feature')
      const articleSection = document.getElementById('article-list')
      const headerOffset = getHeaderOffset()
      const extraOffset = SCROLL_MARGIN + headerOffset
      const fallbackTop = Math.max(window.innerHeight - extraOffset, 0)
      const targetTop =
        computeScrollTop(mainContent, extraOffset) ??
        computeScrollTop(featureSection, extraOffset) ??
        computeScrollTop(articleSection, extraOffset) ??
        fallbackTop
      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      })
    }

    onMounted(() => {
      applyTextSource({ skipRestart: true })
      startTyping()
    })

    watch(
      () => appStore.websiteConfig,
      () => {
        applyTextSource()
      }
    )

    onUnmounted(() => {
      if (timer) clearTimeout(timer)
    })

    return {
      displayText,
      isTyping,
      scrollToContent
    }
  }
})
</script>

<style lang="scss" scoped>
.hero-section {
  scroll-snap-align: start;
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  pointer-events: none; /* Let clicks pass through to background if needed, but we have pointer-events: auto on children */
  text-align: center;
  text-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
}

.hero-content {
  text-align: center;
  pointer-events: auto;
  padding: 1rem 1.5rem;
}

.hero-title {
  font-size: clamp(2.75rem, 5vw, 3.75rem);
  font-weight: 800;
  margin-bottom: 1rem;
  font-family: 'Rubik', 'Poppins', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  -webkit-text-stroke: 1px rgba(0, 0, 0, 0.28);
  text-shadow:
    0 18px 35px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(0, 0, 0, 0.45),
    0 4px 10px rgba(0, 0, 0, 0.55);
}

.hero-subtitle {
  font-size: clamp(1.2rem, 2.4vw, 1.5rem);
  font-weight: 500;
  min-height: 2rem;
  font-family: 'Noto Serif SC', 'Inter', serif;
  color: #fff;
  letter-spacing: 0.04em;
  -webkit-text-stroke: 0.4px rgba(0, 0, 0, 0.2);
  text-shadow:
    0 12px 25px rgba(0, 0, 0, 0.45),
    0 0 18px rgba(0, 0, 0, 0.35),
    0 2px 4px rgba(0, 0, 0, 0.4);
  position: relative;
  padding: 0 0.75rem;
}
.hero-subtitle::after {
  content: '';
  position: absolute;
  inset: auto 28% -0.15rem 28%;
  height: 2px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  opacity: 0.75;
}

.typed-text {
  display: inline-block;
  color: #fff;
}

.cursor {
  display: inline-block;
  margin-left: 6px;
  animation: blink 1s infinite;
  color: #fff;
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.7),
    0 0 20px rgba(255, 255, 255, 0.6);
}

.cursor.typing {
  animation: none;
  opacity: 1;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.hero-scroll-down {
  position: absolute;
  bottom: 40px;
  cursor: pointer;
  animation: bounce 2s infinite;
  pointer-events: auto;
  font-size: 2rem;
  opacity: 0.8;
  &:hover {
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  .hero-subtitle {
    font-size: 1.2rem;
    padding: 0 1rem;
  }
}
</style>