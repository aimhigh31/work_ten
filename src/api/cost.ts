import { CostRecord, CostStatistics } from 'types/cost';

// 비용관리 API 인터페이스

export interface CostAPI {
  getCostRecords: () => Promise<CostRecord[]>;
  createCostRecord: (record: Omit<CostRecord, 'id'>) => Promise<CostRecord>;
  updateCostRecord: (id: number, record: Partial<CostRecord>) => Promise<CostRecord>;
  deleteCostRecord: (id: number) => Promise<void>;
  getCostStatistics: () => Promise<CostStatistics>;
  uploadAttachment: (recordId: number, file: File) => Promise<void>;
  deleteAttachment: (recordId: number, attachmentId: number) => Promise<void>;
}

// Mock API 구현 (실제 구현 시 백엔드 API로 교체)
export const costAPI: CostAPI = {
  getCostRecords: async () => {
    // 실제 구현 시 백엔드 API 호출
    return Promise.resolve([]);
  },

  createCostRecord: async (record) => {
    // 실제 구현 시 백엔드 API 호출
    const newRecord: CostRecord = {
      ...record,
      id: Date.now() // 임시 ID 생성
    };
    return Promise.resolve(newRecord);
  },

  updateCostRecord: async (id, record) => {
    // 실제 구현 시 백엔드 API 호출
    return Promise.resolve({ ...record, id } as CostRecord);
  },

  deleteCostRecord: async (id) => {
    // 실제 구현 시 백엔드 API 호출
    return Promise.resolve();
  },

  getCostStatistics: async () => {
    // 실제 구현 시 백엔드 API 호출
    return Promise.resolve({
      totalAmount: 0,
      pendingAmount: 0,
      completedAmount: 0,
      byType: {},
      byStatus: {},
      monthlyTrend: []
    });
  },

  uploadAttachment: async (recordId, file) => {
    // 실제 구현 시 파일 업로드 API 호출
    return Promise.resolve();
  },

  deleteAttachment: async (recordId, attachmentId) => {
    // 실제 구현 시 파일 삭제 API 호출
    return Promise.resolve();
  }
};
