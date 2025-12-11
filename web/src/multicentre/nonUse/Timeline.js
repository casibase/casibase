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
