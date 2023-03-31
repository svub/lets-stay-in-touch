<template>
  <ion-item>
    <ion-avatar slot="start">
      <img :src="contact.profile.avatar || 'assets/icon/icon.png'" />
    </ion-avatar>
    <ion-label>
      <h2> {{
        contact.profile.label ? `${contact.profile.label} (${contact.profile.name})` : contact.profile.name
      }}</h2>
      <h3> {{ contact.profile.location.label }}</h3>
      <p>
        <a v-for="url in contact.profile.urls" :href="url.url" :key="url.url">
          {{ url.label }}
        </a>
      </p>
      <p v-for="data in contact.profile.data" :key="data.key + data.value">
        {{ data.key }}: {{ data.value }}
      </p>
    </ion-label>
  </ion-item>
</template>

<script lang="ts" setup>
import { IonLabel, IonAvatar, IonItem } from '@ionic/vue';
import { useContactsStore } from '@/store';
import { Contact, LocationPrecision } from '@/types/contacts';
import { computed } from 'vue';

const props = defineProps<{
  id?: string,
  data?: Contact,
}>();

const notFound = {
  id: "",
  pub: { "alg": "RSA-OAEP-256", "e": "AQAB", "ext": true, "key_ops": [], "kty": "RSA", "n": "" },
  secret: 0,
  profile: {
    avatar: "", // show error image
    location: {
      label: "",
      precision: LocationPrecision.exact,
    },
    name: `User ${props.id} not found`,
    data: [],
    urls: [],
    sources: [],
    version: 0,
  },
} as Contact;

// TODO: what's the elegant way of saying "either ID or contract is required"?
const getContact = () => props.data ? props.data : (props.id ? useContactsStore().get(props.id) : null);
const contact = computed(() => getContact() || notFound);

</script>