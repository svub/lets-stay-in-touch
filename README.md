# Let's stay in touch
> A decentralized, social address book where you own your data.

## Simple and decentralized
The goal is to create an address book that always stays up-to-date, where you can push updates on your data to your friends, but the data is encrypted and not held by a centralized entity. 

At the same time, all that should be super easy to use and even easier to setup.

So, the approach is to create a web app, that enables super easy onboarding by simply by showing a QR code to a new friend. The friend opens a website that hosts the Let's stay in touch address book PWA. Once it's open, the PWA creates a key pair and now the two friends can exchange keys. 

From that moment on, they can update each other in a secure and decentralized manner. As all data exchanges are encrypted, any publicly available data storage can be used, from IPFS but also any personal cloud provider as Google Drive and Dropbox. The webapp will support the majority and multiple can be used at the same time to back-up data and create redundancy. Every time you update data and share it with your friends, new storage locations will be shared as well, so if one fails, your friend can still get your updates.

But you're always in control! For each friend, a new key pair is created. This allows you to push your data updates to each friend individually which means you are in control to decide for each of your friends which updates and degree of detail they will see - and that you can always change your mind because you have control over what each contact can see separately or by creating groups of contacts.

## Contributing

### Setup Dependencies

* Fork and clone the repository
* Install Node.js 19.6.0
    * Optionally via installing [NVM](https://github.com/nvm-sh/nvm) and running `nvm use`
* Install dependencies and run
```
yarn
corepack enable && corepack prepare yarn@stable --activate && yarn set version 3.4.1 \
yarn dlx @ionic/cli@latest native-run cordova-res
```

### Run
```
ionic serve
```

* Open http://localhost:8100

### Debugging for Web

* [Debugging for Web](https://marketplace.visualstudio.com/items?itemName=ionic.ionic#debugging-for-web)
    * Click Visual Studio Code Extension icon > Debug > Web

Note: Encountered issues, see https://github.com/ionic-team/vscode-extension/issues/90

### Developer Experience

#### Visual Studio Code

* Install extensions from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com) recommended in ./.vscode/extensions.json

### Troubleshooting

* If you get Visual Studio Code error `/bin/sh: 1: npx: not found` or `/bin/sh: 1: npm: not found` then you need to restart Visual Studio code after installing Node.js

### References

* Ionic
    * https://ionicframework.com/docs/vue/your-first-app
* Vue
    * Apps
        * TODO app https://github.com/mdn/todo-vue
    * Guides
        * Mozilla Vue guide https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Vue_getting_started
    * Geolocation
        * https://ionicframework.com/docs/native/geolocation
        * https://www.section.io/engineering-education/how-to-interact-with-an-api-from-a-vuejs-application/
        * [ ] TODO - configure iOS permissions - https://ionicframework.com/docs/native/geolocation#ios
        * [ ] TODO - configure Android permissions - https://ionicframework.com/docs/native/geolocation#android