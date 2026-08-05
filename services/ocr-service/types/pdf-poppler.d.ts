declare module "pdf-poppler" {
  type ConvertOptions = {
    format?: string;
    out_dir?: string;
    out_prefix?: string;
    page?: number | null;
  };

  const pdfPoppler: {
    convert(file: string, options: ConvertOptions): Promise<void>;
  };

  export default pdfPoppler;
}