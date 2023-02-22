<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Update your details</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Update your details</ion-title>
        </ion-toolbar>
      </ion-header>

      <template v-if="me">
        <ContactItem :data="me.contact"></ContactItem>
        <h3> Profile </h3>
        <ion-list>
          <ion-item>
            <ion-label>Name</ion-label>
            <ion-input v-model.trim="me.contact.profile.name"></ion-input>
          </ion-item>
        </ion-list>
        <ion-list>
          <ion-item>
            <ion-label>Display name (optional)</ion-label>
            <ion-input v-model.trim="me.contact.profile.label"></ion-input>
          </ion-item>
        </ion-list>
        <ion-list>
          <ion-item>
            <ion-label>Picture (optional)</ion-label>
            <ion-input v-model.trim="me.contact.profile.avatar"></ion-input>
          </ion-item>
        </ion-list>
        <h4> Location </h4>
        <ion-list>
          <ion-item>
            <ion-label>Label</ion-label>
            <ion-input v-model.trim="me.contact.profile.location.label"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Country code (optional)</ion-label>
            <!-- <ion-input v-model.trim="me.contact.profile.location.countryCode"></ion-input> -->
            <ion-select v-model="me.contact.profile.location.countryCode">
              <ion-select-option v-for="country of countryCodes" :value="country.code" :key="country.code">{{ country.name
              }} ({{ country.code }})</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label>Precision</ion-label>
            <ion-select v-model.number="me.contact.profile.location.precision"
              :selected-text="locationPrecisionLabels[me.contact.profile.location.precision]">
              <ion-select-option v-for="(value, key) of locationPrecisionLabels" :value="key" :key="key">{{ value
              }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label>Exact latitude (optional)</ion-label>
            <ion-input v-model.number="me.contact.profile.location.lat"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Exact longitude (optional)</ion-label>
            <ion-input v-model.number="me.contact.profile.location.lng"></ion-input>
          </ion-item>
          <ion-button @click="geoLocate()">Fill using my current location</ion-button>
        </ion-list>
        <h3> Links </h3>
        <ion-list>
          <ion-item>
            <ion-label>Label</ion-label>
            <ion-input v-model.trim="me.contact.profile.location.label"></ion-input>
          </ion-item>
        </ion-list>
        <ion-grid>
          <ion-row v-for="(link, index) of me.contact.urls" :key="index">
            <ion-col size="2">{{ link.label }}</ion-col>
            <ion-col><a :href="link.url">{{ link.url }}</a></ion-col>
          </ion-row>
        </ion-grid>
        <h3> Data </h3>
        <ion-grid>
          <ion-row v-for="(data, index) of me.contact.data" :key="index">
            <ion-col size="2">{{ data.key }}</ion-col>
            <ion-col>{{ data.value }}</ion-col>
          </ion-row>
        </ion-grid>
        <h3> Sources </h3>
        <ion-grid>
          <ion-row v-for="(source, index) of me.contact.sources" :key="index">
            <ion-col>{{ source }}</ion-col>
          </ion-row>
        </ion-grid>
        <p>
          <ion-button @click="update()">Update</ion-button>
        </p>
      </template>
      <template v-else>
        loading...
        <p>{{ me }}</p>
        <p>{{ oldMe }}</p>
      </template>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { useContactsStore } from '@/store';
import { IonButtons, IonContent, IonHeader, IonList, IonItem, IonLabel, IonMenuButton, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonInput, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import { useRoute } from 'vue-router';
import { locationPrecisionLabels } from '@/types/contacts';
import ContactItem from '@/components/ContactItem.vue';
import { storeToRefs } from 'pinia';
import { countryCodes } from '@/util/countryCodes';

// const countryCodes = importedRef<Array>('@/util/countryCodes');
const me = storeToRefs(useContactsStore()).me;
const oldMe = JSON.stringify(me.value);
console.log('ProfilePage ', countryCodes);

function update() {
  console.log('update...');
  console.log('old', oldMe);
  console.log('new', JSON.stringify(me.value));
}

function geoLocate() {
  navigator.geolocation.getCurrentPosition(position => {
    if (me.value) {
      me.value.contact.profile.location.lat = position.coords.latitude;
      me.value.contact.profile.location.lng = position.coords.longitude
    }
  }, (error) => {
    window.alert("Couldn't get your location. Error: " + error)
  }, {
    enableHighAccuracy: true,
    timeout: 10000,
  });
}

</script>

<style scoped></style>
