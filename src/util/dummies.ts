import { Contact, ContactDataItem, ContactLocation, ContactUrlItem, LocationPrecision } from '@/types/contacts';
import { address, createKeyPair, exportKey } from '@/util/crypto';

const dummyLocations: ContactLocation[] = [{
  label: 'Berlin, Germany',
  lat: 52.52,
  lng: 13.405,
  precision: LocationPrecision.city,
}, {
  label: 'Sydney, Australia',
  lat: -33.869,
  lng: 151.211,
  precision: LocationPrecision.city,
}];
export function dummyLocation(index = Math.floor(Math.random() * dummyLocations.length)) {
  return dummyLocations[index];
}

const dummyNames = ['Paul', 'Peter', 'Hans', 'Greta', 'Frieda', 'Frauke'];
export function dummyName(index = Math.floor(Math.random() * dummyNames.length)) {
  return dummyNames[index];
}

export async function customDummyContact(name: string, location: ContactLocation, urls: ContactUrlItem[] = [], data: ContactDataItem[] = []): Promise<Contact> {
  const pub = (await createKeyPair()).publicKey;
  const id = await address(pub);

  return {
    id,
    pub: await exportKey(pub),
    profile: {
      avatar: '',
      location,
      name,
    },
    urls,
    data,
    sources: [],
  };
}

export async function dummyContact(): Promise<Contact> {
  const location = dummyLocation();
  const name = `${dummyName()} ${dummyName()}`;
  const urls = [{
    url: `https://wikipedia.org/wiki/${name}`,
    label: 'Wikipedia',
  }];
  return customDummyContact(name, location, urls);
}

export async function getPeter() {
  const urls = [{
    label: 'WhatsApp',
    url: 'whatsapp://@petergriffin',
  }];
  const data = [{
    key: 'custom field',
    value: 'custom value',
  }]
  return customDummyContact('Peter Griffin', dummyLocations[0], urls, data);
}
