declare module 'pdf-parse' {
  export class PDFParse {
    constructor(options: { data: Buffer | Uint8Array | ArrayBuffer })
    getText(): Promise<{ text?: string }>
    destroy?(): Promise<void> | void
  }
}
