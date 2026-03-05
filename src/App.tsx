import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface GasRow {
  '순번': string | number;
  '품목': string;
  '사이즈': string;
  '수량': string | number;
  '출고일': string;
  '끈': string;
  '아일렛': string;
  '비고': string;
  '1': boolean;
  '2': boolean;
  '3': boolean;
}

// ⚠️ 실제 구글 앱스 스크립트 웹 앱 URL을 넣으세요.
const GAS_URL = "https://script.google.com/macros/s/AKfycbzqF0tn0zy1w8hjOPuDr8wgZsvhVZFdxdzG8rpIFrCyn4vLRp6ayNSk20MPT3rdrLBd/exec";

export default function App() {
  const [data, setData] = useState<GasRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 데이터 불러오기 함수
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${GAS_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error('데이터 연결 실패');
      
      const result = await response.json();
      const formattedResult = result.map((row: any) => ({
        ...row,
        '1': row['1'] === true || row['1'] === 'TRUE',
        '2': row['2'] === true || row['2'] === 'TRUE',
        '3': row['3'] === true || row['3'] === 'TRUE',
      }));
      
      setData(formattedResult);
    } catch (err: any) {
      setError('시트 데이터를 가져올 수 없습니다. 권한 설정을 확인하세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000); // 30초마다 갱신
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // 체크박스 핸들러 (모바일 최적화)
  const handleCheck = async (id: string | number, field: '1' | '2' | '3', currentValue: boolean) => {
    const newValue = !currentValue;
    
    // 1. 화면에 먼저 즉시 반영 (낙관적 업데이트)
    setData(prevData => 
      prevData.map(row => 
        row['순번'] === id ? { ...row, [field]: newValue } : row
      )
    );
    
    try {
      // 2. 서버(GAS)에 데이터 전송
      const payload = {
        id: String(id),
        column: field,
        value: newValue
      };
      
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // GAS 권한 이슈 방지를 위한 설정
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!result.success) throw new Error();
    } catch (err) {
      // 실패 시 원래대로 복구
      setData(prevData => 
        prevData.map(row => 
          row['순번'] === id ? { ...row, [field]: currentValue } : row
        )
      );
      alert('저장에 실패했습니다. 시트의 공유/편집 권한을 확인하세요.');
    }
  };

  const filteredData = data.filter(row => 
    row['품목']?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const columns = [
    { key: '품목', width: 'min-w-[120px]' },
    { key: '사이즈', width: 'w-16' },
    { key: '수량', width: 'w-12' },
    { key: '출고일', width: 'w-14' },
    { key: '끈', width: 'w-12' },
    { key: '아일렛', width: 'w-12' },
    { key: '비고', width: 'min-w-[100px]' },
    { key: '1', width: 'w-10' },
    { key: '2', width: 'w-10' },
    { key: '3', width: 'w-10' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-2 py-4">
        
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center mb-4 px-1">
          <div>
            <h1 className="text-lg font-bold">카펜터 발주 관리</h1>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="품목 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-1 border border-gray-400 rounded text-sm w-32 sm:w-48"
            />
            <button onClick={fetchData} className="p-1.5 bg-white border border-gray-400 rounded">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 p-2 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {/* 테이블 영역 */}
        <div className="bg-white border border-gray-400 overflow-hidden rounded-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={`border border-gray-400 px-1 py-2 text-[11px] font-bold text-gray-700 ${col.width}`}>
                      {col.key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading && data.length === 0 ? (
                  <tr><td colSpan={10} className="py-10 text-center text-sm">로딩 중...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={10} className="py-10 text-center text-sm">데이터가 없습니다.</td></tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const isRowDone = row['1'] && row['2'] && row['3'];
                    return (
                      <tr key={row['순번'] || idx} className={`${isRowDone ? 'bg-gray-100 text-gray-400' : 'hover:bg-blue-50'}`}>
                        <td className="border border-gray-300 px-1 py-2 text-xs font-bold">{row['품목']}</td>
                        <td className="border border-gray-300 px-1 py-2 text-[10px] text-center">{row['사이즈']}</td>
                        <td className="border border-gray-300 px-1 py-2 text-xs text-center">{row['수량']}</td>
                        <td className="border border-gray-300 px-1 py-2 text-xs text-center">{formatDate(row['출고일'])}</td>
                        <td className="border border-gray-300 px-1 py-2 text-xs text-center">{row['끈']}</td>
                        <td className="border border-gray-300 px-1 py-2 text-xs text-center">{row['아일렛']}</td>
                        <td className="border border-gray-300 px-1 py-2 text-xs max-w-xs truncate">{row['비고']}</td>
                        
                        {(['1', '2', '3'] as const).map((field) => (
                          <td key={field} className="border border-gray-300 px-1 py-1 text-center w-10">
                            <div className="flex items-center justify-center h-full">
                              <input
                                type="checkbox"
                                checked={row[field]}
                                onChange={() => handleCheck(row['순번'], field, row[field])}
                                className="h-5 w-5 text-indigo-600 border-gray-300 rounded cursor-pointer focus:ring-0"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}