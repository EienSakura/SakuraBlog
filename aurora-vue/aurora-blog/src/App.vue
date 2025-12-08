<template>
  <div id="App-Wrapper" :class="[appWrapperClass, theme]" :style="wrapperStyle">
    <div
      id="App-Container"
      class="app-container max-w-10/12 lg:max-w-screen-2xl px-3 lg:px-8 flex flex-col min-h-screen"
      :class="{ 'pt-32': !isHome }"
      @keydown.meta.k.stop.prevent=""
      tabindex="-1"
      :style="cssVariables">
      <HeaderMain />
      <div class="app-banner app-banner-image" :style="headerImage" v-if="isHome" />
      <div class="app-banner app-banner-screen" :style="headerBaseBackground" v-if="isHome" />
      <HeroSection v-if="isHome" />
      <div
        id="main-content"
        class="relative z-10 flex-1 flex flex-col"
        :style="{ scrollSnapAlign: isHome ? 'start' : 'none', scrollMarginTop: isHome ? '70px' : '0' }">
        <div class="flex-1">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide-y" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
        <Footer id="footer" :style="cssVariables" class="mt-8" />
      </div>
    </div>
    <div id="loading-bar-wrapper" :class="loadingBarClass"></div>
  </div>
  <div class="App-Mobile-sidebar" v-if="isMobile">
    <div id="App-Mobile-Profile" class="App-Mobile-wrapper">
      <MobileMenu />
    </div>
  </div>
  <AuroraNavigator />
  <UserCenter />
  <Live2DWidget />
  <teleport to="head">
    <title>{{ title }}</title>
  </teleport>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useCommonStore } from '@/stores/common'
import { useMetaStore } from '@/stores/meta'
import HeaderMain from '@/components/Header/src/Header.vue'
import { HeroSection } from '@/components/HeroSection'
import Footer from '@/components/Footer.vue'
import MobileMenu from '@/components/MobileMenu.vue'
import AuroraNavigator from '@/components/AuroraNavigator.vue'
import UserCenter from '@/components/UserCenter.vue'
import Live2DWidget from '@/components/Live2DWidget.vue'
import api from './api/api'
export default defineComponent({
  name: 'App',
  components: {
    HeaderMain,
    HeroSection,
    Footer,
    AuroraNavigator,
    MobileMenu,
    UserCenter,
    Live2DWidget
  },
  setup() {
    const appStore = useAppStore()
    const commonStore = useCommonStore()
    const metaStore = useMetaStore()
    const route = useRoute()
    const MOBILE_WITH = 996
    const appWrapperClass = 'app-wrapper'
    const loadingBarClass = ref({
      'nprogress-custom-parent': false
    })
    const wrapperStyle = ref({ 'min-height': '100vh' })
    const isMobile = computed(() => {
      return commonStore.isMobile
    })

    const isHome = computed(() => route.path === '/')
    watch(
      isHome,
      (val) => {
        if (val) {
          document.documentElement.classList.add('snap-scroll')
        } else {
          document.documentElement.classList.remove('snap-scroll')
        }
      },
      { immediate: true }
    )

    onBeforeMount(() => {
      initialApp()
    })
    onUnmounted(() => {
      document.removeEventListener('copy', copyEventHandler)
      window.removeEventListener('resize', resizeHander)
    })
    const initialApp = () => {
      initResizeEvent()
      intialCopy()
      initWindowOnload()
      fetchWebsiteConfig()
      wrapperStyle.value = {
        'min-height': '100vh'
      }
      appStore.initializeTheme(appStore.themeConfig.theme)
    }
    const fetchWebsiteConfig = () => {
      api.getWebsiteConfig().then(({ data }) => {
        appStore.viewCount = data.data.viewCount
        appStore.articleCount = data.data.articleCount
        appStore.talkCount = data.data.talkCount
        appStore.categoryCount = data.data.categoryCount
        appStore.tagCount = data.data.tagCount
        appStore.websiteConfig = data.data.websiteConfigDTO
        const heroBackground = data.data.websiteConfigDTO.heroBackground
        if (heroBackground) {
          commonStore.setHeaderImage(heroBackground)
        } else {
          commonStore.resetHeaderImage()
        }
        initFavicon(data.data.websiteConfigDTO.favicon)
      })
    }
    const copyEventHandler = (event: any) => {
      if (document.getSelection() instanceof Selection) {
        if (document.getSelection()?.toString() !== '' && event.clipboardData) {
          event.clipboardData.setData('text', document.getSelection())
          event.preventDefault()
        }
      }
    }
    const intialCopy = () => {
      document.addEventListener('copy', copyEventHandler)
    }
    const resizeHander = () => {
      const rect = document.body.getBoundingClientRect()
      const mobileState = rect.width - 1 < MOBILE_WITH
      if (isMobile.value !== mobileState) commonStore.changeMobileState(mobileState)
    }
    const initResizeEvent = () => {
      resizeHander()
      window.addEventListener('resize', resizeHander)
    }
    const initWindowOnload = () => {
      window.onload = () => {
        setTimeout(() => {
          window.scrollTo({
            top: 0
          })
        }, 10)
      }
    }
    const initFavicon = (faviconUrl: string) => {
      if (!faviconUrl) {
        return
      }
      // 获取 head 标签
      var head = document.getElementsByTagName('head')[0];
      // 获取当前 favicon 元素
      var favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
      // Cast favicon to HTMLLinkElement
      var faviconLink = favicon as HTMLLinkElement;

      faviconLink.type = 'image/x-icon';
      faviconLink.rel = 'shortcut icon';

      // 设置新的 favicon 地址
      faviconLink.href = faviconUrl;

      // 如果当前 head 标签中不存在 favicon 元素，则将新的 favicon 添加到 head 标签中
      if (!document.querySelector("link[rel*='icon']")) {
          head.appendChild(faviconLink);
      }
    }
    return {
      title: computed(() => appStore.websiteConfig.websiteTitle || metaStore.title),
      theme: computed(() => appStore.themeConfig.theme),
      headerImage: computed(() => {
        return {
          backgroundImage: `url(${commonStore.headerImage || 'https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f'})`,
          opacity: 1
        }
      }),
      headerBaseBackground: computed(() => {
        return {
          background: appStore.themeConfig.header_gradient_css,
          opacity: commonStore.headerImage !== '' ? 0.91 : 0.99
        }
      }),
      wrapperStyle: computed(() => wrapperStyle.value),
      isHome: computed(() => route.path === '/'),

      isMobile: computed(() => commonStore.isMobile),
      cssVariables: computed(() => {
        if (appStore.themeConfig.theme === 'theme-dark') {
          return `
            --text-accent: ${appStore.themeConfig.gradient.color_1};
            --text-sub-accent: ${appStore.themeConfig.gradient.color_3};
            --main-gradient: ${appStore.themeConfig.header_gradient_css};
          `
        }
        return `
          --text-accent: ${appStore.themeConfig.gradient.color_3};
          --text-sub-accent: ${appStore.themeConfig.gradient.color_2};
          --main-gradient: ${appStore.themeConfig.header_gradient_css};
        `
      }),
      appWrapperClass,
      loadingBarClass
    }
  }
})
</script>

<style lang="scss">
.arrow-left > .icon,
.arrow-right > .icon {
  display: inline !important;
}
.img-error {
  display: none !important;
}
.el-drawer {
  background-color: var(--background-primary) !important;
}
.el-dialog {
  background-color: var(--background-primary) !important;
}
body {
  background: var(--background-primary-alt);
}

*:focus {
  outline: none;
}

#app {
  @apply relative min-w-full min-h-screen h-full;
  font-family: 'Rubik', 'Noto Serif SC', sans-serif;
  .app-wrapper {
    @apply min-w-full h-full;
    background: var(--app-background);
    transition-property: transform, border-radius;
    transition-duration: 350ms;
    transition-timing-function: ease;
    transform-origin: 0 42%;
    .app-container {
      color: var(--text-normal);
      margin: 0 auto;
    }
  }

  .header-wave {
    position: absolute;
    top: 100px;
    left: 0;
    z-index: 1;
  }

  .App-Mobile-sidebar {
    @apply fixed top-0 bottom-0 left-0;
  }
  .App-Mobile-wrapper {
    @apply relative overflow-y-auto h-full -mr-4 pr-6 pl-4 pt-8 opacity-0;
    transition: all 0.85s cubic-bezier(0, 1.8, 1, 1.2);
    transform: translateY(-20%);
    width: 280px;
  }
}

.app-banner {
  content: '';
  display: block;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

.app-banner-image {
  z-index: 1;
  background-size: cover;
  opacity: 0;
  transition: ease-in-out opacity 300ms;
}

.app-banner-screen {
  transition: ease-in-out opacity 300ms;
  z-index: 2;
  opacity: 0.91;
}
</style>
