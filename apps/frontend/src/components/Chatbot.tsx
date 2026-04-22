
import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import {
    Affix, Drawer, Stack, TextInput, Paper, Text, ScrollArea,
    Group, ActionIcon, Loader, Anchor, Button, Alert
} from '@mantine/core';
import { IconSend, IconTrash, IconPaperclip, IconX, IconMicrophone, IconSquare } from '@tabler/icons-react';
//import ReactMarkdown from 'react-markdown';
//import remarkGfm from 'remark-gfm';
import { DOMAIN } from '../const';

export function Chatbot() {
    const [dbUsername, setDbUsername] = useState(localStorage.getItem('username') || '');
    const [displayName, setDisplayName] = useState(
        localStorage.getItem('first_name') || localStorage.getItem('username') || 'User'
    );
    const [opened, setOpened] = useState(false);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [initialGreeting, setInitialGreeting] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const toggleVoiceInput = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support voice input. Please use Chrome, Edge, or Safari.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            // Stitch the transcribed words together
            const transcript = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join('');

            setInput(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    useEffect(() => {
        if (!dbUsername) {
            setInitialGreeting("Hello! I am WongBot, the Hanover Insurance AI assistant. Please log in to access my features.");
            return; // Stops the code here so guests never see the other greetings
        }
        const greetings = [
            `How can I help you with your documents today, ${displayName}?`,
            `What are we diving into today, ${displayName}?`,
            `Hello ${displayName}! How can I assist you right now?`,
            `Ready to tackle some documents, ${displayName}?`,
            `Welcome back, ${displayName}! What's on the agenda?`,
            `Hi ${displayName}, what can I help you find today?`,
            `Greetings ${displayName}! Need some help navigating the portal?`,
            `Hello ${displayName}. Point me to the documents you need!`,
            `Hey ${displayName}, let's get some work done. What do you need?`,
            `Welcome ${displayName}. How can I make your workflow easier today?`,
            `Ready when you are, ${displayName}. What are we looking for?`,
            `Hey ${displayName}! Got a question about your files?`,
            `Good to see you, ${displayName}. What's on your mind?`,
            `Hi ${displayName}. Point the way and I'll help you navigate!`,
            `${displayName} returns! Got a question I can help you with?`,
        ];
        setInitialGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    }, [displayName]);

    const savedHistory = (): UIMessage[] => {
        try {
            const saved = sessionStorage.getItem('chatHistory');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse chat history:', e);
        }
        return [];
    };

    const { messages, setMessages, sendMessage, status, error, stop } = useChat({
        transport: new DefaultChatTransport({
            api: `${DOMAIN}/api/chat`,
            body: {
                username: dbUsername,
                displayName: displayName
            }
        }),
        messages: savedHistory(),
        onError: (err) => {
            console.error('Chat error:', err);
        },
        onFinish: () => {
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        }
    });

    useEffect(() => {
        for (const m of messages) {
            const parts = m.parts as any[];
            if (!parts) continue;
            for (const part of parts) {
                if (
                    part.type === 'tool-changeTheme' &&
                    part.state === 'output-available' &&
                    part.output?.themeChange
                ) {
                    const newTheme = part.output.themeChange;
                    console.log('applying theme:', newTheme);
                    localStorage.setItem('theme', newTheme);
                    document.documentElement.setAttribute(
                        'data-theme',
                        newTheme === 'high-visibility' ? 'high-visibility' : ' '
                    );
                    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
                }
            }
        }
    }, [messages]);

    useEffect(() => {
        if (messages.length > 0) {
            const clean = messages.filter(m => {
                if (m.role === 'user') return true;
                if (m.role === 'assistant') {
                    const parts = m.parts as any[];
                    if (!parts || parts.length === 0) return false;
                    const hasBrokenToolCall = parts.some(
                        p => p.type === 'tool-invocation' && p.toolInvocation?.state !== 'result'
                    );
                    return !hasBrokenToolCall;
                }
                return false;
            });
            sessionStorage.setItem('chatHistory', JSON.stringify(clean));
        }
    }, [messages]);

    useEffect(() => {
        const interval = setInterval(() => {
            const freshUsername = localStorage.getItem('username') || '';
            const freshDisplayName = localStorage.getItem('first_name') || localStorage.getItem('username') || 'User';
            if (freshUsername !== dbUsername) {
                setDbUsername(freshUsername);
                setDisplayName(freshDisplayName);
                setMessages([]);
                sessionStorage.removeItem('chatHistory');
            }
        }, 500);
        return () => clearInterval(interval);
    }, [dbUsername, setMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || status === 'submitted' || status === 'streaming') return;

        let messageText = input.trim();

        if (attachedFile) {
            // upload the file first
            const formPayload = new FormData();
            formPayload.append('file', attachedFile);
            formPayload.append('filename', attachedFile.name);
            formPayload.append('ownerUsername', dbUsername);
            formPayload.append('date_modified', new Date().toISOString().split('T')[0]);
            formPayload.append('expiration_date', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            formPayload.append('content_type', 'Reference');
            formPayload.append('status', 'In Progress');

            try {
                const uploadRes = await fetch(`${DOMAIN}/api/chat/upload`, {
                    method: 'POST',
                    body: formPayload
                });
                const uploadData = await uploadRes.json();

                // append the file URL to the message so the AI knows about it
                messageText += ` (File already uploaded, use this URL for the document: ${uploadData.url})`;
            } catch (err) {
                console.error('File upload failed:', err);
            }

            setAttachedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }

        sendMessage({ text: messageText });
        setInput('');
    };

    const clearHistory = () => {
        setMessages([]);
        sessionStorage.removeItem('chatHistory');
    };

    return (
        <>
            <Affix position={{ bottom: 20, right: 20 }}>
                <ActionIcon
                    size={64}
                    radius="xl"
                    onClick={() => setOpened(true)}
                    style={{
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: '2px solid var(--color-fresh-sky)',
                        overflow: 'hidden'
                    }}
                >
                    <img
                        src="/wong.jpg"
                        alt="Open Chat"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </ActionIcon>
            </Affix>

            <Drawer
                opened={opened}
                onClose={() => setOpened(false)}
                title={
                    <Group justify="space-between" w="100%">
                        <Text fw={700} size="lg" c="var(--color-yale-blue)">WongBot</Text>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={clearHistory}
                            title="Clear chat history"
                        >
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Group>
                }
                position="right"
                size="md"
                //wong wong wong wong wong
                styles={{
                    content: {
                        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url(/wong.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    },
                    header: {
                        backgroundColor: 'transparent',
                    }
                }}
            >
                <Stack h="calc(100vh - 120px)" justify="space-between">
                    <ScrollArea flex={1} type="auto" viewportRef={scrollRef}>
                        <Stack gap="sm" p="xs">

                            {/* Greeting */}
                            {messages.length === 0 && (
                                <Text c="dimmed" ta="center" mt="md" size="sm">
                                    {initialGreeting}
                                </Text>
                            )}

                            {/* Quick action buttons which don't really work as intended */}
                            {messages.length === 0 && dbUsername && (
                                <Group gap="xs" justify="center" mt="xs">
                                    {[
                                        { label: '📄 My Documents', query: 'Show me my documents' },
                                        { label: '👥 Find Employee', query: 'How do I find an employee?' },
                                        { label: '🔍 Search Docs', query: 'Show me a list of all current documents' },
                                    ].map((action, idx) => (
                                        <Button
                                            key={idx}
                                            size="xs"
                                            variant="light"
                                            onClick={() => {
                                                sendMessage({ text: action.query });
                                            }}
                                            disabled={status === 'submitted' || status === 'streaming'}
                                        >
                                            {action.label}
                                        </Button>
                                    ))}
                                </Group>
                            )}

                            {/* Messages */}
                            {messages.map(m => (
                                <Group
                                    key={m.id}
                                    justify={m.role === 'user' ? 'flex-end' : 'flex-start'}
                                    mb="xs"
                                >
                                    <Paper
                                        p="sm"
                                        radius="lg"
                                        style={{
                                            maxWidth: '85%',
                                            backgroundColor: m.role === 'user'
                                                ? 'var(--color-fresh-sky, #007bff)'
                                                : '#f1f3f5',
                                            color: m.role === 'user' ? 'white' : 'black'
                                        }}
                                    >
                                        <Text
                                            size="xs"
                                            c={m.role === 'user' ? '#e0f7ff' : 'dimmed'}
                                            mb={4}
                                            fw={500}
                                        >
                                            {m.role === 'user' ? displayName : '🤖 WongBot'}
                                        </Text>

                                        {/* Render text parts */}
                                        {(m.parts as any[])
                                            ?.filter(p => p.type === 'text' && p.text?.trim())
                                            .map((part, i) => (
                                                <div key={i} style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            a: ({ node, ...props }) => {
                                                                void node;
                                                                return (
                                                                    <Anchor
                                                                        {...props}
                                                                        target="_blank"
                                                                        c={m.role === 'user' ? 'white' : 'blue'}
                                                                        fw={500}
                                                                        underline="hover"
                                                                    />
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {part.text}
                                                    </ReactMarkdown>
                                                </div>
                                            ))}

                                        {/* Tool loading indicator */}
                                        {(m.parts as any[])?.some(
                                            p => p.type === 'tool-invocation' && p.toolInvocation?.state !== 'result'
                                        ) && (
                                            <Group gap="xs" mt="xs">
                                                <Loader size="xs" color="gray" type="dots" />
                                                <Text size="xs" c="dimmed" fs="italic">
                                                    Searching database...
                                                </Text>
                                            </Group>
                                        )}
                                    </Paper>
                                </Group>
                            ))}

                            {/* Global loading indicator */}
                            {status === 'submitted' && (
                                <Group justify="flex-start" mb="sm">
                                    <Paper p="sm" radius="lg" style={{ backgroundColor: '#f1f3f5' }}>
                                        <Group gap="xs">
                                            <Loader size="sm" type="dots" />
                                            <Text size="sm" c="dimmed">WongBot is thinking...</Text>
                                        </Group>
                                    </Paper>
                                </Group>
                            )}

                            {error && (
                                <Group justify="center" mb="sm" px="md">
                                    <Alert
                                        color="red"
                                        variant="light"
                                        title="Service Unavailable"
                                        icon={<IconX size={16} />}
                                    >
                                        <Text size="sm">
                                            WongBot (Mistral) is currently experiencing an outage or rate limit error. Please try again in a few minutes!
                                        </Text>
                                    </Alert>
                                </Group>
                            )}
                        </Stack>
                    </ScrollArea>

                    <form onSubmit={handleSubmit}>
                        {/* show attached file name if one is selected */}
                        {attachedFile && (
                            <Group gap="xs" mb={4}>
                                <Text size="xs" c="dimmed">📎 {attachedFile.name}</Text>
                                <ActionIcon size="xs" variant="subtle" color="red" onClick={() => {
                                    setAttachedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}>
                                    <IconX size={12} />
                                </ActionIcon>
                            </Group>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
                        />
                        <TextInput
                            placeholder={isListening ? "Listening..." : "Ask me anything about documents..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={status === 'submitted' || status === 'streaming'}
                            rightSectionWidth={70}
                            leftSection={
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={status === 'submitted' || status === 'streaming'}
                                >
                                    <IconPaperclip size={16} />
                                </ActionIcon>
                            }
                            rightSection={
                                <Group gap={4} mr={4} wrap="nowrap">
                                    <ActionIcon
                                        variant={isListening ? "filled" : "subtle"}
                                        color={isListening ? "red" : "gray"}
                                        onClick={toggleVoiceInput}
                                        disabled={status === 'submitted' || status === 'streaming'}
                                        title="Use Voice Input"
                                    >
                                        <IconMicrophone size={16} />
                                    </ActionIcon>

                                    {status === 'submitted' || status === 'streaming' ? (
                                        <ActionIcon
                                            color="red"
                                            variant="filled"
                                            onClick={() => stop()}
                                            title="Stop generating"
                                        >
                                            <IconSquare size={14} fill="currentColor" />
                                        </ActionIcon>
                                    ) : (
                                        <ActionIcon
                                            type="submit"
                                            color="blue"
                                            variant="filled"
                                            disabled={!input.trim()}
                                        >
                                            <IconSend size={16} />
                                        </ActionIcon>
                                    )}
                                </Group>
                            }
                        />
                    </form>
                </Stack>
            </Drawer>
        </>
    );
}
