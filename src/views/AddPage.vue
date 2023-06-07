<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Add new contact</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Add new contact</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Add contact</ion-card-title>
          <ion-card-subtitle>Via pasting an invite or scanning a QR code</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <!-- TODO: switch to modern syntax in entire project https://ionicframework.com/docs/api/input#using-the-modern-syntax -->
          <ion-label>Paste the invitation code here</ion-label>
          <ion-input :clear-input="true" placeholder="Paste invitation"
            @ion-change="tryParsing($event.target.value as string)"></ion-input>

          <p>TODO have button to start camera to scan a QR code</p>

          <p v-if="parsingError" class="error">{{ parsingError }}</p>
          <p v-if="contact">
            <ContactItem :data="contact"></ContactItem>
            <ion-button @click="go(contact!)">
              Import this contact
            </ion-button>
          </p>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Share contact</ion-card-title>
          <ion-card-subtitle>Via sending your invite to a friend letting them scan your QR code</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-label>Share this invitation</ion-label>
          <ion-textarea @click="copyInvitation()">{{ myData }}</ion-textarea>
          <p>TODO show a QR code to be scanned</p>
          <ContactItem :data="meStore.contact"></ContactItem>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Add dummy</ion-card-title>
          <ion-card-subtitle>Automatically generated contact dummies for testing.</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ion-text>
            {{ dummyJson }}
          </ion-text>
          <ContactItem :data="dummy"></ContactItem>
          <ion-button @click="go(dummy!)">
            Import this dummy contact
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { useContactsStore, useMeStore } from '@/store';
import { IonButtons, IonContent, IonHeader, IonText, IonMenuButton, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonButton, IonCardHeader, IonCardTitle, IonCardSubtitle, IonInput, IonTextarea, IonLabel } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import useClipboard from 'vue-clipboard3'
import { dummyContact } from '@/util/dummies';
import { Contact } from '@/types/contacts';
import ContactItem from '@/components/ContactItem.vue';
import { stringFromBase64, stringToBase64 } from '@/util/crypto';
import { toast, toastWarning } from '@/util/toast';
import { pushBackup } from '@/util/storage';
import { delay } from 'lodash';

const router = useRouter(); // added const here as router needs to be injected which doesn't work after "await".
const contactStore = useContactsStore();
const meStore = useMeStore();
const dummyJson = ref('');
const contact = ref<Contact>();
const dummy = ref<Contact>();
const parsingError = ref<string>("");
const myData = stringToBase64(JSON.stringify(meStore.contact));

function tryParsing(data?: string) {
  console.log(data);
  try {
    parsingError.value = '';
    contact.value = data ? JSON.parse(stringFromBase64(data)) : undefined;
  } catch (e) {
    parsingError.value = '' + e;
    contact.value = undefined;
  }
}

async function copyInvitation() {
  try {
    await useClipboard().toClipboard(myData);
    toast('Invitation copied');
  } catch (e) {
    console.error(e);
    toastWarning('Copying invitation failed, please copy manually.');
  }
}

const go = (contact: Contact) => {
  contactStore.add(contact);
  delay(pushBackup, 100); // persist new contact
  router.back();
};

dummyContact().then((c) => {
  dummy.value = c;
  dummyJson.value = JSON.stringify(c);
});

</script>

<style scoped></style>
