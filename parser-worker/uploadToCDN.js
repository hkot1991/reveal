const path = require("path");

const { Storage } = require("@google-cloud/storage");
const compressible = require("compressible");
const mime = require("mime-types");
const recursiveReaddir = require("recursive-readdir");

const { getWorkerCDNFolderPath, cdnBuildOutputPath } = require("./buildUtils");

function getRelativeFilesFromDirectory(directoryPath) {
  const numSegments = directoryPath.split(path.sep).length;

  return recursiveReaddir(directoryPath).then((files) =>
    files.map((absoluteFilePath) => {
      const filePathSplit = absoluteFilePath.split(path.sep);

      return filePathSplit
        .slice(numSegments, filePathSplit.length)
        .join(path.sep);
    })
  );
}

/*
 * you're not supposed to run the script manually
 * to upload things you just click "run workflow" button here https://github.com/cognitedata/reveal/actions/workflows/upload-worker.yml 
*/

(async function upload() {
  const bucketName = "apps-cdn-bucket-cognitedata-production";
  const gcsPath = getWorkerCDNFolderPath();

  const buildPath = path.resolve(path.join(".", cdnBuildOutputPath));

  console.log(`Using ${buildPath} as a build source ...`);

  const fileNames = await getRelativeFilesFromDirectory(buildPath);

  const storage = new Storage({
    credentials: JSON.parse(process.env.APPS_CDN_SERVICE_ACCOUNT_CREDENTIALS),
  });
  const bucket = storage.bucket(bucketName);

  console.log(
    `Uploading ${fileNames.length} files to ${bucketName}/${gcsPath} ... \n`,
    JSON.stringify(fileNames, null, 2)
  );
  const startMillis = Date.now();

  const promises = fileNames.map(async (fileName) => {
    const sourcePath = path.join(buildPath, fileName);
    const destinationPath = path.join(gcsPath, fileName);
    const mimeType = mime.lookup(sourcePath);
    const gzip = compressible(mimeType || "");
    console.log(`Uploading ${fileName} to ${bucketName}/${destinationPath}`, {
      gzip,
    });

    const file = bucket.file(destinationPath);
    const [doesFileExist] = await file.exists();

    if (doesFileExist) {
      console.log(
        `Skipping upload since the file ${destinationPath} already exists`
      );
      return Promise.resolve();
    }

    return bucket.upload(sourcePath, {
      destination: destinationPath,
      resumable: false,
      gzip,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });
  });

  try {
    await Promise.all(promises);
    console.log(`... all done after ${Date.now() - startMillis}ms`);
  } catch (e) {
    console.error("Unable to upload all files");
    throw e;
  }
})();
