import { useCallback, useState } from 'react';
import { Upload as UploadIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export function Upload() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback(
    async (file: File) => {
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          description: 'File size must be less than 100MB',
          variant: 'destructive',
        });
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          description: 'Only JPEG, PNG, WebP, and GIF files are allowed',
          variant: 'destructive',
        });
        return;
      }

      setFiles((prev) => [...prev, { file, progress: 0, status: 'pending' }]);
    },
    [toast]
  );

  const handleUpload = useCallback(
    async (index: number) => {
      const fileItem = files[index];
      if (!fileItem) return;

      setFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], status: 'uploading', progress: 0 };
        return newFiles;
      });

      try {
        await apiClient.uploadImageWithProgress(
          fileItem.file,
          (progress) => {
            setFiles((prev) => {
              const newFiles = [...prev];
              newFiles[index] = { ...newFiles[index], progress };
              return newFiles;
            });
          }
        );
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[index] = { ...newFiles[index], status: 'done', progress: 100 };
          return newFiles;
        });
        toast({ description: `${fileItem.file.name} uploaded successfully` });
      } catch (error) {
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[index] = {
            ...newFiles[index],
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          };
          return newFiles;
        });
      }
    },
    [files, toast]
  );

  const handleUploadAll = useCallback(() => {
    files.forEach((_, index) => {
      if (files[index].status === 'pending') {
        handleUpload(index);
      }
    });
  }, [files, handleUpload]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      droppedFiles.forEach(handleFile);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        Array.from(e.target.files).forEach(handleFile);
      }
    },
    [handleFile]
  );

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const uploadingCount = files.filter((f) => f.status === 'uploading').length;
  const doneCount = files.filter((f) => f.status === 'done').length;

  // Calculate overall upload progress (0-100)
  const overallProgress = files.length > 0
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0;

  const isUploading = uploadingCount > 0;
  const allDone = files.length > 0 && doneCount === files.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Upload Images</h1>
        <p className="text-neutral-400">
          Upload photos to your gallery. Maximum 100MB per file.
        </p>
      </div>

      <div className="mb-8">
        <label
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative block px-6 py-12 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden',
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : allDone
                ? 'border-green-500 bg-green-500/5'
                : 'border-neutral-700 bg-neutral-900/50 hover:border-neutral-600'
          )}
        >
          {/* Filling Glass Effect */}
          <div
            className={cn(
              'absolute inset-0 transition-all duration-500 ease-out pointer-events-none',
              isUploading || allDone ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: allDone
                ? 'linear-gradient(to top, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.08))'
                : 'linear-gradient(to top, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))',
              height: `${overallProgress}%`,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Shimmer effect while uploading */}
            {isUploading && (
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <UploadIcon className={cn(
              "h-10 w-10 mb-3 transition-colors",
              allDone ? "text-green-500" : "text-neutral-500"
            )} />

            {/* Show progress when uploading */}
            {isUploading && (
              <div className="mb-3">
                <p className="text-4xl font-bold text-green-400 mb-1">
                  {overallProgress}%
                </p>
                <p className="text-sm text-neutral-400">
                  Uploading {uploadingCount} of {files.length} files...
                </p>
              </div>
            )}

            {/* Show success message when all done */}
            {allDone && !isUploading && (
              <div className="mb-3">
                <p className="text-2xl font-bold text-green-400 mb-1">
                  ✓ Upload Complete!
                </p>
                <p className="text-sm text-neutral-400">
                  {files.length} file{files.length !== 1 ? 's' : ''} uploaded successfully
                </p>
              </div>
            )}

            {/* Default state */}
            {!isUploading && !allDone && (
              <>
                <p className="text-lg font-medium mb-1">Drag and drop images here</p>
                <p className="text-sm text-neutral-400 mb-4">or click to browse</p>
              </>
            )}

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        </label>

        {/* Add shimmer animation keyframes */}
        <style>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>

      {files.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Upload Queue</h2>
              <p className="text-sm text-neutral-400">
                {doneCount} done · {uploadingCount} uploading · {pendingCount} pending
              </p>
            </div>
            {pendingCount > 0 && (
              <Button onClick={handleUploadAll} disabled={uploadingCount > 0}>
                Upload All
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {files.map((fileItem, index) => (
              <div key={index} className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm truncate">{fileItem.file.name}</p>
                      <p className="text-xs text-neutral-500">
                        {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Progress value={fileItem.progress} className="h-2" />
                    {fileItem.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">{fileItem.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {fileItem.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpload(index)}
                      >
                        Upload
                      </Button>
                    )}
                    {fileItem.status === 'done' && (
                      <span className="text-xs text-green-500">✓ Done</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFiles((prev) => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          No files selected yet
        </div>
      )}
    </div>
  );
}
