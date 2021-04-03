# strapi-provider-upload-dropbox-v2

Dropbox upload provider for Strapi
forked from [phanluanint/strapi-provider-upload-dropbox](https://github.com/phanluanint/strapi-provider-upload-dropbox)

## Compatibility
Tested on Strapi v3.5.4 — Community Edition

## Installation
```
npm i github:jasenmichael/strapi-provider-upload-dropbox-v2
````
or 
```
yarn add github:jasenmichael/strapi-provider-upload-dropbox-v2
````

Go to https://www.dropbox.com/developers/apps and create an app, then goto permissions tab and check everything except contact.write, then goto settings tab and generate an access token. NOTE: you must generate access toeken AFTER setting permissions.

Create or edit the file at `./config/plugins.js`, configure it using your Dropbox App's Access token, and your default upload folder.

```
module.exports = ({ env }) => ({
    upload: {
      provider: 'dropbox',
      providerOptions: {
        accessToken: env('DROPBOX_TOKEN'),
        // defaultUploadDir requires "/" at beginning and end, only single directory
        defaultUploadDir: "/uploads/"
      },
    },
  });
```

## License
The MIT License (MIT)

Copyright (c) 2021 [jasenmichael](https://github.com/jasenmichael)
