const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');

async function createFullBackup() {
  return new Promise((resolve, reject) => {
    const transferUrl = process.env.TRANSFER_URL || 'https://transfer.sh';
    const timestamp = new Date().toISOString().slice(0, 10);
    const outputFileName = `complete-project-backup-${timestamp}.zip`;
    const outputPath = path.resolve(__dirname, '..', outputFileName);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ Backup created: ${outputFileName} (${archive.pointer()} bytes)`);

      // Upload to transfer.sh or configured URL
      exec(`curl --upload-file "${outputPath}" ${transferUrl}/${outputFileName}`, (err, stdout, stderr) => {
        if (err) {
          console.error('❌ Upload failed:', err);
          reject(err);
        } else {
          console.log('✅ Download link:', stdout.trim());
          resolve(stdout.trim());
        }
      });
    });

    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    // Include all files and folders recursively from project root
    // Exclude .git and node_modules directories to avoid large files
    archive.glob('**/*', {
      dot: true,
      ignore: ['.git/**', 'node_modules/**']
    });

    archive.finalize();
  });
}

if (require.main === module) {
  createFullBackup()
    .then((downloadLink) => {
      console.log('Backup and upload completed successfully.');
    })
    .catch((err) => {
      console.error('Error during backup or upload:', err);
    });
}

module.exports = { createFullBackup };
