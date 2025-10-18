import { useState } from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { FileData, CreateFileInput, UpdateFileInput } from 'types/files';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// Storage 버킷명
const STORAGE_BUCKET = 'common-files';

// SWR fetcher 함수 (sessionStorage 캐싱 추가)
const filesFetcher = async (key: string) => {
  const [, page, recordId] = key.split('|');

  // 캐시 키 동적 생성 (page와 recordId에 따라 다른 캐시)
  const cacheKey = createCacheKey('files', `${page}_${recordId || 'all'}`);

  // 1. 캐시 확인 (캐시가 있으면 즉시 반환)
  const cachedData = loadFromCache<FileData[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
  if (cachedData) {
    console.log('⚡ [Files] 캐시 데이터 반환 (깜빡임 방지)');
    return cachedData;
  }

  console.time('⏱️ Files Fetch');
  const supabase = createClient();

  console.log('🔍 filesFetcher 쿼리 파라미터:', {
    'SWR key': key,
    'page': page,
    'recordId': recordId,
    'recordId 타입': typeof recordId,
    'recordId가 undefined 문자열인가?': recordId === 'undefined'
  });

  let query = supabase
    .from('common_files_data')
    .select('*', { count: 'exact' })
    .eq('page', page)
    .order('created_at', { ascending: false });

  if (recordId && recordId !== 'undefined') {
    console.log('✅ record_id 필터 적용:', recordId);
    query = query.eq('record_id', recordId);
  } else {
    console.warn('⚠️ record_id 필터 미적용:', { recordId });
  }

  const { data, error, count } = await query;

  if (error) {
    console.timeEnd('⏱️ Files Fetch');
    throw error;
  }

  console.timeEnd('⏱️ Files Fetch');
  console.log(`📊 파일 ${count || 0}개 로드 완료`);

  // 2. 캐시에 저장
  saveToCache(cacheKey, data || []);

  return data || [];
};

export function useSupabaseFiles(page: string, recordId?: string | number) {
  // recordId를 명시적으로 string으로 변환
  const normalizedRecordId = recordId != null ? String(recordId) : undefined;

  console.log('🔍 useSupabaseFiles 초기화:', {
    '원본 recordId': recordId,
    '원본 타입': typeof recordId,
    '변환된 normalizedRecordId': normalizedRecordId,
    '변환된 타입': typeof normalizedRecordId,
    'page': page
  });

  // 개별 작업 loading 상태
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  // SWR로 캐싱 적용
  const isValidRecordId = normalizedRecordId &&
                          normalizedRecordId !== 'undefined' &&
                          normalizedRecordId.trim() !== '';
  const swrKey = isValidRecordId ? `files|${page}|${normalizedRecordId}` : null;
  console.log('🔍 SWR Key:', swrKey, '| 유효한 recordId:', isValidRecordId);

  const { data: files = [], error, mutate, isLoading, isValidating } = useSWR<FileData[]>(
    swrKey,
    filesFetcher,
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      revalidateIfStale: false,
      shouldRetryOnError: false,
      keepPreviousData: true,
    }
  );

  // 파일 조회 (SWR mutate로 수동 갱신)
  const fetchFiles = async () => {
    await mutate();
  };

  // 파일 업로드 + DB 저장 (Optimistic UI + SWR)
  const uploadFile = async (file: File, input: Omit<CreateFileInput, 'file_url' | 'file_name' | 'file_size' | 'file_type'>) => {
    setIsUploading(true);

    const startTime = performance.now();
    console.time('⏱️ uploadFile Total');

    // 1. 파일명 생성 (URL-safe: UUID + 확장자만 사용)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'file';
    // Storage 경로는 영문/숫자만 사용 (한글 파일명 문제 방지)
    const safeFileName = `${input.page}/${input.record_id}/${timestamp}_${randomStr}.${fileExtension}`;

    console.log('🔍 파일 업로드 시작:', {
      originalName: file.name,
      storagePath: safeFileName,
      size: file.size,
      type: file.type
    });

    // 2. Optimistic Update: 즉시 UI에 추가 (임시 ID 사용)
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticFile: FileData = {
      id: tempId,
      page: input.page,
      record_id: input.record_id,
      file_name: file.name,
      file_url: '', // Storage 업로드 전이므로 빈 값
      file_size: file.size,
      file_type: file.type,
      user_id: input.user_id,
      user_name: input.user_name || '알 수 없음',
      team: input.team,
      created_at: new Date().toISOString(),
      metadata: input.metadata,
    };

    console.time('⏱️ Optimistic UI Update');
    await mutate([optimisticFile, ...files], false);
    console.timeEnd('⏱️ Optimistic UI Update');

    try {
      // 3. Storage에 파일 업로드
      console.time('⏱️ Storage Upload');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(safeFileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      console.timeEnd('⏱️ Storage Upload');

      if (uploadError) {
        console.error('❌ Storage Upload Error:', uploadError);
        throw new Error(`파일 업로드 실패: ${uploadError.message}`);
      }

      console.log('✅ Storage 업로드 완료:', uploadData);

      // 4. Public URL 생성
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(safeFileName);

      const publicUrl = urlData.publicUrl;
      console.log('✅ Public URL 생성:', publicUrl);

      // 5. DB에 파일 메타데이터 저장
      console.time('⏱️ DB Insert');
      const dbInput: CreateFileInput = {
        ...input,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
      };

      console.log('🔍 DB Insert 시작, dbInput:', JSON.stringify(dbInput, null, 2));

      const { data: dbData, error: insertError } = await supabase
        .from('common_files_data')
        .insert([dbInput])
        .select()
        .single();

      console.timeEnd('⏱️ DB Insert');
      console.log('🔍 DB Insert 결과:', { data: dbData, error: insertError });

      if (insertError) {
        console.error('❌ DB Insert Error - Full Object:', insertError);
        console.error('❌ DB Insert Error - Stringified:', JSON.stringify(insertError, null, 2));
        console.error('❌ DB Insert Error - Keys:', Object.keys(insertError));
        console.error('❌ DB Insert Error - Message:', insertError?.message);
        console.error('❌ DB Insert Error - Details:', insertError?.details);
        console.error('❌ DB Insert Error - Hint:', insertError?.hint);
        console.error('❌ DB Insert Error - Code:', insertError?.code);
        // DB 저장 실패 시 Storage에서 파일 삭제 (롤백)
        await supabase.storage.from(STORAGE_BUCKET).remove([safeFileName]);
        throw new Error(`DB 저장 실패: ${JSON.stringify(insertError)}`);
      }

      // 6. 성공: 임시 ID를 실제 ID로 교체
      console.time('⏱️ Replace Temp ID');
      if (dbData) {
        const currentCache = await mutate();
        await mutate(
          (currentCache || files).map(f => f.id === tempId ? dbData : f),
          false
        );
      }
      console.timeEnd('⏱️ Replace Temp ID');

      const endTime = performance.now();
      console.log(`✅ uploadFile 완료: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ uploadFile Total');

      // 캐시 무효화 (최신 데이터 보장)
      const cacheKey = createCacheKey('files', `${page}_${normalizedRecordId || 'all'}`);
      sessionStorage.removeItem(cacheKey);

      return { success: true, data: dbData };
    } catch (err: any) {
      // 7. 실패: 롤백 (임시 항목 제거)
      console.error('❌ 파일 업로드 실패:', err);
      console.time('⏱️ Rollback');
      await mutate(files.filter(f => f.id !== tempId), false);
      console.timeEnd('⏱️ Rollback');

      const endTime = performance.now();
      console.log(`❌ uploadFile 실패: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ uploadFile Total');

      return { success: false, error: err.message };
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 수정 (메타데이터만, Optimistic UI + SWR)
  const updateFile = async (id: string, updates: UpdateFileInput) => {
    setIsUpdating(true);

    const startTime = performance.now();
    console.time('⏱️ updateFile Total');

    // 1. 이전 데이터 백업
    const previousFile = files.find(f => String(f.id) === String(id));
    if (!previousFile) {
      console.error('❌ 수정할 파일을 찾을 수 없습니다:', id);
      setIsUpdating(false);
      return { success: false, error: '수정할 파일을 찾을 수 없습니다.' };
    }

    // 2. Optimistic Update
    console.time('⏱️ Optimistic UI Update');
    await mutate(
      files.map(f => String(f.id) === String(id) ? { ...f, ...updates } : f),
      false
    );
    console.timeEnd('⏱️ Optimistic UI Update');

    try {
      // 3. DB 업데이트
      console.time('⏱️ DB Update');
      const { data, error: updateError } = await supabase
        .from('common_files_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      console.timeEnd('⏱️ DB Update');

      if (updateError) {
        throw updateError;
      }

      // 4. 성공: 서버 데이터로 최종 업데이트
      if (data) {
        await mutate(
          files.map(f => String(f.id) === String(id) ? data : f),
          false
        );
      }

      const endTime = performance.now();
      console.log(`✅ updateFile 완료: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ updateFile Total');

      // 캐시 무효화 (최신 데이터 보장)
      const cacheKey = createCacheKey('files', `${page}_${normalizedRecordId || 'all'}`);
      sessionStorage.removeItem(cacheKey);

      return { success: true, data };
    } catch (err: any) {
      // 5. 실패: 롤백
      console.error('❌ 파일 수정 실패:', err);
      console.time('⏱️ Rollback');
      await mutate(
        files.map(f => String(f.id) === String(id) ? previousFile : f),
        false
      );
      console.timeEnd('⏱️ Rollback');

      const endTime = performance.now();
      console.log(`❌ updateFile 실패: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ updateFile Total');

      return { success: false, error: err.message };
    } finally {
      setIsUpdating(false);
    }
  };

  // 파일 삭제 (DB + Storage, Optimistic UI + SWR)
  const deleteFile = async (id: string) => {
    setIsDeleting(true);

    const startTime = performance.now();
    console.time('⏱️ deleteFile Total');

    // 1. 이전 데이터 백업 (Storage 경로 추출용)
    const previousFile = files.find(f => String(f.id) === String(id));
    if (!previousFile) {
      console.error('❌ 삭제할 파일을 찾을 수 없습니다:', id);
      setIsDeleting(false);
      return { success: false, error: '삭제할 파일을 찾을 수 없습니다.' };
    }

    // 2. Storage 경로 추출 (URL에서 파일 경로 파싱)
    const storagePathMatch = previousFile.file_url.match(/common-files\/(.+)$/);
    const storagePath = storagePathMatch ? storagePathMatch[1] : null;

    if (!storagePath) {
      console.error('❌ Storage 경로를 추출할 수 없습니다:', previousFile.file_url);
    }

    // 3. Optimistic Update: 즉시 UI에서 제거
    console.time('⏱️ Optimistic UI Update');
    await mutate(
      files.filter(f => String(f.id) !== String(id)),
      false
    );
    console.timeEnd('⏱️ Optimistic UI Update');

    try {
      // 4. DB 삭제
      console.time('⏱️ DB Delete');
      const { error: deleteError } = await supabase
        .from('common_files_data')
        .delete()
        .eq('id', id);
      console.timeEnd('⏱️ DB Delete');

      if (deleteError) {
        throw deleteError;
      }

      // 5. Storage 파일 삭제 (실패해도 계속 진행 - DB가 우선)
      if (storagePath) {
        console.time('⏱️ Storage Delete');
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);
        console.timeEnd('⏱️ Storage Delete');

        if (storageError) {
          console.warn('⚠️ Storage 파일 삭제 실패 (DB는 삭제됨):', storageError);
        } else {
          console.log('✅ Storage 파일 삭제 완료');
        }
      }

      const endTime = performance.now();
      console.log(`✅ deleteFile 완료: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ deleteFile Total');

      // 캐시 무효화 (최신 데이터 보장)
      const cacheKey = createCacheKey('files', `${page}_${normalizedRecordId || 'all'}`);
      sessionStorage.removeItem(cacheKey);

      return { success: true };
    } catch (err: any) {
      // 6. 실패: 롤백
      console.error('❌ 파일 삭제 실패:', err);
      console.time('⏱️ Rollback');
      await mutate(
        [previousFile, ...files].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        false
      );
      console.timeEnd('⏱️ Rollback');

      const endTime = performance.now();
      console.log(`❌ deleteFile 실패: ${(endTime - startTime).toFixed(2)}ms`);
      console.timeEnd('⏱️ deleteFile Total');

      return { success: false, error: err.message };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    files,
    loading: isValidating,
    error: error?.message || null,
    fetchFiles,
    uploadFile,
    updateFile,
    deleteFile,
    isUploading,
    isUpdating,
    isDeleting
  };
}
