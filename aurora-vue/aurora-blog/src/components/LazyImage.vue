<template>
  <div class="lazy-image" :class="{ 'is-loaded': hasLoadedActual, 'is-loading': isLoadingActual }">
    <img
      ref="imgRef"
      :src="currentSrc"
      :alt="alt"
      :class="imgClass"
      loading="lazy"
      decoding="async"
      @load="handleLoad"
      @error="handleError" />
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1522383225653-ed111181a951?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80'
const MIN_LOADING_DURATION = 220

export default defineComponent({
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      default: ''
    },
    alt: {
      type: String,
      default: ''
    },
    fallback: {
      type: String,
      default: DEFAULT_FALLBACK
    },
    imgClass: {
      type: [String, Object, Array],
      default: ''
    }
  },
  setup(props) {
    const currentSrc = ref('')
    const hasLoadedActual = ref(false)
    const isLoadingActual = ref(false)
    const imgRef = ref<HTMLImageElement | null>(null)
    const loadingStart = ref(0)
    let observer: IntersectionObserver | null = null
    let loadTimer: number | null = null
    const disconnect = () => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
    }
    const clearLoadTimer = () => {
      if (loadTimer !== null) {
        clearTimeout(loadTimer)
        loadTimer = null
      }
    }

    const requestLoad = () => {
      clearLoadTimer()
      if (!props.src) {
        currentSrc.value = props.fallback || DEFAULT_FALLBACK
        isLoadingActual.value = false
        hasLoadedActual.value = true
        return
      }
      if (currentSrc.value !== props.src) {
        currentSrc.value = props.src
      }
      loadingStart.value = performance.now()
      isLoadingActual.value = true
      hasLoadedActual.value = false
    }

    const observeImage = () => {
      disconnect()
      if ('IntersectionObserver' in window && imgRef.value) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                requestLoad()
                disconnect()
              }
            })
          },
          {
            rootMargin: '180px 0px'
          }
        )
        observer.observe(imgRef.value)
      } else {
        requestLoad()
      }
    }

    const completeLoading = () => {
      clearLoadTimer()
      hasLoadedActual.value = true
      isLoadingActual.value = false
    }

    const handleLoad = () => {
      if (isLoadingActual.value) {
        const elapsed = performance.now() - loadingStart.value
        const remaining = Math.max(MIN_LOADING_DURATION - elapsed, 0)
        if (remaining === 0) {
          completeLoading()
        } else {
          loadTimer = window.setTimeout(() => {
            completeLoading()
          }, remaining)
        }
      }
    }

    const handleError = () => {
      clearLoadTimer()
      currentSrc.value = props.fallback || DEFAULT_FALLBACK
      isLoadingActual.value = false
      hasLoadedActual.value = true
    }

    onMounted(() => {
      if (props.src) {
        isLoadingActual.value = true
      }
      observeImage()
    })

    onBeforeUnmount(() => {
      disconnect()
      clearLoadTimer()
    })

    watch(
      () => props.src,
      () => {
        clearLoadTimer()
        hasLoadedActual.value = false
        isLoadingActual.value = Boolean(props.src)
        currentSrc.value = ''
        observeImage()
      }
    )

    return {
      alt: props.alt,
      imgClass: props.imgClass,
      currentSrc,
      hasLoadedActual,
      isLoadingActual,
      imgRef,
      handleLoad,
      handleError
    }
  }
})
</script>

<style scoped>
.lazy-image {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}
.lazy-image::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.05) 100%);
  transform: translateX(-100%);
  animation: shimmer 1.1s linear infinite;
  opacity: 0;
}
.lazy-image.is-loading::before {
  opacity: 1;
}
.lazy-image.is-loaded::before {
  opacity: 0;
}
.lazy-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.55s ease, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), filter 0.65s ease;
  opacity: 0;
  transform: scale(1.035) translate3d(0, 8px, 0);
  filter: blur(12px);
  display: block;
}
.lazy-image.is-loaded img {
  opacity: 1;
  transform: scale(1) translate3d(0, 0, 0);
  filter: blur(0);
}
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .lazy-image img {
    transition: opacity 0.3s ease;
    transform: none;
    filter: none;
  }
}
</style>
