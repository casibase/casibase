import React, { useEffect, useRef, useState } from 'react';
import { Card, List, Input, Button, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

/**
 * 简单聊天组件（前端仅展示）
 * - props:
 *    - onSend(message): 可选，发送消息的回调；如果不提供，组件会在本地回显消息
 *    - initialMessages: 可选，初始消息数组，元素格式 {id, role: 'user'|'bot', text, time}
 *
 * 行为：
 * - 支持按 Enter 发送（shift+enter 换行）
 * - 发送后输入框清空，消息追加到消息列表并滚动到底部
 * - UI 使用 Ant Design 简单布局，易于集成
 */

export default function Chat({ onSend, initialMessages = [] }) {
    const [messages, setMessages] = useState(initialMessages || []);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);



    return (
        <Card size="small" title="简单聊天（前端）" style={{ maxWidth: 900, margin: '12px auto' }}>
            <div
                ref={listRef}
                style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 4px', marginBottom: 12, border: '1px solid #f0f0f0', borderRadius: 4 }}
            >
                <List
                    dataSource={messages}
                    renderItem={(item) => (
                        <List.Item style={{ padding: '6px 12px' }}>
                            <List.Item.Meta
                                avatar={
                                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: item.role === 'user' ? '#1890ff' : '#52c41a' }} />
                                }
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                        <div>{item.role === 'user' ? 'User' : 'Bot'}</div>
                                        <div style={{ color: '#999', fontSize: 12 }}>{new Date(item.time).toLocaleString()}</div>
                                    </div>
                                }
                                description={<div style={{ whiteSpace: 'pre-wrap' }}>{item.text}</div>}
                            />
                        </List.Item>
                    )}
                />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <Input.TextArea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="输入消息，按 Enter 发送，Shift+Enter 换行"
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    onKeyDown={onKeyDown}
                />
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button type="primary" onClick={handleSend} loading={sending}>
                        发送
                    </Button>
                </div>
            </div>
        </Card>
    );
}
