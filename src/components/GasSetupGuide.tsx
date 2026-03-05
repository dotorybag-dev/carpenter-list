import { Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function GasSetupGuide() {
  const [copied, setCopied] = useState(false);

  const gasCode = `// Google Apps Script Code (code.gs)
const SHEET_NAME = '카펜터'; // 시트 이름에 맞게 변경하세요

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      // 체크박스 값 (TRUE/FALSE) 처리
      if (header === '1' || header === '2' || header === '3') {
        obj[header] = row[index] === true || row[index] === 'TRUE';
      } else {
        obj[header] = row[index];
      }
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const { id, check1, check2, check3 } = params;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIndex = headers.indexOf('순번');
  const check1Index = headers.indexOf('1');
  const check2Index = headers.indexOf('2');
  const check3Index = headers.indexOf('3');
  
  if (idIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: '순번 컬럼을 찾을 수 없습니다.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      if (check1 !== undefined && check1Index !== -1) sheet.getRange(i + 1, check1Index + 1).setValue(check1);
      if (check2 !== undefined && check2Index !== -1) sheet.getRange(i + 1, check2Index + 1).setValue(check2);
      if (check3 !== undefined && check3Index !== -1) sheet.getRange(i + 1, check3Index + 1).setValue(check3);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'ID not found' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gasCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100 my-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 구글 시트 연동 설정 가이드</h2>
      
      <div className="space-y-6 text-gray-600">
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">1. 구글 시트 준비</h3>
          <p>새 구글 시트를 생성하고 첫 번째 행에 다음 컬럼들을 정확히 입력하세요:</p>
          <div className="bg-gray-50 p-3 rounded-lg mt-2 font-mono text-sm overflow-x-auto">
            순번 | 품목 | 사이즈 | 수량 | 출고일 | 끈 | 아일렛 | 비고 | 1 | 2 | 3
          </div>
          <p className="text-sm mt-2 text-gray-500">* '1', '2', '3' 컬럼은 체크박스 용도로 사용됩니다.</p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Apps Script 작성</h3>
          <p>시트 메뉴에서 <strong>확장 프로그램 &gt; Apps Script</strong>를 클릭하고 아래 코드를 붙여넣으세요.</p>
          
          <div className="relative mt-3">
            <div className="absolute right-2 top-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md hover:bg-gray-700 transition-colors"
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? '복사됨' : '코드 복사'}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
              <code>{gasCode}</code>
            </pre>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">3. 웹 앱으로 배포</h3>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>우측 상단의 <strong>배포 &gt; 새 배포</strong> 클릭</li>
            <li>유형 선택(톱니바퀴)에서 <strong>웹 앱</strong> 선택</li>
            <li>액세스 권한이 있는 사용자를 <strong>모든 사용자</strong>로 변경</li>
            <li><strong>배포</strong> 버튼 클릭 후 권한 검토 진행</li>
            <li>생성된 <strong>웹 앱 URL</strong>을 복사</li>
          </ol>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">4. 환경 변수 설정</h3>
          <p>AI Studio의 Secrets 패널에서 <code>VITE_GAS_URL</code> 환경 변수를 추가하고 복사한 URL을 값으로 설정하세요.</p>
        </section>
      </div>
    </div>
  );
}
