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

      <p>
        Dummy page; will have button to start camera, a QR code to be scanned, and a text box for entering links
        manually.
      </p>
      <p>
        <ion-text>
          {{ example }}
        </ion-text>
      </p>
      <p>
        <ContactItem :data="contact"></ContactItem>
      </p>
      <p>
        <button ion-button @click="go()">
          Import the example above
        </button>
      </p>

    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { useContactsStore } from '@/store';
import { IonButtons, IonContent, IonHeader, IonText, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { dummyContact } from '@/util/dummies';
import { Contact } from '@/types/contacts';
import ContactItem from '@/components/ContactItem.vue';

const router = useRouter(); // added const here as router needs to be injected which doesn't work after "await".
const contactStore = useContactsStore();
const example = ref('');
const contact = ref<Contact>();

const go = () => {
  contactStore.add(contact.value!);
  router.back();
};

dummyContact().then((c) => {
  contact.value = c;
  console.log(c);
  example.value = JSON.stringify(c);
});

</script>

<style scoped></style>
