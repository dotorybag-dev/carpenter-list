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

// ⚠️ 여기에 사용자님의 웹 앱 URL을 직접 넣으세요!
const GAS_URL = "https://script.google.com/macros/s/AKfycbzqF0tn0zy1w8hjOPuDr8wgZsvhVZFdxdzG8rpIFrCyn4vLRp6ayNSk20MPT3rdrLBd/exec";

export default function App() {
  const [data, setData] = useState<GasRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // 캐시 방지를 위해 랜덤 쿼리 추가
      const response = await fetch(`${GAS_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
      
      const result = await response.json();
      const formattedResult = result.map((row: any) => ({
        ...row,
        '1': row['1'] === true || row['1'] === 'TRUE',
        '2': row['2'] === true || row['2'] === 'TRUE',
        '3': row['3'] === true || row['3'] === 'TRUE',
      }));
      
      setData(formattedResult);
    } catch (err: any) {
      setError('데이터를 불러올 수 없습니다. URL 배포 설정(모든 사용자)을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000); // 30초마다 자동 새로고침
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const handleCheck = async (id: string | number, field: '1' | '2' | '3', currentValue: boolean) => {
    const newValue = !currentValue;
    
    // 화면에 먼저 반영 (Optimistic update)
    setData(prevData => 
      prevData.map(row => 
        row['순번'] === id ? { ...row, [field]: newValue } : row
      )
    );
    
    setUpdatingId(String(id));
    
    try {
      // ⚠️ Code.gs의 규격에 맞춰 페이로드 수정
      const payload = {
        id: String(id),
        column: field,
        value: newValue
      };
      
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
    } catch (err) {
      // 실패 시 원래대로 복구
      setData(prevData => 
        prevData.map(row => 
          row['순번'] === id ? { ...row, [field]: currentValue } : row
        )
      );
      alert('저장에 실패했습니다. 시트 권한을 확인하세요.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredData = data.filter(row => 
    row['품목']?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch {
      return dateStr;
    }
  };

  // Define columns to display (excluding '순번')
  const columns = [
    { key: '품목', width: 'w-auto' },
    { key: '사이즈', width: 'w-16' },
    { key: '수량', width: 'w-16' },
    { key: '출고일', width: 'w-24' },
    { key: '끈', width: 'w-16' },
    { key: '아일렛', width: 'w-16' },
    { key: '비고', width: 'w-32' },
    { key: '1', width: 'w-10' },
    { key: '2', width: 'w-10' },
    { key: '3', width: 'w-10' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">카펜터 발주서</h1>
            <p className="text-xs text-gray-500 mt-1">공유자와 실시간으로 체크 상태가 동기화됩니다.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="품목 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 bg-white border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm border border-gray-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  {columns.map((col) => (
                    <th 
                      key={col.key} 
                      className={`px-2 py-2 border border-gray-300 text-center text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap ${col.width}`}
                    >
                      {col.key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">데이터가 없습니다.</td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const isChecked = row['1'] || row['2'] || row['3'];
                    // Removed isUpdating blocking to allow multiple rapid clicks
                    
                    return (
                      <tr 
                        key={row['순번'] || idx} 
                        className={`
                          ${isChecked ? 'bg-green-100' : 'hover:bg-gray-50'} 
                          transition-colors
                        `}
                      >
                        <td className="px-2 py-1.5 border border-gray-300 text-sm font-medium text-gray-900">{row['품목']}</td>
                        <td className="px-2 py-1.5 border border-gray-300 text-sm text-center">{row['사이즈']}</td>
                        <td className="px-2 py-1.5 border border-gray-300 text-sm text-center">{row['수량']}</td>
                        <td className="px-2 py-1.5 border border-gray-300 text-sm text-center">{formatDate(row['출고일'])}</td>
                        <td className="px-2 py-1.5 border border-gray-300 text-sm text-center">{row['끈']}</td>
                        <td className="px-2 py-1.5 border border-gray-300 text-sm text-center">{row['아일렛']}</td>
                        <td className="px-2 py-1.5 border border-gray-300 text-sm max-w-xs truncate">{row['비고']}</td>
                        
                        {(['1', '2', '3'] as const).map((field) => (
                          <td key={field} className="px-1 py-1 border border-gray-300 text-center w-10">
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