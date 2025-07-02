import { defineStore } from 'pinia'

export const useUserState = defineStore('userState', {
	state: () => ({
		userInfo: {}
	}),
	actions: {
		setUser(state) {
			this.userInfo = state
		}
	},
  persist: true
})