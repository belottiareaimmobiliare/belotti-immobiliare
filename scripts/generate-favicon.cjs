const sharp = require('sharp')
const pngToIcoModule = require('png-to-ico')
const pngToIco = pngToIcoModule.default || pngToIcoModule
const fs = require('fs/promises')
const path = require('path')

const input = path.join(process.cwd(), 'public/images/brand/areaimmobiliare.png')
const outputDir = path.join(process.cwd(), 'public')

function dilateAlpha(alpha, width, height, radius) {
  const out = Buffer.alloc(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let found = 0

      for (let dy = -radius; dy <= radius && !found; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue

          if (alpha[ny * width + nx] > 0) {
            found = 255
            break
          }
        }
      }

      out[y * width + x] = found
    }
  }

  return out
}

async function makeWhiteOutlinedPng(size, filename) {
  const outlineWidth =
    size <= 16 ? 1 :
    size <= 32 ? 1 :
    size <= 48 ? 1 :
    size <= 180 ? 2 : 3

  const threshold =
    size <= 16 ? 20 :
    size <= 32 ? 18 :
    size <= 48 ? 14 : 10

  const { data } = await sharp(input)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const alpha = Buffer.alloc(size * size)

  for (let i = 0; i < size * size; i++) {
    const a = data[i * 4 + 3]
    alpha[i] = a >= threshold ? 255 : 0
  }

  const outlineAlpha = dilateAlpha(alpha, size, size, outlineWidth)
  const out = Buffer.alloc(size * size * 4)

  for (let i = 0; i < size * size; i++) {
    const p = i * 4

    // bordo nero sottile
    if (outlineAlpha[i] > 0) {
      out[p] = 0
      out[p + 1] = 0
      out[p + 2] = 0
      out[p + 3] = 255
    }

    // bianco pieno sopra
    if (alpha[i] > 0) {
      out[p] = 255
      out[p + 1] = 255
      out[p + 2] = 255
      out[p + 3] = 255
    }
  }

  await sharp(out, {
    raw: {
      width: size,
      height: size,
      channels: 4,
    },
  })
    .png()
    .toFile(path.join(outputDir, filename))
}

async function main() {
  await makeWhiteOutlinedPng(16, 'favicon-16x16.png')
  await makeWhiteOutlinedPng(32, 'favicon-32x32.png')
  await makeWhiteOutlinedPng(48, 'favicon-48x48.png')
  await makeWhiteOutlinedPng(180, 'apple-touch-icon.png')
  await makeWhiteOutlinedPng(512, 'icon.png')

  const icoBuffer = await pngToIco([
    path.join(outputDir, 'favicon-16x16.png'),
    path.join(outputDir, 'favicon-32x32.png'),
    path.join(outputDir, 'favicon-48x48.png'),
  ])

  await fs.writeFile(path.join(outputDir, 'favicon.ico'), icoBuffer)

  console.log('Favicon con bordo nero sottile generate correttamente.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
