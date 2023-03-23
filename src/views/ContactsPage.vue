<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Contacts</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Contacts</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list>
        <template v-if="contacts.length > 0">
          <ion-list-header>
            <ion-label>
              Test category
            </ion-label>
          </ion-list-header>
          <ContactItem v-for="{ id } in contacts" :key="id" :id="id" router-direction="forward"
            :routerLink="`/contact/${id}`" detail="true">
          </ContactItem>
        </template>
        <div v-else id="container">
          <strong class="capitalize">Empty</strong>
          <p></p>
        </div>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { useContactsStore } from '@/store';
import { IonButtons, IonContent, IonHeader, IonList, IonMenuButton, IonPage, IonTitle, IonToolbar, IonLabel, IonListHeader, IonAvatar, IonItem } from '@ionic/vue';
import ContactItem from '@/components/ContactItem.vue'

const contacts = useContactsStore().contacts;
</script>

<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
