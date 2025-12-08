<template>
  <div class="not-found-container">
    <div class="content">
      <h1 class="title">404</h1>
      <p class="subtitle">{{ t('settings.not-found-message') || 'Page Not Found' }}</p>
      <div class="actions">
        <button @click="goHome" class="action-btn home-btn">
          {{ t('settings.go-home') || 'Go Home' }}
        </button>
        <button @click="goBack" class="action-btn back-btn">
          {{ t('settings.go-back') || 'Go Back' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: '404',
  setup() {
    const router = useRouter()
    const { t } = useI18n()

    const goHome = () => {
      router.push('/')
    }

    const goBack = () => {
      router.go(-1)
    }

    return {
      t,
      goHome,
      goBack
    }
  }
})
</script>

<style lang="scss" scoped>
.not-found-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: var(--background-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  overflow: hidden;
}

.content {
  text-align: center;
  animation: fadeIn 0.8s ease-out;
}

.title {
  font-size: 8rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
  background: var(--main-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: var(--font-heading);
}

.subtitle {
  font-size: 1.5rem;
  margin: 1rem 0 3rem;
  color: var(--text-normal);
  font-family: var(--font-base);
  opacity: 0.8;
}

.actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.action-btn {
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-family: var(--font-base);

  &.home-btn {
    background: var(--text-accent);
    color: white;
    box-shadow: 0 4px 14px 0 rgba(236, 72, 153, 0.39);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(236, 72, 153, 0.23);
    }
  }

  &.back-btn {
    background: var(--background-secondary);
    color: var(--text-normal);
    border: 1px solid var(--text-dim);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

    &:hover {
      transform: translateY(-2px);
      background: var(--background-secondary-alt);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
