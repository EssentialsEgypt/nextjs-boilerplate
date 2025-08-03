const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createFullBackup() {
  return new Promise((resolve, reject) => {
    const outputFileName = `complete-project-backup-${new Date().toISOString().slice(0,10)}.zip`;
    const outputPath = path.resolve(__dirname, '..', outputFileName);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => {
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Include all files and folders recursively from project root
    // Exclude .git directory to avoid large git history
    archive.glob('**/*', {
      dot: true,
      ignore: ['.git/**', 'node_modules/**']
    });

    archive.finalize();
  });
}

if (require.main === module) {
  createFullBackup()
    .then((filePath) => {
      console.log('Backup created at:', filePath);
    })
    .catch((err) => {
      console.error('Error creating backup:', err);
    });
}

module.exports = { createFullBackup };
