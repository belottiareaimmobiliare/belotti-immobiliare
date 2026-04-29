const sharp = require('sharp')
const pngToIcoModule = require('png-to-ico')
const pngToIco = pngToIcoModule.default || pngToIcoModule
const fs = require('fs/promises')
const path = require('path')

const input = path.join(process.cwd(), 'public/images/brand/areaimmobiliare.png')
const outputDir = path.join(process.cwd(), 'public')

async function makeWhitePng(size, filename) {
  const alpha = await sharp(input)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .extractChannel('alpha')
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .joinChannel(alpha)
    .png()
    .toFile(path.join(outputDir, filename))
}

async function main() {
  await makeWhitePng(16, 'favicon-16x16.png')
  await makeWhitePng(32, 'favicon-32x32.png')
  await makeWhitePng(48, 'favicon-48x48.png')
  await makeWhitePng(180, 'apple-touch-icon.png')
  await makeWhitePng(512, 'icon.png')

  const icoBuffer = await pngToIco([
    path.join(outputDir, 'favicon-16x16.png'),
    path.join(outputDir, 'favicon-32x32.png'),
    path.join(outputDir, 'favicon-48x48.png'),
  ])

  await fs.writeFile(path.join(outputDir, 'favicon.ico'), icoBuffer)

  console.log('Favicon bianche generate correttamente in /public')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
