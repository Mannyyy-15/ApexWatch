import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
const publicDir = path.resolve(__dirname, '../public');
const outPublicZip = path.join(publicDir, `update-${pkg.version}.zip`);
const outDistZip = path.join(distPath, `update-${pkg.version}.zip`);

async function createZip() {
    if (!fs.existsSync(distPath)) {
        console.warn('dist folder does not exist yet. Skipping zip creation.');
        return;
    }

    const zip = new JSZip();

    function addDirToZip(dirPath, currentZip) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            if (file.endsWith('.apk') || file.endsWith('.zip')) continue;
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
    
    // Capgo requires capacitor.config.json in the root of the zip
    const capConfigPath = path.resolve(__dirname, '../capacitor.config.json');
    if (fs.existsSync(capConfigPath)) {
        zip.file('capacitor.config.json', fs.readFileSync(capConfigPath));
    }

    const content = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    });

    // Ensure public dir exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // Clean old zips in public
    const oldPublicFiles = fs.readdirSync(publicDir);
    for (const f of oldPublicFiles) {
        if (f.startsWith('update-') && f.endsWith('.zip')) {
            try { fs.unlinkSync(path.join(publicDir, f)); } catch (e) {}
        }
    }

    // Write zip to public/ and dist/
    fs.writeFileSync(outPublicZip, content);
    try { fs.writeFileSync(outDistZip, content); } catch (e) {}
    console.log(`Successfully created ${outPublicZip} and ${outDistZip}`);

    // Automatically update version.json in both public and dist
    const versionData = JSON.stringify({ 
        latestVersion: pkg.version, 
        updatedAt: new Date().toISOString(),
        zipUrl: `https://apex-watch.vercel.app/update-${pkg.version}.zip`,
        apkUrl: `https://github.com/Mannyyy-15/ApexWatch/releases/download/v${pkg.version}/ApexWatch.apk`
    }, null, 2);

    fs.writeFileSync(path.join(publicDir, 'version.json'), versionData);
    if (fs.existsSync(distPath)) {
        fs.writeFileSync(path.join(distPath, 'version.json'), versionData);
    }
    console.log(`Updated version.json to v${pkg.version} in public and dist`);
}

createZip().catch(console.error);

