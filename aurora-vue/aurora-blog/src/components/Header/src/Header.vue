<template>
  <div class="header-container" :class="{ 'is-scrolled': isScrolled || !isHome }">
    <header class="site-header">
      <Logo />
      <Navigation />
      <Controls />
    </header>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Logo, Navigation, Controls } from '../index'

export default defineComponent({
  name: 'Header',
  components: {
    Logo,
    Navigation,
    Controls
  },
  props: {
    msg: String
  },
  setup() {
    const route = useRoute()
    const isHome = computed(() => route.path === '/')
    const isScrolled = ref(false)
    const handleScroll = () => {
      isScrolled.value = window.scrollY > 50
    }
    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
    })
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })
    return {
      isScrolled,
      isHome
    }
  }
})
</script>

<style lang="scss" scoped>
.header-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  transition: all 0.3s ease-in-out;
  &.is-scrolled {
    background: color-mix(in srgb, var(--background-secondary), transparent 5%);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    
    :deep(*) {
      color: var(--text-normal) !important;
      text-shadow: none !important;
      font-weight: 500;
    }
  }

  /* Default state (Transparent) - Enhance contrast */
  &:not(.is-scrolled) {
    background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%);
    :deep(*) {
      color: #fff !important;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
      font-weight: 600;
    }
  }

  .site-header {
    max-width: var(--max-width);
    @apply flex z-50 my-0 mx-auto py-4 px-4;
  }
}
</style>
