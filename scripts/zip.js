import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
const outPath = path.resolve(__dirname, `../public/update-${pkg.version}.zip`);

async function createZip() {
    const zip = new JSZip();

    function addDirToZip(dirPath, currentZip) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                addDirToZip(fullPath, currentZip.folder(file));
            } else {
                currentZip.file(file, fs.readFileSync(fullPath));
            }
        }
    }

    addDirToZip(distPath, zip);

    const content = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    });

    // Ensure public dir exists
    const publicDir = path.dirname(outPath);
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // Clean old zips
    const oldFiles = fs.readdirSync(publicDir);
    for (const f of oldFiles) {
        if (f.startsWith('update-') && f.endsWith('.zip')) {
            fs.unlinkSync(path.join(publicDir, f));
        }
    }

    fs.writeFileSync(outPath, content);
    console.log(`Successfully created ${outPath}`);
}

createZip().catch(console.error);
