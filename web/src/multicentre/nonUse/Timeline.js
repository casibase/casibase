import React, { useEffect, useState } from 'react';
import { Timeline, Card, Spin, Empty, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

/*
  ChainTimeline 组件说明（增强注释）

  目的：在前端页面上显示“区块链上链时间线”（或任意带时间的事件列），便于用户查看与交易/上链相关的历史记录。

  使用场景示例：
  - 展示某数据集上链（create dataset）的 tx 记录
  - 展示数据使用授权在链上的消费/扣减事件
  - 展示任务（task）在链上的执行或结果日志

  Props 说明：
  - events: 可选。直接传入的事件数组（优先使用）。
    每个事件对象推荐字段：
      { time: string, title: string, description?: string, txId?: string, url?: string }
    - `time`：用于排序和显示，建议为 ISO 或 'YYYY-MM-DD HH:mm:ss' 格式
    - `title`：事件标题/类型
    - `description`：事件详情文本，可选（支持短文本）
    - `txId`：交易哈希（若无 url，可直接展示为 code）
    - `url`：区块浏览器链接（若提供，会渲染为“浏览交易”链接）

  - apiUrl: 可选。若未传 `events`，组件会尝试从该 URL 拉取事件数据。支持后端返回多种形态：
      - 直接返回数组： [ {..}, {..} ]
      - 包裹在 data 字段： { status: 'ok', data: [..] }
      - 或者 events 字段： { events: [..] }

  - pollInterval: 可选。毫秒数，>0 时会周期性轮询 `apiUrl`，默认不轮询。

  实现细节与设计选择：
  - 仅实现客户端渲染与简单的 fetch 逻辑（无鉴权/签名）；如果需要鉴权请在 fetch 时设置相应 headers 或在上层传入处理后的数据。
  - 当既没有 `events` 又没有成功拉取数据时，组件会显示示例数据（便于在本地或无后端时预览效果）。
  - 事件按 `time` 字段倒序展示（最新在上）；若时间字段缺失，会作为较老/较新的顺序处理（建议保证 time 字段格式统一）。
  - 在提取远程返回时，做了轻量的容错处理（兼容多种包装形式）。

  可扩展点（未来改进）：
  - 支持更多字段（如：account、action、confirmations、status 等）并在 UI 中增强展示
  - 支持分页/按时间范围加载（当事件非常多时）
  - 支持链上 tx 点击后弹窗显示更详细的 on-chain 元数据
*/

export default function ChainTimeline({ events: initialEvents, apiUrl, pollInterval = 0 }) {
    // internal state：events、loading、error
    const [events, setEvents] = useState(initialEvents || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 当没有初始 events 且提供了 apiUrl 时，从远端拉取
        let timer = null;
        if (!initialEvents && apiUrl) {
            const fetchEvents = async () => {
                setLoading(true);
                setError(null);
                try {
                    // 注意：这里没有设置额外 headers，如需鉴权可在调用处传入一个代理或者在 apiUrl 前端拼接 token
                    const res = await fetch(apiUrl, { credentials: 'same-origin' });
                    const body = await res.json();
                    // 兼容多种返回格式：直接数组 / {data: [...]} / {events: [...]}
                    let data = [];
                    if (Array.isArray(body)) data = body;
                    else if (body && body.data && Array.isArray(body.data)) data = body.data;
                    else if (body && body.events && Array.isArray(body.events)) data = body.events;
                    setEvents(data);
                } catch (e) {
                    // 仅在控制台与 UI 中展示错误信息，不抛出异常
                    console.error('fetch timeline error', e);
                    setError(String(e));
                } finally {
                    setLoading(false);
                }
            };

            fetchEvents();
            if (pollInterval > 0) {
                // 若需要定期刷新，设置轮询
                timer = setInterval(fetchEvents, pollInterval);
            }
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [apiUrl, initialEvents, pollInterval]);

    // 当没有任何事件数据时提供示例（仅作预览，不影响真实数据）
    const displayEvents = (events && events.length > 0) ? events : [
        { time: '2025-12-01 10:12:00', title: 'Tx: 创建数据集', description: '数据集 dataset_123 上传并创建记录', txId: '0xabc123', url: '' },
        { time: '2025-12-02 09:00:00', title: 'Tx: 使用授权', description: '授权 owner 使用 1 次', txId: '0xdef456', url: '' },
    ];

    // 简单按 time 倒序排序（最新在上）；如果 time 字段非字符串或格式不统一，可能需要上层传入已排序的数据
    const sorted = [...displayEvents].sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    return (
        <Card size="small" title="链上时间线" style={{ maxWidth: 980, margin: '12px auto' }}>
            {loading ? (
                // 加载中状态
                <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : error ? (
                // 错误信息展示
                <div style={{ color: 'red' }}>加载失败：{error}</div>
            ) : (!sorted || sorted.length === 0) ? (
                // 空状态占位
                <Empty description="暂无链上事件" />
            ) : (
                // 正常渲染时间线
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
                                    // 若提供 url，渲染为可点击链接；否则展示 txId 的 code 风格文本
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
