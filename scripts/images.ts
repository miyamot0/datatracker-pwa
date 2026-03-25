import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';

(async () => {
  await imagemin(['public/docs/*.{png,jpg,jpeg}'], {
    destination: 'public/docs2',
    plugins: [imageminWebp({ quality: 75 })],
  });
  console.log('Images optimized and converted!');
})();
