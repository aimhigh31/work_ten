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

      let query = supabase
        .from('admin_systemsetting_menu')
        .select('*')
        .order('display_order', { ascending: true });

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
      } else {
        console.log('⚠️ DB에 데이터가 없어 기본 데이터 생성');
        const defaultMenus = createDefaultMenus();
        setMenus(defaultMenus);
        saveToLocalStorage(defaultMenus);
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