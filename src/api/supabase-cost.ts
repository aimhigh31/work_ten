import { supabase } from '../lib/supabase';
import type {
  CostRecord,
  CostRecordInsert,
  CostRecordUpdate,
  CostRecordFilter,
  CostRecordsResponse,
  CostStatistics,
  CostComment,
  CostAttachment
} from '../types/cost-supabase';

export class SupabaseCostAPI {
  // 비용 기록 조회
  static async getCostRecords(filters: CostRecordFilter = {}): Promise<CostRecordsResponse> {
    let query = supabase.from('cost_records').select(
      `
        *,
        assignee:user_profiles!assignee_id(id, name, email, avatar_url),
        created_by_user:user_profiles!created_by(id, name, email),
        amount_details:cost_amount_details(*),
        comments:cost_comments(*, author:user_profiles(id, name, avatar_url)),
        attachments:cost_attachments(*)
      `,
      { count: 'exact' }
    );

    // 필터 적용
    if (filters.team) {
      query = query.eq('team', filters.team);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.assignee_id) {
      query = query.eq('assignee_id', filters.assignee_id);
    }
    if (filters.cost_type) {
      query = query.eq('cost_type', filters.cost_type);
    }
    if (filters.date_from) {
      query = query.gte('registration_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('registration_date', filters.date_to);
    }

    // 페이징
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    };
  }

  // 비용 기록 생성
  static async createCostRecord(data: CostRecordInsert): Promise<CostRecord> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('인증되지 않은 사용자입니다.');

    // 코드 자동 생성 (없는 경우)
    let code = data.code;
    if (!code) {
      const { data: generatedCode, error: codeError } = await supabase.rpc('generate_cost_code');
      if (codeError) throw codeError;
      code = generatedCode;
    }

    const { data: newRecord, error } = await supabase
      .from('cost_records')
      .insert({
        ...data,
        code,
        created_by: user.id,
        amount: data.quantity * data.unit_price // 금액 자동 계산
      })
      .select(
        `
        *,
        assignee:user_profiles!assignee_id(id, name, email, avatar_url),
        created_by_user:user_profiles!created_by(id, name, email)
      `
      )
      .single();

    if (error) throw error;
    return newRecord;
  }

  // 비용 기록 업데이트
  static async updateCostRecord(id: string, data: CostRecordUpdate): Promise<CostRecord> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('인증되지 않은 사용자입니다.');

    // 금액 재계산 (quantity나 unit_price가 변경된 경우)
    const updateData = { ...data };
    if (data.quantity !== undefined || data.unit_price !== undefined) {
      // 기존 데이터 조회
      const { data: existingRecord } = await supabase.from('cost_records').select('quantity, unit_price').eq('id', id).single();

      if (existingRecord) {
        const newQuantity = data.quantity ?? existingRecord.quantity;
        const newUnitPrice = data.unit_price ?? existingRecord.unit_price;
        updateData.amount = newQuantity * newUnitPrice;
      }
    }

    const { data: updatedRecord, error } = await supabase
      .from('cost_records')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        assignee:user_profiles!assignee_id(id, name, email, avatar_url),
        created_by_user:user_profiles!created_by(id, name, email)
      `
      )
      .single();

    if (error) throw error;
    return updatedRecord;
  }

  // 비용 기록 삭제
  static async deleteCostRecord(id: string): Promise<void> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('인증되지 않은 사용자입니다.');

    const { error } = await supabase.from('cost_records').delete().eq('id', id);

    if (error) throw error;
  }

  // 댓글 추가
  static async addComment(costRecordId: string, content: string): Promise<CostComment> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('인증되지 않은 사용자입니다.');

    const { data, error } = await supabase
      .from('cost_comments')
      .insert({
        cost_record_id: costRecordId,
        author_id: user.id,
        content
      })
      .select(
        `
        *,
        author:user_profiles(id, name, avatar_url)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  // 댓글 업데이트
  static async updateComment(commentId: string, content: string): Promise<CostComment> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('인증되지 않은 사용자입니다.');

    const { data, error } = await supabase
      .from('cost_comments')
      .update({ content })
      .eq('id', commentId)
      .eq('author_id', user.id)
      .select(
        `
        *,
        author:user_profiles(id, name, avatar_url)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  // 댓글 삭제
  static async deleteComment(commentId: string): Promise<void> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('인증되지 않은 사용자입니다.');

    const { error } = await supabase.from('cost_comments').delete().eq('id', commentId).eq('author_id', user.id);

    if (error) throw error;
  }

  // 파일 업로드
  static async uploadFile(costRecordId: string, file: File): Promise<CostAttachment> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('인증되지 않은 사용자입니다.');

    // 파일 검증
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('파일 크기는 50MB를 초과할 수 없습니다.');
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원되지 않는 파일 형식입니다.');
    }

    // Storage에 파일 업로드
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${costRecordId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('cost-attachments').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

    if (uploadError) throw uploadError;

    // 메타데이터 저장
    const { data: attachment, error: dbError } = await supabase
      .from('cost_attachments')
      .insert({
        cost_record_id: costRecordId,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return attachment;
  }

  // 파일 다운로드 URL 생성
  static async getFileDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage.from('cost-attachments').createSignedUrl(storagePath, 3600); // 1시간 유효

    if (error) throw error;
    return data.signedUrl;
  }

  // 파일 삭제
  static async deleteFile(attachmentId: string): Promise<void> {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('인증되지 않은 사용자입니다.');

    // 첨부파일 정보 조회
    const { data: attachment, error: selectError } = await supabase
      .from('cost_attachments')
      .select('storage_path')
      .eq('id', attachmentId)
      .eq('uploaded_by', user.id)
      .single();

    if (selectError) throw selectError;

    // Storage에서 파일 삭제
    const { error: storageError } = await supabase.storage.from('cost-attachments').remove([attachment.storage_path]);

    if (storageError) throw storageError;

    // 메타데이터 삭제
    const { error: dbError } = await supabase.from('cost_attachments').delete().eq('id', attachmentId);

    if (dbError) throw dbError;
  }

  // 통계 조회
  static async getCostStatistics(filters: Partial<CostRecordFilter> = {}): Promise<CostStatistics> {
    let query = supabase.from('cost_records').select('*');

    // 필터 적용
    if (filters.team) {
      query = query.eq('team', filters.team);
    }
    if (filters.date_from) {
      query = query.gte('registration_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('registration_date', filters.date_to);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 통계 계산
    const totalAmount = data.reduce((sum, record) => sum + record.amount, 0);
    const totalCount = data.length;

    const statusBreakdown = data.reduce(
      (acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );

    const typeBreakdown = data.reduce(
      (acc, record) => {
        acc[record.cost_type] = (acc[record.cost_type] || 0) + record.amount;
        return acc;
      },
      {} as { [key: string]: number }
    );

    const teamBreakdown = data.reduce(
      (acc, record) => {
        acc[record.team] = (acc[record.team] || 0) + record.amount;
        return acc;
      },
      {} as { [key: string]: number }
    );

    // 월별 트렌드 (간단한 구현)
    const monthlyTrend = Object.entries(
      data.reduce(
        (acc, record) => {
          const month = record.registration_date.substring(0, 7); // YYYY-MM
          if (!acc[month]) {
            acc[month] = { amount: 0, count: 0 };
          }
          acc[month].amount += record.amount;
          acc[month].count += 1;
          return acc;
        },
        {} as { [key: string]: { amount: number; count: number } }
      )
    ).map(([month, data]) => ({
      month,
      amount: data.amount,
      count: data.count
    }));

    return {
      totalAmount,
      totalCount,
      statusBreakdown,
      typeBreakdown,
      teamBreakdown,
      monthlyTrend
    };
  }

  // 실시간 구독
  static subscribeToChanges(callback: (payload: any) => void) {
    const channel = supabase
      .channel('cost_records_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_records' }, callback)
      .subscribe();

    return channel;
  }

  // Excel 내보내기용 데이터
  static async getCostRecordsForExport(filters: CostRecordFilter = {}) {
    const { data } = await this.getCostRecords({ ...filters, limit: 10000 });

    return data.map((record) => ({
      등록일: record.registration_date,
      시작일: record.start_date,
      코드: record.code,
      팀: record.team,
      담당자: record.assignee?.name || '',
      비용유형: record.cost_type,
      내용: record.content,
      수량: record.quantity,
      단가: record.unit_price,
      금액: record.amount,
      상태: record.status,
      완료일: record.completion_date || '',
      생성일: new Date(record.created_at).toLocaleDateString(),
      생성자: record.created_by_user?.name || ''
    }));
  }
}
