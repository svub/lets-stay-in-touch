<template>
  <ion-app>
    <ion-split-pane content-id="main-content">
      <ion-menu content-id="main-content" type="overlay">
        <ion-content>
          <ion-list id="pages-list">
            <ion-list-header>Let's stay in touch</ion-list-header>
            <ion-note>github.com/svub/lets-stay-in-touch</ion-note>
            <contact-location :position="coordinates"></contact-location>
            <ion-menu-toggle :auto-hide="false" v-for="(page, index) in pages" :key="index">
              <ion-item router-direction="root" :router-link="page.path" lines="none" :detail="false" class="hydrated"
                :class="{ selected: page.path === $route.path }">
                <ion-icon slot="start" :ios="page.iosIcon" :md="page.mdIcon"></ion-icon>
                <ion-label>{{ page.title }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>

          <ion-list id="groups-list">
            <ion-list-header>Groups</ion-list-header>

            <ion-item v-for="(label, index) in groups" lines="none" :key="index">
              <ion-icon slot="start" :ios="bookmarkOutline" :md="bookmarkSharp"></ion-icon>
              <ion-label>{{ label }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      <ion-router-outlet id="main-content"></ion-router-outlet>
    </ion-split-pane>
  </ion-app>
</template>

<script lang="ts" setup>
import { IonApp, IonContent, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonMenu, IonMenuToggle, IonNote, IonRouterOutlet, IonSplitPane } from '@ionic/vue';
import { addCircleOutline, addCircleSharp, bookmarkOutline, bookmarkSharp, accessibilityOutline, accessibilitySharp } from 'ionicons/icons';

const pages = [
  {
    title: 'Contacts',
    path: '/contacts',
    iosIcon: accessibilityOutline, // docs don't mention ios and md properties, but could be automated if it's always outline and sharp for iOS and Android
    mdIcon: accessibilitySharp,
  },
  {
    title: 'Add',
    path: '/add',
    iosIcon: addCircleOutline,
    mdIcon: addCircleSharp,
  },
];

const groups = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];

</script>

<script lang="ts">
import LocationService from '@/services/LocationService';
import ContactLocation from "./components/ContactLocation.vue";

export default {
  data() {
    return {
      coordinates: {},
    };
  },
  components: {
    ContactLocation,
  },
  methods: {
    async getCurrentPosition() {
      try {
        const response = await LocationService.geoCurrentPosition();
        // JSON responses are automatically parsed.
        this.coordinates = response;
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style>
[routerlink] {
  cursor: pointer;
}
</style>

<style scoped>
ion-menu ion-content {
  --background: var(--ion-item-background, var(--ion-background-color, #fff));
}

ion-menu ion-item {
  cursor: pointer;
}

ion-menu.md ion-content {
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 20px;
  --padding-bottom: 20px;
}

ion-menu.md ion-list {
  padding: 20px 0;
}

ion-menu.md ion-note {
  margin-bottom: 30px;
}

ion-menu.md ion-list-header,
ion-menu.md ion-note {
  padding-left: 10px;
}

ion-menu.md ion-list#pages-list {
  border-bottom: 1px solid var(--ion-color-step-150, #d7d8da);
}

ion-menu.md ion-list#pages-list ion-list-header {
  font-size: 22px;
  font-weight: 600;

  min-height: 20px;
}

ion-menu.md ion-list#groups-list ion-list-header {
  font-size: 16px;

  margin-bottom: 18px;

  color: #757575;

  min-height: 26px;
}

ion-menu.md ion-item {
  --padding-start: 10px;
  --padding-end: 10px;
  border-radius: 4px;
}

ion-menu.md ion-item.selected {
  --background: rgba(var(--ion-color-primary-rgb), 0.14);
}

ion-menu.md ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}

ion-menu.md ion-item ion-icon {
  color: #616e7e;
}

ion-menu.md ion-item ion-label {
  font-weight: 500;
}

ion-menu.ios ion-content {
  --padding-bottom: 20px;
}

ion-menu.ios ion-list {
  padding: 20px 0 0 0;
}

ion-menu.ios ion-note {
  line-height: 24px;
  margin-bottom: 20px;
}

ion-menu.ios ion-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --min-height: 50px;
}

ion-menu.ios ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}

ion-menu.ios ion-item ion-icon {
  font-size: 24px;
  color: #73849a;
}

ion-menu.ios ion-list#labels-list ion-list-header {
  margin-bottom: 8px;
}

ion-menu.ios ion-list-header,
ion-menu.ios ion-note {
  padding-left: 16px;
  padding-right: 16px;
}

ion-menu.ios ion-note {
  margin-bottom: 8px;
}

ion-note {
  display: inline-block;
  font-size: 16px;

  color: var(--ion-color-medium-shade);
}

ion-item.selected {
  --color: var(--ion-color-primary);
}
</style>
