import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    firstName: 'Jack',
    lastName: 'W',
  }),
  getters: {
    fullName(state) {
      return `${state.firstName} ${state.lastName}`;
    },
  },
  actions: {
    setName(firstName: string, lastName?: string) {
      this.firstName = firstName;
      lastName && (this.lastName = lastName);
    },
  },
});
