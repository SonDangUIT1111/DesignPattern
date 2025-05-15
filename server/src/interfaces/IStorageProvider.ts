export interface FileUploadOptions {
    path?: string;
    filename?: string;
    contentType?: string;
}

export interface FileUploadResult {
    url: string;
    path: string;
    filename: string;
}

export interface IStorageProvider {
    uploadFile(file: Buffer, options: FileUploadOptions): Promise<FileUploadResult>;
    deleteFile(path: string): Promise<boolean>;
    getFileUrl(path: string): Promise<string>;
    createDirectory(path: string): Promise<boolean>;
} 