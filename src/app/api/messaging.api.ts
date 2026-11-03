import { authFetch } from "./authFetch";

export type MessageSubjectType = "CLEANER" | "CUSTOMER";

export type MessagingRecipient = {
  subjectType: MessageSubjectType;
  subjectId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  subtitle?: string;
};

export type ConversationSubject = {
  id: string;
  type: MessageSubjectType;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string;
  userId?: string;
};

export type ConversationListItem = {
  id: string;
  businessId: string;
  subjectType: MessageSubjectType;
  subjectId: string;
  subject: ConversationSubject | null;
  createdAt: string;
  lastMessage: {
    id: string;
    body: string | null;
    attachmentKey: string | null;
    senderUserId: string;
    createdAt: string;
    readAt: string | null;
  } | null;
  lastMessageAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  body: string | null;
  content?: string | null;
  attachmentKey: string | null;
  readAt: string | null;
  status: string;
  createdAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export async function searchMessagingRecipients(search: string) {
  const params = new URLSearchParams({ search, limit: "15" });
  const res = await authFetch(`/messaging/recipients?${params}`);
  return (res.data || []) as MessagingRecipient[];
}

export async function listConversations(page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await authFetch(`/messaging?${params}`);
  return {
    data: (res.data || []) as ConversationListItem[],
    pagination: res.pagination as Pagination | undefined,
  };
}

export async function startConversation(payload: {
  subjectType: MessageSubjectType;
  subjectId: string;
}) {
  const res = await authFetch(`/messaging`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data as ConversationListItem & { subject: ConversationSubject };
}

export async function listMessages(conversationId: string, page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await authFetch(`/messaging/${conversationId}/messages?${params}`);
  return {
    data: (res.data || []) as ChatMessage[],
    pagination: res.pagination as Pagination | undefined,
  };
}

export async function sendMessage(
  conversationId: string,
  body: string
) {
  const res = await authFetch(`/messaging/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return res.data as ChatMessage;
}

export async function markMessageRead(messageId: string) {
  const res = await authFetch(`/messaging/messages/${messageId}/read`, {
    method: "PATCH",
  });
  return res.data;
}
