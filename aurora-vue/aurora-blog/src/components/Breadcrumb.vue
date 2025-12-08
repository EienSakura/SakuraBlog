<template>
  <ul class="breadcrumbs flex flex-row gap-6 font-medium">
    <li>{{ t('menu.home') }}</li>
    <li>{{ current }}</li>
  </ul>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'Breadcrumb',
  props: ['current'],
  setup() {
    const { t } = useI18n()
    return { t }
  }
})
</script>

<style lang="scss" scoped>
.breadcrumbs {
  position: relative;
  z-index: 20;
  color: var(--text-dim);
  li {
    position: relative;
    z-index: 20;
    &:after {
      content: '>';
      position: absolute;
      top: 0.05rem;
      right: -0.95rem;
      opacity: 0.65;
    }
    &:last-of-type {
      &:after {
        content: '';
      }
    }
  }
}
</style>
