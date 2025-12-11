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

    // 格式化时间，统一显示格式，抽离为小函数便于复用/测试
    const formatTime = (iso) => {
        try {
            return new Date(iso).toLocaleString();
        } catch (e) {
            return iso || '';
        }
    };

    // 渲染单条消息的气泡，抽离可让 renderItem 更清晰
    const renderMessage = (item) => {
        const isUser = item.role === 'user';
        return (
            <List.Item style={{ padding: '6px 4px', display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '80%' }}>
                    {!isUser && (
                        <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
                    )}
                    <div style={{
                        background: isUser ? '#1890ff' : '#f5f5f5',
                        color: isUser ? '#ffffff' : '#000000',
                        padding: '10px 14px',
                        borderRadius: 14,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        wordBreak: 'break-word'
                    }}>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{item.text}</div>
                        <div style={{ fontSize: 11, color: isUser ? 'rgba(255,255,255,0.85)' : '#888', marginTop: 6, textAlign: isUser ? 'right' : 'left' }}>{formatTime(item.time)}</div>
                    </div>
                    {isUser && (
                        <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                    )}
                </div>
            </List.Item>
        );
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        try {
            if (listRef.current) {
                const el = listRef.current;
                el.scrollTop = el.scrollHeight;
            }
        } catch (e) {
            // ignore
        }
    };

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const msg = {
            id: Date.now(),
            role: 'user',
            text: trimmed,
            time: new Date().toISOString(),
        };

        // 本地回显
        setMessages((m) => [...m, msg]);
        setText('');

        if (onSend) {
            try {
                setSending(true);
                await onSend(msg);
            } catch (e) {
                // 可在这里追加错误消息或 toast 提示
                console.error('onSend error', e);
                <List
                    dataSource={messages}
                    renderItem={(item) => renderMessage(item)}
                />
            >
                <List
                    dataSource={messages}
                    renderItem={(item) => {
                        const isUser = item.role === 'user';
                        return (
                            <List.Item style={{ padding: '6px 4px', display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '80%' }}>
                                    {!isUser && (
                                        <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
                                    )}
                                    <div style={{
                                        background: isUser ? '#1890ff' : '#f5f5f5',
                                        color: isUser ? '#ffffff' : '#000000',
                                        padding: '10px 14px',
                                        borderRadius: 14,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                        wordBreak: 'break-word'
                                    }}>
                                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{item.text}</div>
                                        <div style={{ fontSize: 11, color: isUser ? 'rgba(255,255,255,0.85)' : '#888', marginTop: 6, textAlign: isUser ? 'right' : 'left' }}>{new Date(item.time).toLocaleString()}</div>
                                    </div>
                                    {isUser && (
                                        <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                    )}
                                </div>
                            </List.Item>
                        );
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <Input.TextArea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="输入消息，按 Enter 发送，Shift+Enter 换行"
                    autoSize={{ minRows: 2, maxRows: 5 }}
                    onKeyDown={onKeyDown}
                    style={{ borderRadius: 8 }}
                />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button type="primary" onClick={handleSend} loading={sending} style={{ borderRadius: 8 }}>
                        发送
                    </Button>
                </div>
            </div>
        </Card>
    );
}
