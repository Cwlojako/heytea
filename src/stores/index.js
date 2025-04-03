import { defineStore } from 'pinia'

export const useStoreState = defineStore('storeState', {
  state: () => ({
    savedState: {
      keyword: '',
      list: [],
      finished: true
    }
  }),
  actions: {
    setSavedState(state) {
      this.savedState = state
    }
  }
})