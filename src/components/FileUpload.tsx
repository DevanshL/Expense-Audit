import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';
import type { FileUploadState, FileType } from '../types';

interface FileUploadProps {
  onFileSelect: (file: File, fileType: FileType) => void;
  uploadState: FileUploadState;
  className?: string;
}

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUpload({ onFileSelect, uploadState, className }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error('File size must be less than 50MB');
        }

        // Get file extension
        const extension = '.' + file.name.toLowerCase().split('.').pop();
        if (!ACCEPTED_EXTENSIONS.includes(extension)) {
          throw new Error(`Unsupported file type. Please upload: ${ACCEPTED_EXTENSIONS.join(', ')}`);
        }

        // Determine file type
        const fileType: FileType = 
          extension === '.csv' ? 'csv' :
          extension === '.json' ? 'json' : 'xlsx';

        onFileSelect(file, fileType);
      } catch (error) {
        // Error handling will be done in parent component
        console.error('File selection error:', error);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false),
  });

  const getUploadStatus = () => {
    if (uploadState.error) {
      return {
        icon: AlertCircle,
        text: uploadState.error,
        className: 'text-red-600 border-red-300 bg-red-50',
      };
    }

    if (uploadState.file) {
      return {
        icon: CheckCircle2,
        text: `File selected: ${uploadState.file.name}`,
        className: 'text-green-600 border-green-300 bg-green-50',
      };
    }

    return {
      icon: Upload,
      text: isDragActive || dragActive
        ? 'Drop your file here...'
        : 'Drop your file here, or click to browse',
      className: isDragActive || dragActive
        ? 'text-primary-600 border-primary-400 bg-primary-50'
        : 'text-gray-600 border-gray-300 bg-gray-50',
    };
  };

  const status = getUploadStatus();
  const StatusIcon = status.icon;

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-primary-400 hover:bg-primary-50',
          status.className,
          uploadState.isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <StatusIcon className="w-12 h-12" />
          
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {status.text}
            </p>
            
            {!uploadState.file && !uploadState.error && (
              <>
                <p className="text-sm text-gray-500">
                  Supported formats: CSV, Excel (.xlsx, .xls), JSON
                </p>
                <p className="text-xs text-gray-400">
                  Maximum file size: 50MB
                </p>
              </>
            )}
          </div>

          {uploadState.isUploading && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{Math.round(uploadState.uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${uploadState.uploadProgress}%`,
                    transition: 'width 0.3s ease-in-out'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {uploadState.file && !uploadState.error && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {uploadState.file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(uploadState.file.size / 1024).toFixed(1)} KB • {uploadState.fileType?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
