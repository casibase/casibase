import React, { useState } from 'react';
import * as Setting from '../../Setting';
import { addMultiCenterDatasetRecordByIds } from '../../backend/MultiCenterBackend';

export default function AddRecordsMulticenter(props) {
    const [idsText, setIdsText] = useState('');
    const [recordText, setRecordText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const parseIds = (text) => {
        if (!text) return [];
        // 支持逗号/空格/换行分隔
        return text
            .split(/[,\n\s]+/)
            .map(s => s.trim())
            .filter(Boolean);
    };

    const handleUpload = async () => {
        setError(null);
        setResult(null);
        const ids = parseIds(idsText);
        if (!ids.length) {
            setError('请填写至少一个 id（用逗号/回车分隔）');
            return;
        }
        // 将ids转为int数组
        ids.forEach((id, index) => {
            ids[index] = parseInt(id);
        });

        let record = null;
        if (recordText && recordText.trim()) {
            try {
                record = JSON.parse(recordText);
            } catch (e) {
                setError('record JSON 解析失败：' + e.message);
                return;
            }
        }

        const payload = { ids };

        try {
            setLoading(true);
            const resp = await addMultiCenterDatasetRecordByIds(payload);
            setResult(resp);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setIdsText('');
        setRecordText('');
        setResult(null);
        setError(null);
    };

    return (
        <div style={{ maxWidth: 980, margin: '12px auto', padding: 12 }}>
            <h3>向多中心 records 添加内容</h3>
            <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>目标记录 ID 列表（逗号/空格/换行 分隔）：</label>
                <textarea value={idsText} onChange={e => setIdsText(e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>


            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <button onClick={handleUpload} disabled={loading} style={{ padding: '8px 16px' }}>
                    {loading ? '上传中...' : '上传到 records'}
                </button>
                <button onClick={handleClear} style={{ padding: '8px 12px' }}>清空</button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: 8 }}>错误：{String(error)}</div>}

            {result && (
                <div style={{ marginTop: 8 }}>
                    <div>返回结果：</div>
                    <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
