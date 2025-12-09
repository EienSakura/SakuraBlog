import { defineStore } from 'pinia'

export const useCommonStore = defineStore('commonStore', {
  state: () => {
    return {
      isMobile: false,
      headerImage: '',
      defaultHeaderImage: '',
      headerRevision: 0
    }
  },
  actions: {
    changeMobileState(isMobile: boolean) {
      this.isMobile = isMobile
    },
    setHeaderImage(imageUrl: string) {
      this.headerImage = imageUrl
      this.headerRevision++
    },
    setDefaultHeaderImage(imageUrl: string) {
      this.defaultHeaderImage = imageUrl
    },
    restoreHeaderImage() {
      this.setHeaderImage(this.defaultHeaderImage || '')
    },
    resetHeaderImage() {
      this.setHeaderImage('')
    }
  }
})
