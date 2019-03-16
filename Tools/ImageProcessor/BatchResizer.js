// Standard usages:
// 1) node BatchResizer.js resize-missing --sourceFolder ../../../Others/Backgrounds/Original --targetFolder ../../../Others/Backgrounds/x256 --targetWidth 256
// 2) node BatchResizer.js resize-missing --sourceFolder ../../../Others/Backgrounds/Original --targetFolder ../../../Others/Backgrounds/x1920 --targetWidth 1920

const program = require('commander');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

program
	.command('resize-missing').description('For each image in sourceFolder, checks if match is found in targetFolder. If not, creates a resized version, then puts it into targetFolder.')
	.option('-sf, --sourceFolder', 'Folder with full-size versions of the images.')
	.option('-tf, --targetFolder', 'Folder where the resized images should be placed.')
	.option('-tw, --targetWidth', 'What width to resize the images to.')
	.action(async (sourceFolder, targetFolder, targetWidthStr) => {
		/* const { sourceFolder, targetFolder } = options;
		// console.assert(typeof source == 'string', 'sourceFolder must be a string');
		console.log(JSON.stringify(options));
		const targetWidth = parseInt(options.targetWidth); */
		const targetWidth = parseInt(targetWidthStr);

		const imageFileNames = fs.readdirSync(sourceFolder).filter(fileName => fileName.match(/\.(jpg|jpeg|png)$/));
		console.log(`Found ${imageFileNames.length} image files.`);

		for (const fileName of imageFileNames) {
			const sourceFilePath = path.join(sourceFolder, fileName);
			// const targetFilePath = path.join(targetFolder, fileName.replace(/\.([^.]+)$/, `_x${targetWidth}.$1`));
			const targetFilePath = path.join(targetFolder, fileName);
			if (fs.existsSync(targetFilePath)) {
				console.log(`File "${targetFilePath}" already exists, so skipping.`);
				continue;
			}

			console.log(`Resizing "${fileName}" to width ${targetWidth}.`); // from path "${sourceFilePath}" to "${targetFilePath}".`);
			await sharp(sourceFilePath).resize(targetWidth).toFile(targetFilePath);
		}
	});

// error on unknown commands
program.on('command:*', () => {
	console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
	process.exit(1);
});

program.parse(process.argv);
