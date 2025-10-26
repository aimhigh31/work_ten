import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CACHE_KEY = createCacheKey('calendar', 'events');

export interface CalendarEvent {
  id: number;
  event_id: string;
  title: string;
  description?: string;
  team?: string;
  assignee?: string;
  attendees?: string;
  color?: string;
  text_color?: string;
  all_day: boolean;
  start_date: string;
  end_date: string;
  event_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarEventInput {
  event_id?: string;
  title: string;
  description?: string;
  team?: string;
  assignee?: string;
  attendees?: string;
  color?: string;
  text_color?: string;
  all_day: boolean;
  start_date: Date | string;
  end_date: Date | string;
}

export function useSupabaseCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 전체 이벤트 조회 (Investment 패턴 - 데이터 직접 반환)
  const getEvents = useCallback(async (): Promise<CalendarEvent[]> => {
    // 1. 캐시에서 먼저 로드 (즉시 반환)
    const cachedData = loadFromCache<CalendarEvent[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [Calendar] 캐시 데이터 반환');
      setEvents(cachedData); // ✅ 캐시 데이터로 상태 업데이트 (KPI 패턴)
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.from('main_calendar_data').select('*').order('start_date', { ascending: true });

      if (fetchError) {
        console.error('이벤트 조회 오류:', fetchError);
        setError(fetchError.message);
        return [];
      }

      // 2. 상태 업데이트 (KPI 패턴)
      setEvents(data || []);

      // 3. 캐시에 저장
      saveToCache(CACHE_KEY, data || []);

      return data || [];
    } catch (err: any) {
      console.error('이벤트 조회 예외:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 전체 이벤트 조회 (내부 상태 업데이트용 - 후방 호환성)
  const fetchEvents = useCallback(async () => {
    const data = await getEvents();
    setEvents(data);
    return data;
  }, [getEvents]);

  // 다음 이벤트 코드 생성
  const generateNextEventCode = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const yearPrefix = `MAIN-CALENDAR-${currentYear}-`;

      // 현재 연도의 최대 일련번호 조회
      const { data, error } = await supabase
        .from('main_calendar_data')
        .select('event_code')
        .like('event_code', `${yearPrefix}%`)
        .order('event_code', { ascending: false })
        .limit(1);

      if (error) {
        console.error('코드 조회 오류:', error);
        return `${yearPrefix}001`;
      }

      if (!data || data.length === 0) {
        return `${yearPrefix}001`;
      }

      // 마지막 일련번호 추출 및 증가
      const lastCode = data[0].event_code;
      const lastSerial = parseInt(lastCode.split('-').pop() || '0', 10);
      const nextSerial = (lastSerial + 1).toString().padStart(3, '0');

      return `${yearPrefix}${nextSerial}`;
    } catch (err) {
      console.error('코드 생성 예외:', err);
      const currentYear = new Date().getFullYear().toString().slice(-2);
      return `MAIN-CALENDAR-${currentYear}-001`;
    }
  }, []);

  // 이벤트 생성
  const createEvent = useCallback(
    async (eventData: CalendarEventInput) => {
      try {
        const event_id = eventData.event_id || `event_${Date.now()}`;
        const event_code = await generateNextEventCode();

        const { data, error: createError } = await supabase
          .from('main_calendar_data')
          .insert([
            {
              event_id,
              title: eventData.title,
              description: eventData.description,
              team: eventData.team,
              assignee: eventData.assignee,
              attendees: eventData.attendees,
              color: eventData.color,
              text_color: eventData.text_color || '#000000',
              all_day: eventData.all_day,
              start_date: new Date(eventData.start_date).toISOString(),
              end_date: new Date(eventData.end_date).toISOString(),
              event_code
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('이벤트 생성 오류:', createError);
          throw createError;
        }

        console.log('이벤트 생성 성공:', data);

        // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
        setEvents((prev) => [data, ...prev]);

        // 캐시 무효화 (최신 데이터 보장)
        sessionStorage.removeItem(CACHE_KEY);

        return data;
      } catch (err: any) {
        console.error('이벤트 생성 예외:', err);
        throw err;
      }
    },
    [generateNextEventCode]
  );

  // 이벤트 수정
  const updateEvent = useCallback(
    async (event_id: string, eventData: Partial<CalendarEventInput>) => {
      try {
        const updatePayload: any = {};

        if (eventData.title !== undefined) updatePayload.title = eventData.title;
        if (eventData.description !== undefined) updatePayload.description = eventData.description;
        if (eventData.team !== undefined) updatePayload.team = eventData.team;
        if (eventData.assignee !== undefined) updatePayload.assignee = eventData.assignee;
        if (eventData.attendees !== undefined) updatePayload.attendees = eventData.attendees;
        if (eventData.color !== undefined) updatePayload.color = eventData.color;
        if (eventData.text_color !== undefined) updatePayload.text_color = eventData.text_color;
        if (eventData.all_day !== undefined) updatePayload.all_day = eventData.all_day;
        if (eventData.start_date !== undefined) updatePayload.start_date = new Date(eventData.start_date).toISOString();
        if (eventData.end_date !== undefined) updatePayload.end_date = new Date(eventData.end_date).toISOString();

        updatePayload.updated_at = new Date().toISOString();

        const { data, error: updateError } = await supabase
          .from('main_calendar_data')
          .update(updatePayload)
          .eq('event_id', event_id)
          .select()
          .single();

        if (updateError) {
          console.error('이벤트 수정 오류:', updateError);
          throw updateError;
        }

        console.log('이벤트 수정 성공:', data);

        // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
        setEvents((prev) => prev.map((event) => (event.event_id === event_id ? data : event)));

        // 캐시 무효화 (최신 데이터 보장)
        sessionStorage.removeItem(CACHE_KEY);

        return data;
      } catch (err: any) {
        console.error('이벤트 수정 예외:', err);
        throw err;
      }
    },
    []
  );

  // 이벤트 삭제
  const deleteEvent = useCallback(
    async (event_id: string) => {
      try {
        const { error: deleteError } = await supabase.from('main_calendar_data').delete().eq('event_id', event_id);

        if (deleteError) {
          console.error('이벤트 삭제 오류:', deleteError);
          throw deleteError;
        }

        console.log('이벤트 삭제 성공:', event_id);

        // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
        setEvents((prev) => prev.filter((event) => event.event_id !== event_id));

        // 캐시 무효화 (최신 데이터 보장)
        sessionStorage.removeItem(CACHE_KEY);
      } catch (err: any) {
        console.error('이벤트 삭제 예외:', err);
        throw err;
      }
    },
    []
  );

  // Investment 패턴: 자동 로딩 제거 (페이지에서 수동 호출)
  // useEffect 제거로 병렬 로딩 가능

  return {
    events,
    loading,
    error,
    getEvents, // ⭐ Investment 패턴: 데이터 직접 반환
    fetchEvents, // 후방 호환성: 내부 상태 업데이트
    createEvent,
    updateEvent,
    deleteEvent
  };
}
