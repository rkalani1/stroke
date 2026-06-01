import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const evdBuffer = fs.readFileSync('assets/evd_quick_reference_source.png');
  const icpBuffer = fs.readFileSync('assets/icp_crisis_source.png');
  
  const evdBase64 = `data:image/png;base64,${evdBuffer.toString('base64')}`;
  const icpBase64 = `data:image/png;base64,${icpBuffer.toString('base64')}`;
  
  await page.setContent(`
    <html>
      <body style="margin: 0; padding: 0; background: white;">
        <canvas id="evdCanvas"></canvas>
        <canvas id="icpCanvas"></canvas>
        <canvas id="snaccCanvas"></canvas>
      </body>
    </html>
  `);
  
  await page.evaluate(({ evdBase64, icpBase64 }) => {
    return new Promise(resolve => {
      let evdLoaded = false;
      let icpLoaded = false;
      
      const checkDone = () => {
        if (evdLoaded && icpLoaded) resolve();
      };
      
      const imgEvd = new Image();
      imgEvd.src = evdBase64;
      imgEvd.onload = () => {
        // Crop EVD cylinder photo: x: 10, y: 52, w: 270, h: 290
        {
          const canvas = document.getElementById('evdCanvas');
          const ctx = canvas.getContext('2d');
          const cropX = 10;
          const cropY = 52;
          const cropW = 270;
          const cropH = 290;
          canvas.width = cropW;
          canvas.height = cropH;
          ctx.drawImage(imgEvd, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        }
        
        // Crop SNACC logo: x: 285, y: 285, w: 245, h: 60
        {
          const canvas = document.getElementById('snaccCanvas');
          const ctx = canvas.getContext('2d');
          const cropX = 285;
          const cropY = 285;
          const cropW = 245;
          const cropH = 60;
          canvas.width = cropW;
          canvas.height = cropH;
          ctx.drawImage(imgEvd, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        }
        
        evdLoaded = true;
        checkDone();
      };
      
      const imgIcp = new Image();
      imgIcp.src = icpBase64;
      imgIcp.onload = () => {
        // Crop ICP: Waveform graph: x: 5, y: 410, w: 569, h: 180
        const canvas = document.getElementById('icpCanvas');
        const ctx = canvas.getContext('2d');
        const cropX = 5;
        const cropY = 410;
        const cropW = 569;
        const cropH = 180;
        canvas.width = cropW;
        canvas.height = cropH;
        ctx.drawImage(imgIcp, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        icpLoaded = true;
        checkDone();
      };
    });
  }, { evdBase64, icpBase64 });
  
  // Extract data URLs from canvas elements
  const evdCroppedBase64 = await page.$eval('#evdCanvas', canvas => canvas.toDataURL('image/png'));
  const icpCroppedBase64 = await page.$eval('#icpCanvas', canvas => canvas.toDataURL('image/png'));
  const snaccCroppedBase64 = await page.$eval('#snaccCanvas', canvas => canvas.toDataURL('image/png'));
  
  // Write files
  const evdBase64Data = evdCroppedBase64.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('assets/evd_photo_cropped.png', Buffer.from(evdBase64Data, 'base64'));
  
  const icpBase64Data = icpCroppedBase64.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('assets/icp_waveform_cropped.png', Buffer.from(icpBase64Data, 'base64'));
  
  const snaccBase64Data = snaccCroppedBase64.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('assets/snacc_logo_cropped.png', Buffer.from(snaccBase64Data, 'base64'));
  
  console.log('Successfully cropped assets (including SNACC logo) and saved to assets/');
  await browser.close();
}

main().catch(console.error);
