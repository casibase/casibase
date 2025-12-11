import React, { useEffect, useState } from 'react';
import { Timeline, Card, Spin, Empty, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

/**
 * 简单的链上时间线组件
 * props:
 * - events: 可选，数组，元素格式 { time: string, title: string, description?: string, txId?: string, url?: string }
 * - apiUrl: 可选，用于动态拉取事件的接口，返回 JSON 或者 { status: 'ok', data: [...] }
 * - pollInterval: 可选，轮询毫秒数（默认不轮询）
 */
export default function ChainTimeline({ events: initialEvents, apiUrl, pollInterval = 0 }) {
    const [events, setEvents] = useState(initialEvents || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let timer = null;
        if (!initialEvents && apiUrl) {
            const fetchEvents = async () => {
                setLoading(true);
                setError(null);
                try {
                    const res = await fetch(apiUrl, { credentials: 'same-origin' });
                    const body = await res.json();
                    // 兼容返回 {status:'ok', data: [...] } 或直接数组
                    let data = [];
                    if (Array.isArray(body)) data = body;
                    else if (body && body.data && Array.isArray(body.data)) data = body.data;
                    else if (body && body.events && Array.isArray(body.events)) data = body.events;
                    setEvents(data);
                } catch (e) {
                    console.error('fetch timeline error', e);
                    setError(String(e));
                } finally {
                    setLoading(false);
                }
            };

            fetchEvents();
            if (pollInterval > 0) {
                timer = setInterval(fetchEvents, pollInterval);
            }
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [apiUrl, initialEvents, pollInterval]);

    // 若没有数据，展示一个简单示例，方便本地预览
    const displayEvents = (events && events.length > 0) ? events : [
        { time: '2025-12-01 10:12:00', title: 'Tx: 创建数据集', description: '数据集 dataset_123 上传并创建记录', txId: '0xabc123', url: '' },
        { time: '2025-12-02 09:00:00', title: 'Tx: 使用授权', description: '授权 owner 使用 1 次', txId: '0xdef456', url: '' },
    ];

    // 按时间倒序显示（最新在上）
    const sorted = [...displayEvents].sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    return (
        <Card size="small" title="链上时间线" style={{ maxWidth: 980, margin: '12px auto' }}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : error ? (
                <div style={{ color: 'red' }}>加载失败：{error}</div>
            ) : (!sorted || sorted.length === 0) ? (
                <Empty description="暂无链上事件" />
            ) : (
                <Timeline>
                    {sorted.map((ev, idx) => (
                        <Timeline.Item key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <Text strong>{ev.title || '未命名事件'}</Text>
                                    {ev.description ? <Paragraph style={{ margin: '6px 0' }}>{ev.description}</Paragraph> : null}
                                    <div style={{ color: '#888' }}>{ev.time}</div>
                                </div>
                                {ev.txId || ev.url ? (
                                    <div style={{ whiteSpace: 'nowrap', marginLeft: 12 }}>
                                        {ev.url ? (
                                            <a href={ev.url} target="_blank" rel="noreferrer"><LinkOutlined /> 浏览交易</a>
                                        ) : (
                                            <div><Text code>{ev.txId}</Text></div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </Timeline.Item>
                    ))}
                </Timeline>
            )}
        </Card>
    );
}
