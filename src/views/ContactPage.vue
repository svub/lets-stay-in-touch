<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Contact details</ion-title>
        <ion-buttons slot="end">
          <ion-button title="Refresh data" color="primary" @click="refresh">💫</ion-button>
        </ion-buttons>
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
        <ion-list>
          <ion-item>
            <ion-label>Label</ion-label>
            <ion-text>{{ contact.profile.location.label }}</ion-text>
          </ion-item>
          <ion-item>
            <ion-label>Country code</ion-label>
            <ion-text>{{ contact.profile.location.countryCode }}</ion-text>
          </ion-item>
          <ion-item>
            <ion-label>Precision</ion-label>
            <ion-text>{{ locationPrecisionLabels[contact.profile.location.precision] }}</ion-text>
          </ion-item>
          <ion-item>
            <ion-label>Coordinates</ion-label>
            <ion-text>
              <a :href="`https://google.com/maps/@${contact.profile.location.lat},${contact.profile.location.lng},15z`"
                target="_blank" rel="noopener noreferrer"> {{ contact.profile.location.lat }}, {{
                  contact.profile.location.lng }}</a>
            </ion-text>
          </ion-item>
        </ion-list>
        <h3> Links </h3>
        <ion-list>
          <ion-item v-for="(link, index) of contact.profile.urls" :key="index">
            <ion-label>{{ link.label }}</ion-label>
            <ion-text><a :href="link.url">{{ link.url }}</a></ion-text>
          </ion-item>
        </ion-list>
        <h3> Data </h3>
        <ion-list>
          <ion-item v-for="(data, index) of contact.profile.data" :key="index">
            <ion-label>{{ data.key }}</ion-label>
            <ion-text>{{ data.value }}</ion-text>
          </ion-item>
        </ion-list>
        <h3> Sources </h3>
        <ion-list>
          <ion-item v-for="(source, index) of contact.profile.sources" :key="index">
            <ion-text>{{ source }}</ion-text>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { useContactsStore } from '@/store';
import { IonButtons, IonContent, IonHeader, IonButton, IonText, IonMenuButton, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel } from '@ionic/vue';
import { useRoute } from 'vue-router';
import { Contact, locationPrecisionLabels } from '@/types/contacts';
import ContactItem from '@/components/ContactItem.vue';
import { Update, pullUpdate } from '@/util/storage';
import { Ref, ref } from 'vue';

const route = useRoute();
const id = route.params.id;
const contact = useContactsStore().get(id as string)!;
const update: Ref<Update<Contact> | undefined> = ref();

async function refresh() {
  update.value = await pullUpdate(contact);
  console.log('ContactPage.refresh: done', update.value);
}
</script>

<style scoped></style>
