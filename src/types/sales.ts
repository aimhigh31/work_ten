// 매출관리 타입 정의

export interface SalesRecord {
  id: number;
  registrationDate: string; // registration_date from DB
  code: string;
  customerName: string; // customer_name from DB
  salesType: string; // sales_type from DB
  status: string;
  businessUnit: string; // business_unit from DB
  modelCode: string; // model_code from DB
  itemCode: string; // item_code from DB
  itemName: string; // item_name from DB
  quantity: number;
  unitPrice: number; // unit_price from DB
  totalAmount: number; // total_amount from DB
  team: string;
  registrant: string;
  deliveryDate: string; // delivery_date from DB
  notes: string;
  contractDate?: string; // contract_date from DB
  assignee?: string;
  createdAt?: string; // created_at from DB
  updatedAt?: string; // updated_at from DB
  createdBy?: string; // 데이터 생성자 (권한 체크용)
}

// DB에서 가져온 데이터 타입 (snake_case)
export interface SalesRecordDB {
  id: number;
  registration_date: string;
  code: string;
  customer_name: string;
  sales_type: string;
  status: string;
  business_unit: string;
  model_code: string;
  item_code: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  team: string;
  registrant: string;
  delivery_date: string;
  notes: string;
  contract_date?: string;
  assignee?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// 새 매출 생성 시 입력 데이터
export interface CreateSalesInput {
  code: string;
  customerName: string;
  salesType: string;
  status: string;
  businessUnit: string;
  modelCode: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  team: string;
  registrant: string;
  deliveryDate: string;
  notes?: string;
  contractDate?: string;
  assignee?: string;
  registrationDate?: string;
  createdBy?: string; // 권한 체크용 생성자 user_name
}

// 매출 업데이트 시 입력 데이터
export interface UpdateSalesInput {
  customerName?: string;
  salesType?: string;
  status?: string;
  businessUnit?: string;
  modelCode?: string;
  itemCode?: string;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  team?: string;
  registrant?: string;
  deliveryDate?: string;
  notes?: string;
  contractDate?: string;
  assignee?: string;
  createdBy?: string; // 권한 체크용 생성자 user_name
}

// DB 데이터를 프론트엔드 형식으로 변환
export function convertSalesFromDB(dbData: SalesRecordDB): SalesRecord {
  return {
    id: dbData.id,
    registrationDate: dbData.registration_date,
    code: dbData.code,
    customerName: dbData.customer_name,
    salesType: dbData.sales_type,
    status: dbData.status,
    businessUnit: dbData.business_unit,
    modelCode: dbData.model_code,
    itemCode: dbData.item_code,
    itemName: dbData.item_name,
    quantity: dbData.quantity,
    unitPrice: dbData.unit_price,
    totalAmount: dbData.total_amount,
    team: dbData.team,
    registrant: dbData.registrant,
    deliveryDate: dbData.delivery_date,
    notes: dbData.notes,
    contractDate: dbData.contract_date,
    assignee: dbData.assignee,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
    createdBy: dbData.created_by
  };
}

// 프론트엔드 형식을 DB 형식으로 변환
export function convertSalesToDB(frontendData: Partial<SalesRecord>): Partial<SalesRecordDB> {
  const dbData: Partial<SalesRecordDB> = {};

  if (frontendData.registrationDate !== undefined) dbData.registration_date = frontendData.registrationDate;
  if (frontendData.code !== undefined) dbData.code = frontendData.code;
  if (frontendData.customerName !== undefined) dbData.customer_name = frontendData.customerName;
  if (frontendData.salesType !== undefined) dbData.sales_type = frontendData.salesType;
  if (frontendData.status !== undefined) dbData.status = frontendData.status;
  if (frontendData.businessUnit !== undefined) dbData.business_unit = frontendData.businessUnit;
  if (frontendData.modelCode !== undefined) dbData.model_code = frontendData.modelCode;
  if (frontendData.itemCode !== undefined) dbData.item_code = frontendData.itemCode;
  if (frontendData.itemName !== undefined) dbData.item_name = frontendData.itemName;
  if (frontendData.quantity !== undefined) dbData.quantity = frontendData.quantity;
  if (frontendData.unitPrice !== undefined) dbData.unit_price = frontendData.unitPrice;
  if (frontendData.totalAmount !== undefined) dbData.total_amount = frontendData.totalAmount;
  if (frontendData.team !== undefined) dbData.team = frontendData.team;
  if (frontendData.registrant !== undefined) dbData.registrant = frontendData.registrant;
  if (frontendData.deliveryDate !== undefined) dbData.delivery_date = frontendData.deliveryDate;
  if (frontendData.notes !== undefined) dbData.notes = frontendData.notes;
  if (frontendData.contractDate !== undefined) dbData.contract_date = frontendData.contractDate;
  if (frontendData.assignee !== undefined) dbData.assignee = frontendData.assignee;
  // createdBy는 DB 컬럼이 없으므로 제외

  return dbData;
}
