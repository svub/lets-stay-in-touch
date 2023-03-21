<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Contact details</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Contact details</ion-title>
        </ion-toolbar>
      </ion-header>

      <p v-if="!contact">
        Contact "{{ id }}" not found.
      </p>
      <template v-else>
        <ContactItem :data="contact"></ContactItem>
        <h3> Location </h3>
        <ion-grid>
          <ion-row>
            <ion-col size="2">Label</ion-col>
            <ion-col>{{ contact.profile.location.label }}</ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="2">Country code</ion-col>
            <ion-col>{{ contact.profile.location.countryCode }}</ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="2">Precision</ion-col>
            <ion-col>{{ locationPrecisionLabels[contact.profile.location.precision] }}</ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="2">Coordinates</ion-col>
            <ion-col>
              <a :href="`https://google.com/maps/@${contact.profile.location.lat},${contact.profile.location.lng},15z`"
                target="_blank" rel="noopener noreferrer"> {{ contact.profile.location.lat }}, {{
                  contact.profile.location.lng }}</a>
            </ion-col>
          </ion-row>
        </ion-grid>
        <h3> Links </h3>
        <ion-grid>
          <ion-row v-for="(link, index) of contact.profile.urls" :key="index">
            <ion-col size="2">{{ link.label }}</ion-col>
            <ion-col><a :href="link.url">{{ link.url }}</a></ion-col>
          </ion-row>
        </ion-grid>
        <h3> Data </h3>
        <ion-grid>
          <ion-row v-for="(data, index) of contact.profile.data" :key="index">
            <ion-col size="2">{{ data.key }}</ion-col>
            <ion-col>{{ data.value }}</ion-col>
          </ion-row>
        </ion-grid>
        <h3> Sources </h3>
        <ion-grid>
          <ion-row v-for="(source, index) of contact.profile.sources" :key="index">
            <ion-col>{{ source }}</ion-col>
          </ion-row>
        </ion-grid>
      </template>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { useContactsStore } from '@/store';
import { IonButtons, IonContent, IonHeader, IonText, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { useRoute } from 'vue-router';
import { locationPrecisionLabels } from '@/types/contacts';
import ContactItem from '@/components/ContactItem.vue';

const route = useRoute();
const id = route.params.id;
const contact = useContactsStore().contacts.get(id as string);

</script>

<style scoped></style>
