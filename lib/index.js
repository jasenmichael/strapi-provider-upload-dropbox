"use strict";
const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");

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
    const defaultUploadDir = providerOptions.defaultUploadDir;

    return {
      upload(file) {
        const dir = file.path ? `/${file.path.split("/")[1]}/` : defaultUploadDir;
        return new Promise((resolve, reject) => {
          dbx
            .filesUpload({
              path: `${dir}${file.hash}${file.ext}`,
              contents: file.buffer,
            })
            .then(async (dropboxFile) => {
              const dropboxShareFile = await dbx.sharingCreateSharedLinkWithSettings(
                {
                  path: dropboxFile.path_display,
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

              file.provider_metadata = provider_metadata;
              file.public_id = dropboxFile.id.replace("id:", "");
              file.path = dropboxFile.path_display;
              file.url = dropboxShareFile.url
                .replace(dropBoxResultUrlRegularExpression, dropBoxDownloadUrl)
                .replace("?dl=0", "");
              return resolve();
            })
            .catch((err) => {
              reject(err);
            });
        });
      },
      async delete(file) {
        try {
          await dbx.filesDeleteV2({
            path: file.path || file.provider_metadata.path_display,
          });
          return;
        } catch (error) {
          console.log(error);
          return error;
        }
      },
    };
  },
};
