<template>
  <div>
    <Breadcrumb :current="t('menu.album')" />
    <div class="flex flex-col">
      <div class="post-header mt-8 text-ob-bright">
        <h1 class="post-title uppercase">{{ t('menu.album') }}</h1>
        <p class="mt-3 text-base text-ob-dim" v-if="albums.length > 0">
          {{ t('menu.album') }} · {{ albums.length }}
        </p>
      </div>
      <div v-if="!loading">
        <div class="album-grid" v-if="albums.length > 0">
          <div class="album-card" v-for="item in albums" :key="item.id" @click="openAlbum(item.id)">
            <div class="album-cover">
              <img :src="item.albumCover" :alt="item.albumName" />
            </div>
            <div class="album-info">
              <h3 class="album-title">{{ item.albumName }}</h3>
              <p class="album-desc" v-if="item.albumDesc">{{ item.albumDesc }}</p>
            </div>
          </div>
        </div>
        <div v-else class="empty-tip">{{ t('settings.noAlbums') }}</div>
      </div>
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ob-skeleton v-for="i in 6" :key="i" width="100%" height="16rem" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Breadcrumb from '@/components/Breadcrumb.vue'
import api from '@/api/api'

export default defineComponent({
  name: 'PhotoAlbums',
  components: { Breadcrumb },
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const state = reactive({
      albums: [] as any[],
      loading: true
    })
    onMounted(() => {
      api.getAlbums().then(({ data }) => {
        state.albums = data.data || []
      }).finally(() => {
        state.loading = false
      })
    })
    const openAlbum = (id: number): void => {
      if (!id) return
      router.push(`/photos/${id}`)
    }
    return {
      ...toRefs(state),
      openAlbum,
      t
    }
  }
})
</script>

<style lang="scss" scoped>
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}
.album-card {
  @apply bg-ob-deep-900 rounded-xl overflow-hidden shadow-md cursor-pointer transition transform;
  &:hover {
    transform: translateY(-4px);
    .album-cover img {
      transform: scale(1.05);
    }
  }
}
.album-cover {
  position: relative;
  overflow: hidden;
  height: 14rem;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
}
.album-info {
  padding: 1rem;
  .album-title {
    @apply text-lg text-ob-bright font-semibold;
  }
  .album-desc {
    @apply text-sm text-ob-dim mt-2;
  }
}
.empty-tip {
  @apply text-center text-ob-dim py-12 text-base;
}
</style>
