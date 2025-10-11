import { createClient } from '../../lib/supabase/client';

export interface CostRecord {
  id: string;
  registration_date: string;
  start_date: string;
  code: string;
  team: string;
  assignee_id: string | null;
  cost_type: string;
  content: string;
  quantity: number;
  unit_price: number;
  amount: number;
  status: string;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export class CostService {
  private supabase = createClient();

  // 비용 기록 목록 조회
  async getCostRecords() {
    const { data, error } = await this.supabase.from('cost_records').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cost records:', error);
      throw error;
    }

    return data || [];
  }

  // 비용 기록 단건 조회
  async getCostRecord(id: string) {
    const { data, error } = await this.supabase.from('cost_records').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching cost record:', error);
      throw error;
    }

    return data;
  }

  // 비용 기록 생성
  async createCostRecord(record: Omit<CostRecord, 'id' | 'created_at' | 'updated_at'>) {
    console.log('📝 Attempting to create cost record with data:', record);

    const { data, error } = await this.supabase.from('cost_records').insert(record).select().single();

    if (error) {
      console.error('❌ Error creating cost record:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Record data:', JSON.stringify(record, null, 2));
      throw error;
    }

    console.log('✅ Successfully created cost record:', data);
    return data;
  }

  // 비용 기록 수정
  async updateCostRecord(id: string, updates: Partial<CostRecord>) {
    const { data, error } = await this.supabase.from('cost_records').update(updates).eq('id', id).select().single();

    if (error) {
      console.error('Error updating cost record:', error);
      throw error;
    }

    return data;
  }

  // 비용 기록 삭제
  async deleteCostRecord(id: string) {
    const { error } = await this.supabase.from('cost_records').delete().eq('id', id);

    if (error) {
      console.error('Error deleting cost record:', error);
      throw error;
    }

    return true;
  }

  // 비용 코멘트 조회
  async getCostComments(costRecordId: string) {
    const { data, error } = await this.supabase
      .from('cost_comments')
      .select('*')
      .eq('cost_record_id', costRecordId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching cost comments:', error);
      throw error;
    }

    return data;
  }

  // 비용 코멘트 추가
  async addCostComment(costRecordId: string, content: string, authorId: string) {
    const { data, error } = await this.supabase
      .from('cost_comments')
      .insert({
        cost_record_id: costRecordId,
        content,
        author_id: authorId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding cost comment:', error);
      throw error;
    }

    return data;
  }

  // 비용 첨부파일 조회
  async getCostAttachments(costRecordId: string) {
    const { data, error } = await this.supabase
      .from('cost_attachments')
      .select('*')
      .eq('cost_record_id', costRecordId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching cost attachments:', error);
      throw error;
    }

    return data;
  }

  // 비용 첨부파일 업로드
  async uploadCostAttachment(costRecordId: string, file: File, uploadedBy: string) {
    // 1. Storage에 파일 업로드
    const fileName = `${costRecordId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await this.supabase.storage.from('cost-attachments').upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    // 2. 첨부파일 정보를 DB에 저장
    const { data, error } = await this.supabase
      .from('cost_attachments')
      .insert({
        cost_record_id: costRecordId,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: uploadData.path,
        uploaded_by: uploadedBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving attachment info:', error);
      // 업로드된 파일 삭제
      await this.supabase.storage.from('cost-attachments').remove([uploadData.path]);
      throw error;
    }

    return data;
  }

  // 첨부파일 다운로드 URL 생성
  async getAttachmentUrl(storagePath: string) {
    const { data } = await this.supabase.storage.from('cost-attachments').createSignedUrl(storagePath, 3600); // 1시간 유효

    return data?.signedUrl;
  }
}

// 싱글톤 인스턴스
export const costService = new CostService();
