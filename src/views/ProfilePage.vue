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
        <ion-chip v-if="!hasSecureRepository()" color="danger">
          You didn't yet setup a safe place to back-up your contacts.
          Better scroll to the bottom and do it now. 😘</ion-chip>
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
          <ion-item v-for="(link, index) of contact.profile.urls" :key="index">
            <ion-label>Label</ion-label>
            <ion-input v-model.trim="link.label"></ion-input>
            <ion-label>URL</ion-label>
            <ion-input v-model.trim="link.url"></ion-input>
          </ion-item>
          <ion-button @click="contact!.profile.urls.push({ label: '', url: '' })">+</ion-button>
        </ion-list>
        <h3> Data </h3>
        <ion-list>
          <ion-item v-for="(link, index) of contact.profile.data" :key="index">
            <ion-label>Label</ion-label>
            <ion-input v-model.trim="link.key"></ion-input>
            <ion-label>Value</ion-label>
            <ion-input v-model.trim="link.value"></ion-input>
          </ion-item>
          <ion-button @click="contact!.profile.data.push({ key: '', value: '' })">+</ion-button>
        </ion-list>
        <h3> Repositories </h3>
        <ion-list>
          <ion-item v-if="repositories.length < 1">No repositories configured yet. Add one below.</ion-item>
          <ion-item v-for="(repository, index) of repositories" :key="index">
            <ion-label>{{ repositoryNames[repository.id] }}</ion-label>
            <ion-textarea readonly :value="JSON.stringify(repository.configuration)"></ion-textarea>
            <ion-button @click="disableRepository(repository)">Disable</ion-button>
          </ion-item>
          <ion-button @click="addRepository">Add a repository</ion-button>
        </ion-list>
        <p>
          <ion-button @click="pushUpdate()">Update</ion-button>
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
import { IonButtons, IonContent, IonHeader, IonList, IonChip, IonItem, IonLabel, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput, IonSelect, IonSelectOption, IonButton, IonTextarea, ActionSheetButton, actionSheetController } from '@ionic/vue';
import { locationPrecisionLabels } from '@/types/contacts';
import { isSecure, repositoryNames } from '@/types/repositories';
import ContactItem from '@/components/ContactItem.vue';
import { storeToRefs } from 'pinia';
import { countryCodes } from '@/util/countryCodes';
import { locationMetadata } from '@/util/osm';
import { pushUpdate, enableRepository, disableRepository, loadPlugin } from '@/util/storage';

const { contact, repositories } = storeToRefs(useMeStore());
console.log('Profile page: me contact', JSON.stringify(contact.value, undefined, ' '));
// const oldMe = JSON.stringify(contact.value);
// const newRepositoryType = ref(Repositories.test);

async function addRepository() {
  const actionSheetButtons: ActionSheetButton[] = await Promise.all(Object.entries(repositoryNames).map(async ([key, name]) => {
    const id = parseInt(key);
    const plugin = await loadPlugin(id)
    return {
      text: isSecure(plugin) ? `${name}*` : name,
      handler: () => void enableRepository(id),
    }
  }));

  actionSheetButtons.push({
    text: 'Cancel',
    role: 'cancel',
  });

  const actionSheet = await actionSheetController.create({
    header: 'Add repository',
    subHeader: 'Repositories with an * can do back-ups of your data.',
    buttons: actionSheetButtons,
  });
  await actionSheet.present();
}

function hasSecureRepository() {
  return !!repositories.value.map(repository => loadPlugin(repository.id)).find(async plugin => isSecure(await plugin));
}

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
