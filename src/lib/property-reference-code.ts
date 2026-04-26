const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generatePropertyReferenceCode(length = 6) {
  let code = ''

  for (let i = 0; i < length; i += 1) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  }

  return code
}
