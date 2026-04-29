const sharp = require('sharp')
const pngToIcoModule = require('png-to-ico')
const pngToIco = pngToIcoModule.default || pngToIcoModule
const fs = require('fs/promises')
const path = require('path')

const input = path.join(process.cwd(), 'public/images/brand/areaimmobiliare.png')
const outputDir = path.join(process.cwd(), 'public')

async function makePng(size, filename) {
  await sharp(input)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(path.join(outputDir, filename))
}

async function main() {
  await makePng(16, 'favicon-16x16.png')
  await makePng(32, 'favicon-32x32.png')
  await makePng(48, 'favicon-48x48.png')
  await makePng(180, 'apple-touch-icon.png')
  await makePng(512, 'icon.png')

  const icoBuffer = await pngToIco([
    path.join(outputDir, 'favicon-16x16.png'),
    path.join(outputDir, 'favicon-32x32.png'),
    path.join(outputDir, 'favicon-48x48.png'),
  ])

  await fs.writeFile(path.join(outputDir, 'favicon.ico'), icoBuffer)

  console.log('Favicon generate correttamente in /public')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
