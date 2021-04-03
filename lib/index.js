"use strict";
// const url = require('url')
const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");
// const dir = "/uploads/";

// replace dropbox download url for direct link
const dropBoxResultUrlRegularExpression = /www.dropbox.com/;
const dropBoxDownloadUrl = "dl.dropboxusercontent.com";

module.exports = {
  init(providerOptions) {
    // init provider
    const dbx = new Dropbox({
      accessToken: providerOptions.accessToken,
      fetch,
    });
    
    const defaultUploadDir = providerOptions.defaultUploadDir

    return {
      upload(file, customParams = {}) {
        console.log({customParams});

        const dir = file.path ? `/${file.path.split("/")[1]}/` : defaultUploadDir;
        // upload the file in the provider
        // console.log({ FILE_PASSED: file });
        return new Promise((resolve, reject) => {
          dbx
            .filesUpload({
              path: `${dir}${file.hash}${file.ext}`,
              contents: file.buffer,
            })
            .then(async (dropboxFile) => {
              // console.log({ dropboxFile });
              const dropboxShareFile = await dbx.sharingCreateSharedLinkWithSettings(
                {
                  path: dropboxFile.path_display,
                  // "/apps/jcms-strapi" +
                  // settings: {
                  // requested_visibility: "public",
                  // audience: "public",
                  // access: "viewer"
                  // }
                }
              );
              const provider_metadata = await dbx.filesGetMetadata({
                path: dropboxFile.path_display, // "/apps/jcms-strapi" +
                include_media_info: true,
                include_deleted: true,
                include_has_explicit_shared_members: false,
              });
              // console.log({ provider_metadata });

              file.provider_metadata = provider_metadata;
              file.public_id = dropboxFile.id.replace("id:", "");
              file.path = dropboxFile.path_display;
              file.url = dropboxShareFile.url
                .replace(dropBoxResultUrlRegularExpression, dropBoxDownloadUrl)
                .replace("?dl=0", "");
              // console.log({ dropboxShareFile });
              // return dropboxShareFile
              console.log({ file });
              return resolve();
            })
            .catch((err) => {
              reject(err);
            });
        });
      },
      delete(file) {
        // delete the file in the provider
        const dir = file.path ? `/${file.path.split("/")[1]}/` : defaultUploadDir;

        // console.log("DELETING");
        // console.log({ file });

        return new Promise((resolve, reject) => {
          dbx
            .filesDeleteV2({
              path: `${dir}${file.hash}${file.ext}`,
            })
            .then(() => resolve())
            // .catch(err => reject(err))
            .catch(() => resolve());
        });
      },
    };
  },
};

// 'use strict'
// const url = require('url')
// const { Dropbox } = require('dropbox')
// const fetch = require('node-fetch')

// // replace dropbox download url for direct link
// const dropBoxResultUrlRegularExpression = /www.dropbox.com/
// const dropBoxDownloadUrl = 'dl.dropboxusercontent.com'

// module.exports = {
// init(providerOptions) {
//     // init provider
//     const dbx = new Dropbox({ accessToken: providerOptions.accessToken, fetch })

//     return {
//       upload(file) {
//         // upload the file in the provider
//         return new Promise((resolve, reject) => {
//           dbx.filesUpload({
//             path: `/uploads/${file.hash}${file.ext}`,
//             contents: file.buffer
//           })
//             .then(dropboxFile => dbx.sharingCreateSharedLinkWithSettings({ path: dropboxFile.path_display }))
//             .then(sharedFile => {
//               const { protocol, hostname, pathname } = url.parse(sharedFile.url)
//               file.public_id = sharedFile.id
//               file.url = url.format({
//                 protocol,
//                 hostname: hostname.replace(dropBoxResultUrlRegularExpression, dropBoxDownloadUrl),
//                 pathname
//               })
//               return resolve()
//             })
//             .catch(err => {
//               reject(err)
//             })
//         })
//       },
//       delete(file) {
//         // delete the file in the provider
//         return new Promise((resolve, reject) => {
//           dbx.filesDeleteV2({ path: `/uploads/${file.hash}${file.ext}` })
//             .then(() => resolve())
//             .catch(err => reject(err))
//         })
//       }
//     }
// }
// }
