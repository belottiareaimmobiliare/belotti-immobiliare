const sharp = require('sharp')
const pngToIcoModule = require('png-to-ico')
const pngToIco = pngToIcoModule.default || pngToIcoModule
const fs = require('fs/promises')
const path = require('path')

const input = path.join(process.cwd(), 'public/images/brand/areaimmobiliare.png')
const outputDir = path.join(process.cwd(), 'public')
const brandDir = path.join(process.cwd(), 'public/brand')

async function prepareSource() {
  await fs.mkdir(brandDir, { recursive: true })

  const meta = await sharp(input).metadata()

  if (!meta.width || !meta.height) {
    throw new Error('Impossibile leggere le dimensioni del logo sorgente.')
  }

  const width = Math.floor(meta.width)
  const height = Math.floor(meta.height)

  console.log(`Logo sorgente: ${width}x${height}`)

  let cropHeight = Math.floor(height * 0.68)
  if (cropHeight < 1) cropHeight = 1
  if (cropHeight > height) cropHeight = height

  console.log(`Crop alto simulato via resize cover: ${width}x${cropHeight}`)

  const sourcePath = path.join(brandDir, 'favicon-source.png')

  await sharp(input)
    .rotate()
    .resize({
      width: width,
      height: cropHeight,
      fit: 'cover',
      position: 'north',
      withoutEnlargement: true,
    })
    .trim()
    .extend({
      top: 40,
      bottom: 40,
      left: 40,
      right: 40,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(sourcePath)

  return sourcePath
}

async function makePng(sourcePath, size, filename) {
  await sharp(sourcePath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(outputDir, filename))
}

async function main() {
  const sourcePath = await prepareSource()

  await makePng(sourcePath, 16, 'favicon-16x16.png')
  await makePng(sourcePath, 32, 'favicon-32x32.png')
  await makePng(sourcePath, 48, 'favicon-48x48.png')
  await makePng(sourcePath, 180, 'apple-touch-icon.png')
  await makePng(sourcePath, 512, 'icon.png')

  const icoBuffer = await pngToIco([
    path.join(outputDir, 'favicon-16x16.png'),
    path.join(outputDir, 'favicon-32x32.png'),
    path.join(outputDir, 'favicon-48x48.png'),
  ])

  await fs.writeFile(path.join(outputDir, 'favicon.ico'), icoBuffer)

  console.log('Favicon generate usando solo la parte alta del logo.')
  console.log('Controlla: public/brand/favicon-source.png e public/icon.png')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
