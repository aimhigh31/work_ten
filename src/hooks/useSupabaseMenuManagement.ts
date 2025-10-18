import { useState, useEffect } from 'react';
import supabaseClient from '../lib/supabaseClient';
import { Admin_Systemsetting_Menu, MenuData, MenuInsert, MenuUpdate, MenuFilters, MenuResponse } from 'types/menu-management';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 메뉴 아이템 import (폴백용)
import menuItems from 'menu-items';

// Supabase 클라이언트 초기화 및 검증
const initializeSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('=== Supabase 초기화 (싱글톤 사용) ===');
  console.log('URL 환경변수:', supabaseUrl ? '설정됨' : '미설정');
  console.log('KEY 환경변수:', supabaseKey ? '설정됨' : '미설정');

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다. localStorage 모드로 실행됩니다.');
    return {
      client: null,
      configured: false,
      url: supabaseUrl || '',
      key: supabaseKey || ''
    };
  }

  // URL 형식 검증
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('❌ 잘못된 Supabase URL 형식:', supabaseUrl);
    return {
      client: null,
      configured: false,
      url: supabaseUrl,
      key: supabaseKey
    };
  }

  // 싱글톤 클라이언트 사용
  try {
    console.log('✅ Supabase 싱글톤 클라이언트 사용');
    return {
      client: supabaseClient,
      configured: true,
      url: supabaseUrl,
      key: supabaseKey
    };
  } catch (error) {
    console.error('❌ Supabase 클라이언트 생성 실패:', error);
    return {
      client: null,
      configured: false,
      url: supabaseUrl,
      key: supabaseKey
    };
  }
};

const { client: supabase, configured: isSupabaseConfigured } = initializeSupabase();

// 캐시 키
const CACHE_KEY = createCacheKey('menu_management', 'data');

export function useSupabaseMenuManagement() {
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 데이터베이스 데이터를 프론트엔드 형식으로 변환
  const transformDbToFrontend = (dbMenu: Admin_Systemsetting_Menu): MenuData => {
    return {
      id: dbMenu.id,
      level: dbMenu.menu_level,
      category: dbMenu.menu_category,
      icon: dbMenu.menu_icon,
      page: dbMenu.menu_page,
      description: dbMenu.menu_description || '',
      database: dbMenu.menu_database || '',
      url: dbMenu.menu_url,
      permissions: { enabled: dbMenu.is_enabled },
      displayOrder: dbMenu.display_order,
      createdAt: dbMenu.created_at,
      updatedAt: dbMenu.updated_at,
      createdBy: dbMenu.created_by,
      updatedBy: dbMenu.updated_by
    };
  };

  // 프론트엔드 데이터를 데이터베이스 형식으로 변환 (Insert용)
  const transformFrontendToDbInsert = (menuData: MenuData): MenuInsert => {
    return {
      menu_level: menuData.level,
      menu_category: menuData.category,
      menu_icon: menuData.icon,
      menu_page: menuData.page,
      menu_description: menuData.description,
      menu_database: menuData.database,
      menu_url: menuData.url,
      is_enabled: menuData.permissions.enabled,
      display_order: menuData.displayOrder,
      created_by: menuData.createdBy || 'system',
      updated_by: menuData.updatedBy || 'system'
    };
  };

  // 기본 메뉴 데이터 생성 (menuItems에서)
  const createDefaultMenus = (): MenuData[] => {
    const flatMenuItems = flattenMenuItems(menuItems.items);

    return flatMenuItems.map((item, index) => {
      // 상위 그룹 찾기
      let parentGroup = item.title;
      if (item.level > 0) {
        for (let i = index - 1; i >= 0; i--) {
          if (flatMenuItems[i].level === 0) {
            parentGroup = flatMenuItems[i].title;
            break;
          }
        }
      }

      return {
        id: index + 1,
        level: item.level,
        category: parentGroup,
        icon: item.icon,
        page: item.title,
        description: item.description || '',
        url: item.url || '/',
        permissions: { enabled: true },
        displayOrder: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system'
      };
    });
  };

  // 메뉴 아이템을 플랫하게 변환하는 함수
  const flattenMenuItems = (items: any[]): any[] => {
    const result: any[] = [];

    items.forEach((item) => {
      if (item.type === 'group') {
        result.push({ ...item, level: 0 });
        if (item.children) {
          item.children.forEach((child: any) => {
            if (child.type === 'collapse') {
              result.push({ ...child, level: 1 });
              if (child.children) {
                child.children.forEach((grandChild: any) => {
                  result.push({ ...grandChild, level: 2 });
                });
              }
            } else {
              result.push({ ...child, level: 1 });
            }
          });
        }
      } else if (item.type === 'collapse') {
        result.push({ ...item, level: 0 });
        if (item.children) {
          item.children.forEach((child: any) => {
            result.push({ ...child, level: 1 });
          });
        }
      } else {
        result.push({ ...item, level: 0 });
      }
    });

    return result;
  };

  // Supabase 연결 테스트
  const testSupabaseConnection = async (): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('🔄 Supabase 미설정: 연결 테스트 건너뜀');
      return false;
    }

    try {
      console.log('🔄 Supabase 연결 테스트 시작...');

      // 1단계: 테이블 존재 여부 확인 (소문자 테이블명 사용)
      console.log('🔍 1단계: admin_systemsetting_menu 테이블 존재 확인...');
      const { data: tableData, error: tableError } = await supabase.from('admin_systemsetting_menu').select('id').limit(1);

      // 오류 상세 분석
      if (tableError) {
        console.log('=== 테이블 확인 상세 오류 분석 ===');
        console.log('오류 타입:', typeof tableError);
        console.log('오류 객체 키:', Object.keys(tableError));

        // 모든 속성 출력
        for (const [key, value] of Object.entries(tableError)) {
          console.log(`${key}:`, value);
        }

        // 특정 Supabase 오류 코드 확인
        if (tableError.code === '42P01') {
          console.error('❌ 테이블이 존재하지 않습니다. SQL 스크립트를 실행해주세요.');
          console.error('📝 실행할 파일: create-admin-systemsetting-menu-table.sql');
        } else if (tableError.code === 'PGRST116') {
          console.error('❌ 테이블에 대한 접근 권한이 없습니다.');
        } else {
          console.error('❌ 알 수 없는 테이블 오류:', {
            message: tableError.message || 'No message',
            code: tableError.code || 'No code',
            details: tableError.details || 'No details',
            hint: tableError.hint || 'No hint'
          });
        }

        return false;
      }

      // 2단계: 기본 연결 테스트 (단순 쿼리로 변경)
      console.log('🔍 2단계: 기본 데이터베이스 연결 테스트...');
      const { count: healthCount, error: healthError } = await supabase.from('admin_systemsetting_menu').select('*', { count: 'exact', head: true }); // 올바른 카운트 쿼리

      if (healthError) {
        console.log('=== 연결 테스트 오류 분석 ===');
        console.log('Health check 오류:', healthError);

        // 네트워크 연결 문제인지 확인
        if (healthError.message?.includes('fetch') || healthError.message?.includes('network')) {
          console.error('❌ 네트워크 연결 문제 감지');
        }

        return false;
      }

      console.log('✅ Supabase 연결 테스트 성공');
      console.log('📊 테이블 데이터 개수:', tableData?.length || 0);
      console.log('🗄️ DB 연결 상태:', healthCount !== undefined ? 'Connected' : 'Unknown');

      return true;
    } catch (error) {
      console.log('=== 연결 테스트 예외 상세 분석 ===');
      console.log('예외 타입:', typeof error);
      console.log('예외 생성자:', error?.constructor?.name);

      // 모든 속성 안전하게 출력
      try {
        if (error && typeof error === 'object') {
          console.log('예외 속성들:');
          for (const [key, value] of Object.entries(error)) {
            console.log(`  ${key}:`, value);
          }
        }
      } catch (e) {
        console.log('예외 속성 분석 실패:', e);
      }

      console.error('❌ Supabase 연결 테스트 중 예외 발생:', error);
      return false;
    }
  };

  // 모든 메뉴 조회
  const fetchMenus = async (filters?: MenuFilters): Promise<void> => {
    console.log('📡 메뉴 데이터 조회 시작...');

    try {
      setLoading(true);
      setError(null);

      // Supabase가 설정되지 않은 경우 즉시 로컬 모드로 전환
      if (!isSupabaseConfigured || !supabase) {
        console.log('📱 로컬 모드: localStorage에서 데이터 로드');
        loadFromLocalStorage();
        return;
      }

      // Supabase 연결 테스트
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.log('🔄 DB 연결 실패: 로컬 모드로 전환');
        loadFromLocalStorage();
        return;
      }

      console.log('🔍 DB에서 메뉴 데이터 조회 중...');

      let query = supabase.from('admin_systemsetting_menu').select('*').order('display_order', { ascending: true });

      // 필터 적용
      if (filters?.enabled !== undefined) {
        query = query.eq('is_enabled', filters.enabled);
        console.log('🔍 필터 적용: enabled =', filters.enabled);
      }
      if (filters?.level !== undefined) {
        query = query.eq('menu_level', filters.level);
        console.log('🔍 필터 적용: level =', filters.level);
      }
      if (filters?.category) {
        query = query.eq('menu_category', filters.category);
        console.log('🔍 필터 적용: category =', filters.category);
      }
      if (filters?.search) {
        query = query.or(`menu_page.ilike.%${filters.search}%,menu_description.ilike.%${filters.search}%`);
        console.log('🔍 필터 적용: search =', filters.search);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        console.log(`✅ DB에서 ${data.length}개 메뉴 로드 성공`);
        const transformedMenus = data.map(transformDbToFrontend);
        setMenus(transformedMenus);
        saveToLocalStorage(transformedMenus);
        saveToCache(CACHE_KEY, transformedMenus); // 캐시에 저장
      } else {
        console.log('⚠️ DB에 데이터가 없어 기본 데이터 생성');
        const defaultMenus = createDefaultMenus();
        setMenus(defaultMenus);
        saveToLocalStorage(defaultMenus);
        saveToCache(CACHE_KEY, defaultMenus); // 캐시에 저장
      }
    } catch (err: any) {
      // 상세한 오류 분석 및 처리
      let errorMessage = 'Unknown error occurred';
      let errorDetails = '';

      try {
        if (err && typeof err === 'object') {
          // Supabase 특정 오류 처리
          if (err.message) {
            errorMessage = err.message;
          } else if (err.error) {
            errorMessage = err.error;
          } else if (err.details) {
            errorMessage = err.details;
          } else {
            errorMessage = JSON.stringify(err);
          }

          // 추가 정보 수집
          errorDetails = JSON.stringify({
            code: err.code || 'unknown',
            status: err.status || 'unknown',
            statusText: err.statusText || 'unknown',
            hint: err.hint || '',
            details: err.details || ''
          });
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else {
          errorMessage = String(err);
        }
      } catch (parseError) {
        errorMessage = 'Error parsing failed';
        errorDetails = String(parseError);
      }

      console.error('=== 메뉴 조회 상세 오류 ===');
      console.error('Error Message:', errorMessage);
      console.error('Error Details:', errorDetails);
      console.error('Original Error:', err);
      console.error('Supabase URL:', supabaseUrl ? 'Set' : 'Not Set');
      console.error('Supabase Key:', supabaseKey ? 'Set' : 'Not Set');
      console.error('========================');

      setError(`DB 연결 오류: ${errorMessage}`);

      // 폴백: localStorage 또는 기본 데이터 사용
      console.log('폴백 시스템 실행: localStorage에서 데이터 로드');
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // 메뉴 추가
  const addMenu = async (menuData: MenuData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const insertData = transformFrontendToDbInsert(menuData);

      const { data, error: insertError } = await supabase.from('admin_systemsetting_menu').insert(insertData).select();

      if (insertError) {
        throw insertError;
      }

      if (data && data[0]) {
        const newMenu = transformDbToFrontend(data[0]);
        setMenus((prev) => [...prev, newMenu]);

        // localStorage 백업
        saveToLocalStorage([...menus, newMenu]);
      }

      return true;
    } catch (err: any) {
      console.error('메뉴 추가 오류:', err);
      setError(err.message || '메뉴 추가 중 오류가 발생했습니다.');

      // 폴백: localStorage에 저장
      const newMenu = { ...menuData, id: Date.now() };
      setMenus((prev) => [...prev, newMenu]);
      saveToLocalStorage([...menus, newMenu]);

      return false;
    } finally {
      setLoading(false);
    }
  };

  // 메뉴 수정
  const updateMenu = async (id: number, updateData: Partial<MenuData>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 메뉴 수정 시도: ID ${id}`, updateData);

      if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase 미설정 - localStorage에서만 수정');
        setMenus((prev) => {
          const newMenus = prev.map((menu) => (menu.id === id ? { ...menu, ...updateData } : menu));
          saveToLocalStorage(newMenus);
          return newMenus;
        });
        return true;
      }

      const dbUpdateData: MenuUpdate = {};

      if (updateData.level !== undefined) dbUpdateData.menu_level = updateData.level;
      if (updateData.category !== undefined) dbUpdateData.menu_category = updateData.category;
      if (updateData.icon !== undefined) dbUpdateData.menu_icon = updateData.icon;
      if (updateData.page !== undefined) dbUpdateData.menu_page = updateData.page;
      if (updateData.description !== undefined) dbUpdateData.menu_description = updateData.description;
      if (updateData.database !== undefined) dbUpdateData.menu_database = updateData.database;
      if (updateData.url !== undefined) dbUpdateData.menu_url = updateData.url;
      if (updateData.permissions?.enabled !== undefined) dbUpdateData.is_enabled = updateData.permissions.enabled;
      if (updateData.displayOrder !== undefined) dbUpdateData.display_order = updateData.displayOrder;

      dbUpdateData.updated_by = updateData.updatedBy || 'system';

      console.log('📝 DB 업데이트 데이터:', dbUpdateData);

      const { data, error: updateError } = await supabase.from('admin_systemsetting_menu').update(dbUpdateData).eq('id', id).select();

      if (updateError) {
        console.error('❌ Supabase 수정 에러:', updateError);
        throw updateError;
      }

      console.log('✅ Supabase 수정 성공:', data);

      if (data && data[0]) {
        const updatedMenu = transformDbToFrontend(data[0]);
        setMenus((prev) => {
          const newMenus = prev.map((menu) => (menu.id === id ? updatedMenu : menu));
          // localStorage 백업도 여기서 처리
          saveToLocalStorage(newMenus);
          return newMenus;
        });
      } else {
        // data가 없어도 로컬 상태는 업데이트
        setMenus((prev) => {
          const newMenus = prev.map((menu) => (menu.id === id ? { ...menu, ...updateData } : menu));
          saveToLocalStorage(newMenus);
          return newMenus;
        });
      }

      return true;
    } catch (err: any) {
      console.error('❌ 메뉴 수정 오류:', err);
      setError(err.message || '메뉴 수정 중 오류가 발생했습니다.');

      // 폴백: localStorage에서 수정 (UI 업데이트)
      console.log('🔄 폴백 모드: localStorage에서만 수정');
      setMenus((prev) => {
        const newMenus = prev.map((menu) => (menu.id === id ? { ...menu, ...updateData } : menu));
        saveToLocalStorage(newMenus);
        return newMenus;
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  // 메뉴 삭제
  const deleteMenu = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🗑️ 메뉴 삭제 시도: ID ${id}`);

      if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase 미설정 - localStorage에서만 삭제');
        setMenus((prev) => prev.filter((menu) => menu.id !== id));
        const updatedMenus = menus.filter((menu) => menu.id !== id);
        saveToLocalStorage(updatedMenus);
        return true;
      }

      const { data, error: deleteError } = await supabase.from('admin_systemsetting_menu').delete().eq('id', id).select(); // 삭제된 데이터 확인용

      if (deleteError) {
        console.error('❌ Supabase 삭제 에러:', deleteError);
        throw deleteError;
      }

      console.log('✅ Supabase 삭제 성공:', data);

      // 프론트엔드 상태 업데이트
      setMenus((prev) => prev.filter((menu) => menu.id !== id));

      // localStorage 백업
      const updatedMenus = menus.filter((menu) => menu.id !== id);
      saveToLocalStorage(updatedMenus);

      return true;
    } catch (err: any) {
      console.error('❌ 메뉴 삭제 오류:', err);
      setError(err.message || '메뉴 삭제 중 오류가 발생했습니다.');

      // 폴백: localStorage에서만 삭제 (UI 업데이트)
      console.log('🔄 폴백 모드: localStorage에서만 삭제');
      setMenus((prev) => prev.filter((menu) => menu.id !== id));
      const updatedMenus = menus.filter((menu) => menu.id !== id);
      saveToLocalStorage(updatedMenus);

      return false;
    } finally {
      setLoading(false);
    }
  };

  // 메뉴 활성화/비활성화 토글
  const toggleMenuEnabled = async (id: number): Promise<boolean> => {
    const menu = menus.find((m) => m.id === id);
    if (!menu) return false;

    return await updateMenu(id, {
      permissions: { enabled: !menu.permissions.enabled }
    });
  };

  // localStorage 저장
  const saveToLocalStorage = (menuData: MenuData[]) => {
    try {
      localStorage.setItem('admin_systemsetting_menu', JSON.stringify(menuData));
    } catch (err) {
      console.error('localStorage 저장 오류:', err);
    }
  };

  // localStorage에서 로드
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('admin_systemsetting_menu');
      if (stored) {
        const menuData = JSON.parse(stored) as MenuData[];
        setMenus(menuData);
      } else {
        // localStorage에도 데이터가 없으면 기본 데이터 생성
        const defaultMenus = createDefaultMenus();
        setMenus(defaultMenus);
        saveToLocalStorage(defaultMenus);
      }
    } catch (err) {
      console.error('localStorage 로드 오류:', err);
      // 파싱 오류 시 기본 데이터 생성
      const defaultMenus = createDefaultMenus();
      setMenus(defaultMenus);
      saveToLocalStorage(defaultMenus);
    }
  };

  // 초기 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const cachedData = loadFromCache<MenuData[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setMenus(cachedData);
      setLoading(false);
      console.log('⚡ [MenuManagement] 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchMenus();
  }, []);

  // 메뉴 업데이트 이벤트 리스너 추가
  useEffect(() => {
    const handleMenuUpdate = () => {
      console.log('🔄 useSupabaseMenuManagement: MenuUpdate 이벤트 수신, 데이터 새로고침');
      fetchMenus(); // Supabase에서 최신 데이터 다시 가져오기
    };

    window.addEventListener('menuUpdated', handleMenuUpdate);

    return () => {
      window.removeEventListener('menuUpdated', handleMenuUpdate);
    };
  }, []);

  return {
    // 상태
    menus,
    loading,
    error,

    // 메서드
    fetchMenus,
    addMenu,
    updateMenu,
    deleteMenu,
    toggleMenuEnabled,

    // 유틸리티
    refreshMenus: () => fetchMenus(),
    clearError: () => setError(null)
  };
}
