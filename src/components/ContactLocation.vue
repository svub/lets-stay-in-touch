<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>Coordinates</ion-card-title>
    </ion-card-header>
    <ion-card-content v-if="coordinates && coordinates.coords">
      <ion-item>Latitude: {{coordinates.coords.latitude}}</ion-item>
      <ion-item>Longitude: {{coordinates.coords.longitude}}</ion-item>
      <ion-item>Last Updated: {{coordinates.coords.timestamp}}</ion-item>
    </ion-card-content>
    <ion-card-content v-else>
      <ion-item>Position not found.</ion-item>
    </ion-card-content>
  </ion-card>
</template>

<script lang="ts">
// import { IonCard, IonCardHeader, IonCardContent, IonItem } from '@ionic/vue';
export default {
    props: {
        coordinates: { required: true, type: Object },
    },
};
</script>

<style scoped></style>
