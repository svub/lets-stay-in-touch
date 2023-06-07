import { defineStore } from "pinia";
import { ref } from "vue";

export const useBackupStore = defineStore('backup', () => {
  const version = ref(0);
  return {
    version,
  };
});
