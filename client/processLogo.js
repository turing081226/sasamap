import { Jimp } from 'jimp';

async function processLogo() {
  try {
    const image = await Jimp.read('src/assets/logo.png');
    image.autocrop({ tolerance: 0.05 });
    
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    const size = Math.max(w, h);
    
    const background = new Jimp({ width: size, height: size, color: 0x00000000 });
    
    const x = Math.floor((size - w) / 2);
    const y = Math.floor((size - h) / 2);
    background.composite(image, x, y);
    
    await background.write('public/favicon.png');
    console.log('Processed successfully! Size:', size, 'x', size);
  } catch (err) {
    console.error('Error:', err);
  }
}

processLogo();
