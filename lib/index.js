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
      async upload(file) {
        if (process.env.NODE_ENV === "development") {
          console.log({ UPLOAD___FILE: file });
        }

        return new Promise(async (resolve, reject) => {
          /* 
          1: GET PATH
          2: SET PATH
          3: UPLOAD FILE
          4: GET SHARE URL
          5: GET METADATA
          */

          // GET PATH for existing files - check if file already exist in strapi
          // const files = await strapi.plugins.upload.services.upload[
          //   "fetchAll"
          // ](); //.then((files) => {
          // GET PATH -- END

          // SET PATH
          const dir = file.path
            ? `/${file.path.split("/")[1]}/`
            : defaultUploadDir;
          //  path without hash, causes issues when - cropping and creating duplicate, or creating file with same name
          // const path = `${dir}${file.name.replace(file.ext, "")}${file.ext}`;
          const path = `${dir}${file.hash}${file.ext}`;
          // SET PATH -- END

          // UPLOAD FILE -- dropboxFile = dbx.filesUpload
          // TODO: add error if exist on db, and reject. Just remove mode??...
          let dropboxFile;
          try {
            dropboxFile = await dbx.filesUpload({
              path,
              contents: file.buffer,
              mode: { ".tag": "overwrite" },
              autorename: true,
            });
          } catch (error) {
            console.log({ DROPBOX_FILE_ERROR__: JSON.stringify(error) });
            reject(error);
          }
          if (process.env.NODE_ENV === "development") {
            console.log({ DROPBOX_FILE__: dropboxFile });
          }
          // UPLOAD FILE -- END

          // GET SHARE URL -- dropboxShareFile = dbx.sharingCreateSharedLinkWithSettings
          let dropboxShareFile;
          try {
            dropboxShareFile = await dbx.sharingCreateSharedLinkWithSettings({
              path: dropboxFile.path_display,
              // settings: { requested_visibility: "public", audience: "public", access: "viewer" }
            });
          } catch (error) {
            if (error.error.error.shared_link_already_exists) {
              const url =
                error.error.error.shared_link_already_exists.metadata.url;
              dropboxShareFile = { url };
            } else {
              console.log({
                DROPBOX_SHARE_FILE_ERROR__:
                  error.error.error.shared_link_already_exists.metadata.url,
              });
              reject(error);
            }
          }
          if (process.env.NODE_ENV === "development") {
            console.log({ DROPBOX_SHARE_FILE__: dropboxShareFile });
          }
          // GET SHARE URL

          // GET METADATA -- provider_metadata = dbx.filesGetMetadata
          let provider_metadata;
          try {
            provider_metadata = await dbx.filesGetMetadata({
              path: dropboxFile.path_display, // "/apps/jcms-strapi" +
              include_media_info: true,
              include_deleted: true,
              include_has_explicit_shared_members: false,
            });
          } catch (error) {
            console.log({
              DROPBOX_METADATA_ERROR__: JSON.stringify(error),
            });
            reject(error);
          }
          if (process.env.NODE_ENV === "development") {
            console.log({ DROPBOX_METADATA__: provider_metadata });
          }
          // GET METADATA

          file.provider_metadata = provider_metadata;
          file.public_id = dropboxFile.id.replace("id:", "");
          file.path = dropboxFile.path_display;
          file.url = dropboxShareFile.url
            .replace(dropBoxResultUrlRegularExpression, dropBoxDownloadUrl)
            .replace("?dl=0", "");
          return resolve(file);
        });
      },
      delete(file) {
        if (process.env.NODE_ENV === "development") {
          console.log({ DELETE_FILE: file });
        }
        return new Promise(async (resolve, reject) => {
          try {
            await dbx.filesDeleteV2({
              path: file.path || file.provider_metadata.path_display,
            });
            resolve();
          } catch (error) {
            console.log(error);
            // reject(err);
            resolve();
          }
        });
      },
    };
  },
};
