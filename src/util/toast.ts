import { toastController } from '@ionic/vue';

const position: 'top' | 'middle' | 'bottom' = 'bottom';
const duration = 5000;

export async function toast( message: string, color = "primary") {
  const toast = await toastController.create({ message, duration, position, color });
  await toast.present();
}

export async function toastWarning( message: string) {
  await toast(message, "warning");
}