import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, FileText, MessageCircle, MessageSquarePlus, Send, Sparkles, Trash2, UserRound } from 'lucide-react';
import { chatApi } from '../api';
import { queryKeys } from '../utils/queryKeys';
import Button from './Button';
import LoadingState from './LoadingState';
import ErrorBanner from './ErrorBanner';

function FormattedAnswer({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-slate-950">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="text-slate-500">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function formatLegacyMilestoneAnswer(message, previousMessage) {
  if (message.role !== 'assistant' || !/\bwhen\b/i.test(previousMessage?.content || '')) return null;
  const row = message.content.split('\n').find((line) => line.includes('|') && !/^\s*\|?[\s:|-]+\|?\s*$/.test(line));
  if (!row) return null;
  const cells = row.split('|').map((cell) => cell.trim()).filter(Boolean);
  if (cells.length < 3) return null;

  const label = cells[0].replace(/\*\*/g, '').trim();
  const questionTerms = previousMessage.content.toLowerCase().match(/[a-z0-9]+/g) || [];
  if (!questionTerms.some((term) => label.toLowerCase().includes(term))) return null;
  const dateIndex = cells.findIndex((cell) => /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{4})?\b/i.test(cell));
  if (dateIndex < 1) return null;

  let date = cells[dateIndex].replace(/\*\*/g, '').trim();
  if (!/\b\d{4}\b/.test(date)) {
    const currentYear = new Date().getFullYear();
    const parsedDate = new Date(`${date} ${currentYear} 12:00:00`);
    const today = new Date();
    const year = parsedDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ? currentYear + 1
      : currentYear;
    date = `${date} ${year}`;
  }

  const status = cells.find((cell) => /\b(not started|in progress|completed|complete|done|at risk|delayed)\b/i.test(cell));
  const progress = status && /\bnot started\b/i.test(status)
    ? ' and has not started yet'
    : status && /\bin progress\b/i.test(status)
      ? ' and is in progress'
      : status && /\b(completed|complete|done)\b/i.test(status)
        ? ' and has been completed'
        : status && /\bat risk\b/i.test(status)
          ? ' and is currently at risk'
          : status && /\bdelayed\b/i.test(status)
            ? ' and is delayed'
            : '';
  const source = message.citations?.[0]?.documentName;
  return `${label} is planned to start on **${date}**${progress}.${source ? ` *Source: ${source}*` : ''}`;
}

export default function ChatPanel({ workspaceId }) {
  const queryClient = useQueryClient();
  const [threadId, setThreadId] = useState('');
  const [isNewChat, setIsNewChat] = useState(false);
  const [question, setQuestion] = useState('');
  const bottomRef = useRef(null);

  const threadsQuery = useQuery({
    queryKey: queryKeys.workspaceChat(workspaceId),
    queryFn: () => chatApi.threads(workspaceId),
    enabled: Boolean(workspaceId)
  });

  useEffect(() => {
    if (!threadId && !isNewChat && threadsQuery.data?.threads?.length) {
      setThreadId(threadsQuery.data.threads[0].id);
    }
  }, [threadsQuery.data, threadId, isNewChat]);

  const messagesQuery = useQuery({
    queryKey: queryKeys.workspaceChatMessages(workspaceId, threadId),
    queryFn: () => chatApi.messages(workspaceId, threadId),
    enabled: Boolean(workspaceId && threadId)
  });

  const sendMutation = useMutation({
    mutationFn: (payload) => chatApi.ask(workspaceId, payload),
    onSuccess: async (data) => {
      setQuestion('');
      setThreadId(data.thread.id);
      setIsNewChat(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceChat(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceChatMessages(workspaceId, data.thread.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceRuns(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDetails(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      ]);
    }
  });

  const clearMutation = useMutation({
    mutationFn: (activeThreadId) => chatApi.clearMessages(workspaceId, activeThreadId),
    onSuccess: async (_data, activeThreadId) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceChatMessages(workspaceId, activeThreadId)
      });
    }
  });

  const messages = messagesQuery.data?.messages || [];
  const threads = threadsQuery.data?.threads || [];
  const activeThread = isNewChat ? null : threads.find((thread) => thread.id === threadId) || threads[0] || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, sendMutation.isPending]);

  return (
    <div className="panel overflow-hidden rounded-2xl">
      <div className="chat-header flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-md">
            <MessageCircle size={19} />
          </span>
          <div>
            <div className="font-semibold text-slate-950">Ask your documents</div>
            <div className="text-xs text-slate-500">Get focused answers with source citations</div>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-indigo-700 sm:inline-flex">
          <Sparkles size={13} /> Document grounded
        </span>
      </div>
      <ErrorBanner
        message={
          threadsQuery.error?.response?.data?.message ||
          messagesQuery.error?.response?.data?.message ||
          sendMutation.error?.response?.data?.message ||
          clearMutation.error?.response?.data?.message ||
          ([threadsQuery, messagesQuery, sendMutation, clearMutation].some((query) => query.isError)
            ? 'Chat could not be loaded, updated, or sent. Please try again.'
            : null)
        }
      />
      {threadsQuery.isLoading ? <LoadingState label="Loading threads…" /> : null}
      {!threadsQuery.isLoading ? (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <div className="mr-auto flex flex-wrap items-center gap-2">
              {threads.length ? (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setIsNewChat(false);
                      setThreadId(thread.id);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      !isNewChat && thread.id === (activeThread?.id || threadId)
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {thread.title || 'Workspace Chat'}
                  </button>
                ))
              ) : (
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  No thread yet
                </div>
              )}
              {isNewChat ? (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  New conversation
                </span>
              ) : null}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full px-3 py-1.5 text-xs"
                onClick={() => {
                  setQuestion('');
                  setThreadId('');
                  setIsNewChat(true);
                }}
                disabled={sendMutation.isPending || clearMutation.isPending}
                title="Start a new conversation"
              >
                <MessageSquarePlus size={14} />
                New chat
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() => clearMutation.mutate(activeThread.id)}
                disabled={!activeThread || !messages.length || sendMutation.isPending || clearMutation.isPending}
                title="Clear messages in this conversation"
              >
                <Trash2 size={14} />
                {clearMutation.isPending ? 'Clearing…' : 'Clear chat'}
              </Button>
            </div>
          </div>

          <div className="chat-transcript max-h-[32rem] min-h-64 space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-indigo-50/40 p-4 sm:p-5">
            {messagesQuery.isLoading ? <LoadingState label="Loading messages…" /> : null}
            {!messagesQuery.isLoading && !messages.length ? (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                  <Bot size={24} />
                </span>
                <div className="font-semibold text-slate-800">Your documents are ready to answer</div>
                <div className="mt-1 max-w-xs text-sm text-slate-500">Ask a clear question and get a direct response with a source you can verify.</div>
              </div>
            ) : null}
            {messages.map((message, index) => {
              const content = formatLegacyMilestoneAnswer(message, messages[index - 1]) || message.content;
              const hasInlineSource = content.includes('*Source:');
              return (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  message.role === 'assistant' ? 'bg-gradient-to-br from-indigo-600 to-teal-500 text-white' : 'bg-white text-indigo-600 shadow-sm'
                }`}>
                  {message.role === 'assistant' ? <Bot size={17} /> : <UserRound size={17} />}
                </span>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[82%] ${
                  message.role === 'assistant'
                    ? 'border border-slate-200 bg-white'
                    : 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                }`}>
                  <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${
                    message.role === 'assistant' ? 'text-indigo-600' : 'text-indigo-100'
                  }`}>
                    {message.role === 'assistant' ? 'NexusFlow' : 'You'}
                  </div>
                  <div className={`whitespace-pre-wrap text-sm leading-6 ${
                    message.role === 'assistant' ? 'text-slate-800' : 'text-white'
                  }`}>
                    {message.role === 'assistant' ? <FormattedAnswer text={content} /> : message.content}
                  </div>
                  {message.role === 'assistant' && message.citations?.length && !hasInlineSource ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-2">
                      {[...new Map(message.citations.map((citation) => [citation.documentId || citation.documentName, citation])).values()].map((citation, index) => (
                        <span
                          key={`${citation.documentId || index}-${index}`}
                          title={citation.snippet}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700"
                        >
                          <FileText size={12} className="shrink-0" />
                          <span className="truncate">Source: {citation.documentName || 'Document'}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );})}
            {sendMutation.isPending ? (
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white">
                  <Bot size={17} />
                </span>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Finding the best answer…
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form
            className="chat-composer rounded-2xl border border-slate-200 p-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100"
            onSubmit={(event) => {
              event.preventDefault();
              if (!question.trim()) return;
              sendMutation.mutate({ question, threadId: activeThread?.id || threadId || undefined });
            }}
          >
            <textarea
              rows={3}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="w-full resize-y border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
              placeholder="Ask a question about your documents…"
              aria-label="Question"
            />
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-2 pt-2">
              <div className="truncate text-xs text-slate-500">
                {activeThread ? `Chat: ${activeThread.title || 'Workspace Chat'}` : 'Answers include source citations'}
              </div>
              <Button className="shrink-0 rounded-xl px-4" type="submit" disabled={sendMutation.isPending || !question.trim()}>
                <Send size={15} />
                Send
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
