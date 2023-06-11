'use strict';

const stream = require('stream');
const readline = require('readline');
const AWS = require('aws-sdk');
const ytdl = require("ytdl-core");

function fetchAndUploadYoutubeVideo(url) {
  return new Promise((resolve, reject) => {
    const passtrough = new stream.PassThrough();
    const upload = new AWS.S3.ManagedUpload({
      params: {
        Bucket: 'nermin-krabi-bucket',
        Key: "new-video3.mp4",
        ACL: "public-read",
        Body: passtrough
      },
      partSize: 1024 * 1024 * 64 // in bytes
    });

    upload.on('httpUploadProgress', (progress) => {
      console.log(`copying video ...`, progress);
    });
    upload.send((err) => {
      if (err) {
      reject(false);
      } else {
      resolve(true);
      }
    });
    
    let starttime;
    const video = ytdl(url, { filter: format => format.container === 'mp4' });

    video.once('response', () => {
      starttime = Date.now();
    });

    video.on('progress', (chunkLength, downloaded, total) => {
      const percent = downloaded / total;
      const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
      const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
      process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
      process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
      process.stdout.write(`, estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `);
      readline.moveCursor(process.stdout, 0, -1);
    });
    video.on('end', () => {
      process.stdout.write('\n\n');
    });
      
    video.pipe(passtrough);

    video.on('error', err => {
      console.log("EN FEIL HAR OPPSTATT");
      console.log(err);
          reject(false);
    });

})};

module.exports.hello = async (event) => {
  const videoUrl = 'https://www.youtube.com/shorts/3GrKa9-U9Rs';

  await fetchAndUploadYoutubeVideo(videoUrl);

  return { message: 'Video update successfully!', event };
};
