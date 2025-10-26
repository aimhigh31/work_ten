import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정 (클라이언트에서는 Anon Key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface UploadResult {
  url: string | null;
  error: string | null;
}

export const useSupabaseStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * 이미지 압축/리사이즈 함수
   * @param file - 원본 이미지 파일
   * @param maxWidth - 최대 너비 (기본값: 800px)
   * @param maxHeight - 최대 높이 (기본값: 800px)
   * @param quality - 압축 품질 (0~1, 기본값: 0.8)
   * @returns 압축된 이미지 File 객체
   */
  const compressImage = async (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 비율 유지하면서 리사이즈
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context를 가져올 수 없습니다.'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('이미지 압축에 실패했습니다.'));
                return;
              }

              // Blob을 File로 변환
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });

              console.log(
                `📦 이미지 압축 완료: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
              );
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = () => {
          reject(new Error('이미지 로드에 실패했습니다.'));
        };
      };
      reader.onerror = () => {
        reject(new Error('파일 읽기에 실패했습니다.'));
      };
    });
  };

  /**
   * 프로필 이미지를 Supabase Storage에 업로드
   * @param file - 업로드할 파일
   * @param userId - 사용자 ID (폴더 구조용)
   * @returns 업로드된 이미지의 공개 URL
   */
  const uploadProfileImage = async (file: File, userId: string): Promise<UploadResult> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // 파일 존재 검사
      if (!file) {
        throw new Error('업로드할 파일이 선택되지 않았습니다.');
      }

      // 파일 이름 검사
      if (!file.name || file.name.trim() === '') {
        throw new Error('유효하지 않은 파일명입니다.');
      }

      // 파일 타입 검사 (MIME type)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        throw new Error(`지원하지 않는 파일 형식입니다. (${file.type})\nJPG, PNG, GIF, WebP만 가능합니다.`);
      }

      // 파일 확장자 검사 (이중 검증)
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!fileExt || !validExts.includes(fileExt)) {
        throw new Error(`지원하지 않는 파일 확장자입니다. (${fileExt})\njpg, png, gif, webp만 가능합니다.`);
      }

      // 최소 파일 크기 검사 (1KB 미만은 유효하지 않은 이미지로 간주)
      if (file.size < 1024) {
        throw new Error('파일 크기가 너무 작습니다. 유효한 이미지 파일을 선택해주세요.');
      }

      // 원본 파일이 너무 크면 미리 경고 (10MB 이상)
      const maxOriginalSize = 10 * 1024 * 1024;
      if (file.size > maxOriginalSize) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        throw new Error(`원본 파일이 너무 큽니다. (${fileSizeMB}MB)\n10MB 이하의 이미지를 선택해주세요.`);
      }

      // 파일 이름 길이 검사
      if (file.name.length > 100) {
        throw new Error('파일명이 너무 깁니다. 100자 이하의 파일명을 사용해주세요.');
      }

      // 이미지 파일 헤더 검증 (압축 전에 먼저 검증)
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // 이미지 매직 넘버 검증
      let isValidImage = false;

      if (uint8Array.length >= 2) {
        // JPEG: FF D8
        if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8) {
          isValidImage = true;
        }
        // PNG: 89 50 4E 47
        else if (
          uint8Array.length >= 4 &&
          uint8Array[0] === 0x89 &&
          uint8Array[1] === 0x50 &&
          uint8Array[2] === 0x4e &&
          uint8Array[3] === 0x47
        ) {
          isValidImage = true;
        }
        // GIF: 47 49 46 38
        else if (
          uint8Array.length >= 4 &&
          uint8Array[0] === 0x47 &&
          uint8Array[1] === 0x49 &&
          uint8Array[2] === 0x46 &&
          uint8Array[3] === 0x38
        ) {
          isValidImage = true;
        }
        // WebP: 52 49 46 46 (RIFF) + WebP signature
        else if (
          uint8Array.length >= 12 &&
          uint8Array[0] === 0x52 &&
          uint8Array[1] === 0x49 &&
          uint8Array[2] === 0x46 &&
          uint8Array[3] === 0x46 &&
          uint8Array[8] === 0x57 &&
          uint8Array[9] === 0x45 &&
          uint8Array[10] === 0x42 &&
          uint8Array[11] === 0x50
        ) {
          isValidImage = true;
        }
      }

      if (!isValidImage) {
        throw new Error('유효하지 않은 이미지 파일입니다. 파일이 손상되었거나 이미지가 아닐 수 있습니다.');
      }

      // 이미지 압축 (검증 통과 후 수행)
      let fileToUpload = file;
      console.log(`📦 원본 이미지 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      setUploadProgress(10);

      // 모든 파일을 공격적으로 압축 (Supabase Storage 2MB 제한)
      let maxDimension = 500;
      let quality = 0.5;

      if (file.size > 5 * 1024 * 1024) {
        // 5MB 이상: 400px, 품질 0.4
        maxDimension = 400;
        quality = 0.4;
      } else if (file.size > 2 * 1024 * 1024) {
        // 2MB 이상: 450px, 품질 0.45
        maxDimension = 450;
        quality = 0.45;
      } else if (file.size > 1 * 1024 * 1024) {
        // 1MB 이상: 500px, 품질 0.5
        maxDimension = 500;
        quality = 0.5;
      } else if (file.size > 500 * 1024) {
        // 500KB 이상: 600px, 품질 0.6
        maxDimension = 600;
        quality = 0.6;
      } else {
        // 500KB 미만: 압축 안 함
        maxDimension = 0;
      }

      if (maxDimension > 0) {
        console.log(`🎨 압축 설정: 최대 크기 ${maxDimension}px, 품질 ${quality}`);
        fileToUpload = await compressImage(file, maxDimension, maxDimension, quality);
        console.log(`✅ 압축 완료: ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
      }

      // 압축 후에도 1.8MB를 초과하면 에러 (안전 마진 포함)
      const maxSize = 1.8 * 1024 * 1024;
      if (fileToUpload.size > maxSize) {
        const fileSizeMB = (fileToUpload.size / 1024 / 1024).toFixed(2);
        throw new Error(
          `파일 크기가 너무 큽니다. (${fileSizeMB}MB)\n압축 후에도 1.8MB를 초과합니다.\n\n💡 해결 방법:\n1. 더 작은 해상도의 이미지를 사용하세요\n2. 이미지 편집 프로그램으로 미리 압축하세요\n3. JPG 형식으로 저장하면 용량이 더 작아집니다`
        );
      }

      // 파일명 생성 (userId/timestamp-randomstring.extension)
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log('📤 프로필 이미지 업로드 시작:', fileName);
      setUploadProgress(20);

      // 기존 이미지가 있다면 삭제 (선택사항)
      // await deleteOldProfileImages(userId);

      // Supabase Storage에 업로드 (압축된 파일 사용)
      const { data, error } = await supabase.storage.from('profile-images').upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false // 같은 이름의 파일이 있으면 에러
      });

      setUploadProgress(80);

      if (error) {
        console.error('❌ 업로드 에러:', error);
        throw error;
      }

      // 공개 URL 가져오기
      const {
        data: { publicUrl }
      } = supabase.storage.from('profile-images').getPublicUrl(fileName);

      setUploadProgress(100);
      console.log('✅ 업로드 성공! URL:', publicUrl);

      return {
        url: publicUrl,
        error: null
      };
    } catch (error: any) {
      console.error('❌ 프로필 이미지 업로드 실패:', error);
      return {
        url: null,
        error: error.message || '이미지 업로드에 실패했습니다.'
      };
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  /**
   * 프로필 이미지 삭제
   * @param imageUrl - 삭제할 이미지의 URL
   */
  const deleteProfileImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // URL에서 파일 경로 추출
      const urlParts = imageUrl.split('/storage/v1/object/public/profile-images/');
      if (urlParts.length !== 2) {
        throw new Error('유효하지 않은 이미지 URL입니다.');
      }

      const filePath = urlParts[1];
      console.log('🗑️ 이미지 삭제 시도:', filePath);

      const { error } = await supabase.storage.from('profile-images').remove([filePath]);

      if (error) {
        console.error('❌ 삭제 에러:', error);
        throw error;
      }

      console.log('✅ 이미지 삭제 성공');
      return true;
    } catch (error: any) {
      console.error('❌ 프로필 이미지 삭제 실패:', error);
      return false;
    }
  };

  /**
   * 사용자의 기존 프로필 이미지 모두 삭제
   * @param userId - 사용자 ID
   */
  const deleteOldProfileImages = async (userId: string): Promise<void> => {
    try {
      const { data: files, error } = await supabase.storage.from('profile-images').list(userId, {
        limit: 100
      });

      if (error) {
        console.error('❌ 기존 이미지 목록 조회 실패:', error);
        return;
      }

      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${userId}/${file.name}`);
        const { error: deleteError } = await supabase.storage.from('profile-images').remove(filePaths);

        if (deleteError) {
          console.error('❌ 기존 이미지 삭제 실패:', deleteError);
        } else {
          console.log(`✅ ${files.length}개의 기존 이미지 삭제 완료`);
        }
      }
    } catch (error) {
      console.error('❌ 기존 이미지 삭제 중 오류:', error);
    }
  };

  return {
    uploadProfileImage,
    deleteProfileImage,
    deleteOldProfileImages,
    uploading,
    uploadProgress
  };
};
