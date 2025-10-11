import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// 브라우저용 Supabase 클라이언트 (Anon Key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '설정됨' : '없음');
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface UploadResult {
  url: string;
  path: string;
}

export function useSupabaseImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 이미지를 Supabase Storage에 업로드
   * @param file - 업로드할 파일
   * @param folder - 저장할 폴더 (예: 'hardware', 'software')
   * @returns 업로드된 이미지의 공개 URL
   */
  const uploadImage = useCallback(async (file: File, folder: string = 'hardware'): Promise<string | null> => {
    try {
      setUploading(true);
      setError(null);

      // Supabase 클라이언트 확인
      if (!supabase) {
        throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 환경변수를 확인해주세요.');
      }

      console.log('📤 이미지 업로드 시작:', file.name);

      // 파일 유효성 검사
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }

      // 파일 크기 제한 (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('파일 크기는 5MB 이하여야 합니다.');
      }

      // 고유한 파일명 생성
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${timestamp}_${randomStr}.${fileExt}`;

      console.log('📁 저장 경로:', fileName);

      // Supabase Storage에 업로드
      const { data, error: uploadError } = await supabase.storage
        .from('hardware-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ 업로드 실패:', uploadError);
        throw uploadError;
      }

      console.log('✅ 업로드 성공:', data);

      // 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from('hardware-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 공개 URL:', publicUrl);

      setUploading(false);
      return publicUrl;

    } catch (err: any) {
      console.error('❌ 이미지 업로드 에러:', err);
      setError(err.message || '이미지 업로드 중 오류가 발생했습니다.');
      setUploading(false);
      return null;
    }
  }, []);

  /**
   * 여러 이미지를 한 번에 업로드
   * @param files - 업로드할 파일 배열
   * @param folder - 저장할 폴더
   * @returns 업로드된 이미지 URL 배열
   */
  const uploadMultipleImages = useCallback(async (
    files: (File | null)[],
    folder: string = 'hardware'
  ): Promise<(string | null)[]> => {
    try {
      setUploading(true);
      setError(null);

      console.log('📤 다중 이미지 업로드 시작:', files.length, '개');

      const uploadPromises = files.map(file => {
        if (!file) return Promise.resolve(null);
        return uploadImage(file, folder);
      });

      const results = await Promise.all(uploadPromises);

      console.log('✅ 다중 업로드 완료:', results);

      setUploading(false);
      return results;

    } catch (err: any) {
      console.error('❌ 다중 이미지 업로드 에러:', err);
      setError(err.message || '이미지 업로드 중 오류가 발생했습니다.');
      setUploading(false);
      return [];
    }
  }, [uploadImage]);

  /**
   * Storage에서 이미지 삭제
   * @param url - 삭제할 이미지의 공개 URL
   */
  const deleteImage = useCallback(async (url: string): Promise<boolean> => {
    try {
      // Supabase 클라이언트 확인
      if (!supabase) {
        throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
      }

      console.log('🗑️ 이미지 삭제 시작:', url);

      // URL에서 파일 경로 추출
      const urlParts = url.split('/storage/v1/object/public/hardware-images/');
      if (urlParts.length < 2) {
        throw new Error('잘못된 이미지 URL입니다.');
      }

      const filePath = urlParts[1];
      console.log('📁 삭제할 파일 경로:', filePath);

      const { error: deleteError } = await supabase.storage
        .from('hardware-images')
        .remove([filePath]);

      if (deleteError) {
        console.error('❌ 삭제 실패:', deleteError);
        throw deleteError;
      }

      console.log('✅ 이미지 삭제 성공');
      return true;

    } catch (err: any) {
      console.error('❌ 이미지 삭제 에러:', err);
      setError(err.message || '이미지 삭제 중 오류가 발생했습니다.');
      return false;
    }
  }, []);

  return {
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    uploading,
    error
  };
}
