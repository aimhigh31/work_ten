import { createClient } from '@/lib/supabase/client';

export interface EducationRecord {
  id: string;
  registration_date: string;
  start_date: string;
  code: string;
  education_type: string;
  content: string;
  participants: number;
  location: string;
  status: string;
  completion_date: string | null;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface EducationCurriculum {
  id: string;
  education_record_id: string;
  time_slot: string;
  subject: string;
  instructor: string;
  content: string;
  attachment_path: string | null;
  sort_order: number;
}

export interface EducationParticipant {
  id: string;
  education_record_id: string;
  participant_id: string | null;
  department: string;
  attendance_status: string;
  completion_status: string;
  registered_at: string;
}

export class EducationService {
  private supabase = createClient();

  // 교육 기록 목록 조회
  async getEducationRecords() {
    const { data, error } = await this.supabase.from('education_records').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching education records:', error);
      throw error;
    }

    return data;
  }

  // 교육 기록 단건 조회 (커리큘럼, 참석자 포함)
  async getEducationRecord(id: string) {
    const { data, error } = await this.supabase
      .from('education_records')
      .select(
        `
        *,
        education_curriculum (*)
        education_participants (*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching education record:', error);
      throw error;
    }

    return data;
  }

  // 교육 기록 생성
  async createEducationRecord(record: Omit<EducationRecord, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase.from('education_records').insert(record).select().single();

    if (error) {
      console.error('Error creating education record:', error);
      throw error;
    }

    return data;
  }

  // 교육 기록 수정
  async updateEducationRecord(id: string, updates: Partial<EducationRecord>) {
    const { data, error } = await this.supabase.from('education_records').update(updates).eq('id', id).select().single();

    if (error) {
      console.error('Error updating education record:', error);
      throw error;
    }

    return data;
  }

  // 교육 기록 삭제
  async deleteEducationRecord(id: string) {
    const { error } = await this.supabase.from('education_records').delete().eq('id', id);

    if (error) {
      console.error('Error deleting education record:', error);
      throw error;
    }

    return true;
  }

  // 커리큘럼 조회
  async getEducationCurriculum(educationRecordId: string) {
    const { data, error } = await this.supabase
      .from('education_curriculum')
      .select('*')
      .eq('education_record_id', educationRecordId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching curriculum:', error);
      throw error;
    }

    return data;
  }

  // 커리큘럼 추가
  async addCurriculumItem(item: Omit<EducationCurriculum, 'id'>) {
    const { data, error } = await this.supabase.from('education_curriculum').insert(item).select().single();

    if (error) {
      console.error('Error adding curriculum item:', error);
      throw error;
    }

    return data;
  }

  // 커리큘럼 수정
  async updateCurriculumItem(id: string, updates: Partial<EducationCurriculum>) {
    const { data, error } = await this.supabase.from('education_curriculum').update(updates).eq('id', id).select().single();

    if (error) {
      console.error('Error updating curriculum item:', error);
      throw error;
    }

    return data;
  }

  // 커리큘럼 삭제
  async deleteCurriculumItem(id: string) {
    const { error } = await this.supabase.from('education_curriculum').delete().eq('id', id);

    if (error) {
      console.error('Error deleting curriculum item:', error);
      throw error;
    }

    return true;
  }

  // 참석자 조회
  async getEducationParticipants(educationRecordId: string) {
    const { data, error } = await this.supabase
      .from('education_participants')
      .select(
        `
        *,
        user_profiles!participant_id (
          id,
          name,
          email,
          department,
          position
        )
      `
      )
      .eq('education_record_id', educationRecordId);

    if (error) {
      console.error('Error fetching participants:', error);
      throw error;
    }

    return data;
  }

  // 참석자 추가
  async addParticipant(participant: Omit<EducationParticipant, 'id' | 'registered_at'>) {
    const { data, error } = await this.supabase.from('education_participants').insert(participant).select().single();

    if (error) {
      console.error('Error adding participant:', error);
      throw error;
    }

    return data;
  }

  // 참석자 정보 수정
  async updateParticipant(id: string, updates: Partial<EducationParticipant>) {
    const { data, error } = await this.supabase.from('education_participants').update(updates).eq('id', id).select().single();

    if (error) {
      console.error('Error updating participant:', error);
      throw error;
    }

    return data;
  }

  // 참석자 삭제
  async removeParticipant(id: string) {
    const { error } = await this.supabase.from('education_participants').delete().eq('id', id);

    if (error) {
      console.error('Error removing participant:', error);
      throw error;
    }

    return true;
  }

  // 교육 유형별 조회
  async getEducationByType(educationType: string) {
    const { data, error } = await this.supabase
      .from('education_records')
      .select('*')
      .eq('education_type', educationType)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching education by type:', error);
      throw error;
    }

    return data;
  }

  // 상태별 교육 조회
  async getEducationByStatus(status: string) {
    const { data, error } = await this.supabase
      .from('education_records')
      .select('*')
      .eq('status', status)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching education by status:', error);
      throw error;
    }

    return data;
  }
}

// 싱글톤 인스턴스
export const educationService = new EducationService();
