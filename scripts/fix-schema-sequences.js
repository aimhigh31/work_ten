const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'schema.sql');

console.log('📖 schema.sql 파일 읽는 중...');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

console.log('🔧 시퀀스를 SERIAL 타입으로 변환 중...');

// integer + nextval을 SERIAL로 변환
schemaContent = schemaContent.replace(
  /id integer NOT NULL DEFAULT nextval\('[^']+_id_seq'::regclass\)/gi,
  'id SERIAL NOT NULL'
);

// bigint + nextval을 BIGSERIAL로 변환
schemaContent = schemaContent.replace(
  /id bigint NOT NULL DEFAULT nextval\('[^']+_id_seq'::regclass\)/gi,
  'id BIGSERIAL NOT NULL'
);

// no integer + nextval도 SERIAL로 변환
schemaContent = schemaContent.replace(
  /no integer NOT NULL DEFAULT nextval\('[^']+_no_seq'::regclass\)/gi,
  'no SERIAL NOT NULL'
);

// 그 외 integer 타입 시퀀스들
schemaContent = schemaContent.replace(
  /(\w+) integer NOT NULL DEFAULT nextval\('([^']+)'::regclass\)/gi,
  '$1 SERIAL NOT NULL'
);

// 그 외 bigint 타입 시퀀스들
schemaContent = schemaContent.replace(
  /(\w+) bigint NOT NULL DEFAULT nextval\('([^']+)'::regclass\)/gi,
  '$1 BIGSERIAL NOT NULL'
);

// uuid + uuid_generate_v4()는 그대로 유지 (문제 없음)
// uuid + gen_random_uuid()도 그대로 유지 (문제 없음)

console.log('💾 수정된 파일 저장 중...');
fs.writeFileSync(schemaPath, schemaContent, 'utf8');

console.log('✅ schema.sql 수정 완료!');
console.log('📍 위치:', path.resolve(schemaPath));

// 변환 통계
const serialCount = (schemaContent.match(/SERIAL/gi) || []).length;
const bigserialCount = (schemaContent.match(/BIGSERIAL/gi) || []).length;
console.log(`📊 변환 통계:`);
console.log(`   - SERIAL: ${serialCount}개`);
console.log(`   - BIGSERIAL: ${bigserialCount}개`);
console.log(`   - 총: ${serialCount + bigserialCount}개 시퀀스 변환됨`);
