import React, { useState } from 'react';
import * as Setting from '../../Setting';
import { addMultiCenterDatasetRecordByIds } from '../../backend/MultiCenterBackend';

export default function AddRecordsMulticenter(props) {
    const [idsText, setIdsText] = useState('');
    const [recordText, setRecordText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // 使用公共工具解析 id 列表（支持逗号/空格/换行）
    // 解析逻辑放在 `Setting.parseIds`，便于多个页面复用和统一行为
    // `Setting.parseIds` 已经负责去重并保留输入顺序
    // const parseIds = (text) => Setting.parseIds(text);
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
        // 将 ids 转为整型（如果不是数字，parseInt 会产生 NaN，后续接口应校验）
        const intIds = ids.map((id) => parseInt(id));

        // 解析并验证可选的 record JSON（若用户提供）
        let record = null;
        if (recordText && recordText.trim()) {
            try {
                record = JSON.parse(recordText);
            } catch (e) {
                setError('record JSON 解析失败：' + e.message);
                return;
            }
        }

        // payload 中包含 ids 与可选的 record 字段（若为空则不传）
        const payload = { ids: intIds };
        if (record !== null) {
            payload.record = record;
        }

        try {
            setLoading(true);
            // 调用后端接口，将 ids（int数组）和可选 record 一并发送
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
