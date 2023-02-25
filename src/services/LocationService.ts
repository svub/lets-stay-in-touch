import { Geolocation, Position } from '@capacitor/geolocation';

export default {
    async geoCurrentPosition() {
        const coordinates = await Geolocation.getCurrentPosition();

        console.log('Current position:', JSON.stringify(coordinates, null, 2));
        return coordinates;
    },
    async watchPosition() {
        const positionOptions = {
            enableHighAccuracy: true,
        };
        const wait = Geolocation.watchPosition(positionOptions, (position, err) => {
            if (err) {
                console.error('Error watching position', err);
                return;
            }
            console.log('Current position:', JSON.stringify(position, null, 2));
        });
    }
}

// export default {
//     methods:{
//     async getCurrentPosition() {
//         const coordinates = await Geolocation.getCurrentPosition();
//         console.log('Current', coordinates);
//     },
//     watchPosition() {
//         const wait = Geolocation.watchPosition({}, (position, err) => {
//         })
//     }
//     }
// }