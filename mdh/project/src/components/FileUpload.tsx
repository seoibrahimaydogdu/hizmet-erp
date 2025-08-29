import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // MB cinsinden
  acceptedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  url?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10, // 10MB
  acceptedTypes = ['image/*', '.pdf', '.txt', '.log', '.doc', '.docx'],
  className = ''
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (file.type.includes('word') || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    } else if (file.type.includes('text') || file.name.toLowerCase().endsWith('.txt')) {
      return <FileText className="w-5 h-5 text-green-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Dosya boyutu kontrolü
    if (file.size > maxSize * 1024 * 1024) {
      return `Dosya boyutu ${maxSize}MB'dan büyük olamaz`;
    }

    // Dosya tipi kontrolü
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    });

    if (!isValidType) {
      return 'Desteklenmeyen dosya tipi';
    }

    return null;
  };

  const simulateFileUpload = async (file: File, fileId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Simüle edilmiş dosya yükleme
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Başarılı yükleme simülasyonu
          const fakeUrl = `https://example.com/uploads/${Date.now()}-${file.name}`;
          resolve(fakeUrl);
        }
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: Math.round(progress) }
              : f
          )
        );
      }, 200);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    const fileArray = Array.from(files);

    // Maksimum dosya sayısı kontrolü
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      toast.error(`Maksimum ${maxFiles} dosya yükleyebilirsiniz`);
      return;
    }

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }

      const fileId = Math.random().toString(36).substr(2, 9);
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        status: 'uploading',
        progress: 0
      };

      newFiles.push(uploadedFile);
    }

    if (newFiles.length > 0) {
      // Önce state'i güncelle
      setUploadedFiles(prev => {
        const updatedFiles = [...prev, ...newFiles];
        // State güncellendikten sonra parent'a bildir
        setTimeout(() => {
          onFilesChange(updatedFiles.map(f => f.file));
        }, 0);
        return updatedFiles;
      });
      
      // Her dosyayı ayrı ayrı yükle
      for (const uploadedFile of newFiles) {
        try {
          // Dosya yükleme simülasyonu
          const url = await simulateFileUpload(uploadedFile.file, uploadedFile.id);
          
          // Resim dosyaları için önizleme oluştur
          let preview: string | undefined;
          if (uploadedFile.file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              preview = e.target?.result as string;
            };
            reader.readAsDataURL(uploadedFile.file);
          }

          // Başarılı olarak işaretle
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadedFile.id 
                ? { 
                    ...f, 
                    status: 'success' as const, 
                    progress: 100,
                    url,
                    preview
                  }
                : f
            )
          );

          toast.success(`${uploadedFile.file.name} başarıyla yüklendi`);
        } catch (error) {
          console.error('Dosya yükleme hatası:', error);
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, status: 'error' as const }
                : f
            )
          );
          toast.error(`${uploadedFile.file.name} yüklenirken hata oluştu`);
        }
      }
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const filtered = prev.filter(f => f.id !== fileId);
      // State güncellendikten sonra parent'a bildir
      setTimeout(() => {
        onFilesChange(filtered.map(f => f.file));
      }, 0);
      return filtered;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dosya Yükleme Alanı */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Dosyaları buraya sürükleyin veya
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          dosya seçin
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Maksimum {maxFiles} dosya, {maxSize}MB'a kadar
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Desteklenen: Resim, PDF, Word, TXT, LOG
        </p>
      </div>

      {/* Gizli dosya input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Yüklenen Dosyalar */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Yüklenen Dosyalar ({uploadedFiles.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'uploading' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {uploadedFile.progress || 0}%
                      </span>
                    </div>
                  )}
                  
                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  
                  {uploadedFile.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  
                  <button
                    type="button"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
