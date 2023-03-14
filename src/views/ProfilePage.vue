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

      <template v-if="contact">
        <ContactItem :data="contact"></ContactItem>
        <h3> Profile </h3>
        <ion-list>
          <ion-item>
            <ion-label>Name</ion-label>
            <ion-input v-model.trim="contact.profile.name"></ion-input>
          </ion-item>
        </ion-list>
        <ion-list>
          <ion-item>
            <ion-label>Display name (optional)</ion-label>
            <ion-input v-model.trim="contact.profile.label"></ion-input>
          </ion-item>
        </ion-list>
        <ion-list>
          <ion-item>
            <ion-label>Picture (optional)</ion-label>
            <ion-input v-model.trim="contact.profile.avatar"></ion-input>
          </ion-item>
        </ion-list>
        <h4> Location </h4>
        <ion-list>
          <ion-item>
            <ion-label>Label</ion-label>
            <ion-input v-model.trim="contact.profile.location.label"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Country code (optional)</ion-label>
            <ion-select v-model="contact.profile.location.countryCode">
              <ion-select-option v-for="country of countryCodes" :value="country.code" :key="country.code">{{ country.name
              }} ({{ country.code }})</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label>Precision</ion-label>
            <ion-select v-model.number="contact.profile.location.precision"
              :selected-text="locationPrecisionLabels[contact.profile.location.precision]">
              <ion-select-option v-for="(value, key) of locationPrecisionLabels" :value="key" :key="key">{{ value
              }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label>Exact latitude (optional)</ion-label>
            <ion-input v-model.number="contact.profile.location.lat"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Exact longitude (optional)</ion-label>
            <ion-input v-model.number="contact.profile.location.lng"></ion-input>
          </ion-item>
          <ion-button @click="geoLocate()">Fill using my current location</ion-button>
        </ion-list>
        <h3> Links </h3>
        <ion-list>
          <ion-item v-for="(link, index) of contact.urls" :key="index">
            <ion-label>Label</ion-label>
            <ion-input v-model.trim="link.label"></ion-input>
            <ion-label>URL</ion-label>
            <ion-input v-model.trim="link.url"></ion-input>
          </ion-item>
          <ion-button @click="contact!.urls.push({ label: '', url: '' })">+</ion-button>
        </ion-list>
        <h3> Data </h3>
        <ion-list>
          <ion-item v-for="(link, index) of contact.data" :key="index">
            <ion-label>Label</ion-label>
            <ion-input v-model.trim="link.key"></ion-input>
            <ion-label>Value</ion-label>
            <ion-input v-model.trim="link.value"></ion-input>
          </ion-item>
          <ion-button @click="contact!.data.push({ key: '', value: '' })">+</ion-button>
        </ion-list>
        <h3> Repositories </h3>
        <ion-list>
          <ion-item v-for="(repository, index) of repositories" :key="index">
            <ion-label>{{ repositoryNames[repository.id] }}</ion-label>
            <ion-textarea v-model.trim="repository.configuration"></ion-textarea>
            <ion-button @click="configure(repository)">Reconfigure</ion-button>
          </ion-item>
          <p>Create:</p>
          <ion-select v-model.number="newRepositoryType" :selected-text="repositoryNames[newRepositoryType]">
            <ion-select-option v-for="(name, key) of repositoryNames" :value="key" :key="key">{{ name
            }}</ion-select-option>
          </ion-select>
          <ion-button @click="repositories.push({ id: newRepositoryType, configuration: '' })">+</ion-button>
        </ion-list>
        <p>
          <ion-button @click="update()">Update</ion-button>
        </p>
      </template>
      <template v-else>
        loading...
      </template>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { useMeStore } from '@/store';
import { IonButtons, IonContent, IonHeader, IonList, IonItem, IonLabel, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput, IonSelect, IonSelectOption, IonButton, IonTextarea } from '@ionic/vue';
import { locationPrecisionLabels, Repository, Repositories, repositoryNames } from '@/types/contacts';
import ContactItem from '@/components/ContactItem.vue';
import { storeToRefs } from 'pinia';
import { countryCodes } from '@/util/countryCodes';
import { locationMetadata } from '@/util/osm';
import { update, configure } from '@/util/backend';
import { ref } from 'vue';

const { contact, repositories } = storeToRefs(useMeStore());
const oldMe = JSON.stringify(contact.value);
const newRepositoryType = ref(Repositories.test);

function geoLocate() {
  navigator.geolocation.getCurrentPosition(async (position) => {
    if (contact.value) {
      const { latitude, longitude } = position.coords;
      contact.value.profile.location = await locationMetadata(latitude, longitude, contact.value.profile.location.precision);
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
