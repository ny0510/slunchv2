declare module 'jsbarcode/src/barcodes' {
  type BarcodeConstructor = new (value: string, options: object) => { encode: () => { data: string } };
  const barcodes: { [key: string]: BarcodeConstructor };
  export default barcodes;
}
