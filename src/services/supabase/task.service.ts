import { createClient } from '@/lib/supabase/client';

export interface TaskRecord {
  id: string;
  no: number;
  registration_date: string;
  code: string;
  team: string;
  department: string;
  work_content: string;
  status: string;
  assignee_id: string | null;
  start_date: string | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export class TaskService {
  private supabase = createClient();

  // 업무 기록 목록 조회
  async getTaskRecords() {
    const { data, error } = await this.supabase.from('task_records').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task records:', error);
      throw error;
    }

    return data;
  }

  // 업무 기록 단건 조회
  async getTaskRecord(id: string) {
    const { data, error } = await this.supabase.from('task_records').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching task record:', error);
      throw error;
    }

    return data;
  }

  // 업무 기록 생성
  async createTaskRecord(record: Omit<TaskRecord, 'id' | 'no' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase.from('task_records').insert(record).select().single();

    if (error) {
      console.error('Error creating task record:', error);
      throw error;
    }

    return data;
  }

  // 업무 기록 수정
  async updateTaskRecord(id: string, updates: Partial<TaskRecord>) {
    const { data, error } = await this.supabase.from('task_records').update(updates).eq('id', id).select().single();

    if (error) {
      console.error('Error updating task record:', error);
      throw error;
    }

    return data;
  }

  // 업무 기록 삭제
  async deleteTaskRecord(id: string) {
    const { error } = await this.supabase.from('task_records').delete().eq('id', id);

    if (error) {
      console.error('Error deleting task record:', error);
      throw error;
    }

    return true;
  }

  // 팀별 업무 조회
  async getTasksByTeam(team: string) {
    const { data, error } = await this.supabase.from('task_records').select('*').eq('team', team).order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks by team:', error);
      throw error;
    }

    return data;
  }

  // 상태별 업무 조회
  async getTasksByStatus(status: string) {
    const { data, error } = await this.supabase
      .from('task_records')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks by status:', error);
      throw error;
    }

    return data;
  }

  // 담당자별 업무 조회
  async getTasksByAssignee(assigneeId: string) {
    const { data, error } = await this.supabase
      .from('task_records')
      .select('*')
      .eq('assignee_id', assigneeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks by assignee:', error);
      throw error;
    }

    return data;
  }

  // 업무 첨부파일 조회
  async getTaskAttachments(taskRecordId: string) {
    const { data, error } = await this.supabase
      .from('task_attachments')
      .select('*')
      .eq('task_record_id', taskRecordId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching task attachments:', error);
      throw error;
    }

    return data;
  }

  // 업무 첨부파일 업로드
  async uploadTaskAttachment(taskRecordId: string, file: File, uploadedBy: string) {
    // 1. Storage에 파일 업로드
    const fileName = `${taskRecordId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await this.supabase.storage.from('task-attachments').upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    // 2. 첨부파일 정보를 DB에 저장
    const { data, error } = await this.supabase
      .from('task_attachments')
      .insert({
        task_record_id: taskRecordId,
        filename: file.name,
        storage_path: uploadData.path,
        uploaded_by: uploadedBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving attachment info:', error);
      // 업로드된 파일 삭제
      await this.supabase.storage.from('task-attachments').remove([uploadData.path]);
      throw error;
    }

    return data;
  }
}

// 싱글톤 인스턴스
export const taskService = new TaskService();
