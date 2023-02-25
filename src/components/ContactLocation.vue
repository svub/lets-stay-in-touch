<template>
  <div>
    <p v-if="position && position.coords">
      Position: {{ position.coords.latitude }},{{ position.coords.longitude }} "{{ position.timestamp }}"
    </p>
    <p v-else>
      Position not found.
    </p>
  </div>
</template>

<script lang="ts">
export default {
    props: {
        position: { required: true, type: Object },
    },
};
</script>

<style scoped></style>
