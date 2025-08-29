export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  channelId: string;
  messageType: 'text' | 'file' | 'image' | 'system' | 'announcement' | 'poll';
  attachments?: string[];
  timestamp: Date;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  reactions?: { [key: string]: string[] }; // emoji: [userId1, userId2]
  mentions?: string[];
  isDirectMessage?: boolean;
  recipientId?: string;
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ChatNotification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'mention' | 'reaction' | 'file' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  isRead: boolean;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  channelId?: string;
  channelName?: string;
  messageId?: string;
  icon?: string;
}

export interface VoiceMessage {
  id: string;
  audioUrl: string;
  duration: number;
  transcription?: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  channelId: string;
  isProcessing?: boolean;
  expiresAt?: Date;
  password?: string;
}

export interface FileMessage {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  channelId: string;
  thumbnail?: string;
  isImage?: boolean;
  isVideo?: boolean;
  isAudio?: boolean;
  isDocument?: boolean;
  downloadCount?: number;
  shared?: boolean;
  folder?: string;
  shared?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  tags: string[];
  attachments: string[];
  assignee?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  participants: string[];
  startTime: Date;
  endTime: Date;
  location?: string;
  link?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  assignedTo?: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  requester: string;
  requesterName: string;
  approvers: string[];
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  assignedTo?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
  managerName: string;
  members: string[];
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  progress: number;
  budget?: number;
  tags: string[];
  createdAt: Date;
  completedAt?: Date;
  assignedTo?: string;
}

export interface AutoCategorization {
  enabled: boolean;
  categories: string[];
  keywords: {
    [key: string]: string[];
  };
}

export interface WorkflowRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export interface AutoResponse {
  id: string;
  trigger: string;
  response: string;
  enabled: boolean;
}

export interface SemanticSearch {
  enabled: boolean;
  searchHistory: string[];
  recentSearches: string[];
}

export interface AdvancedSearchResults {
  messages: ChatMessage[];
  voiceMessages: VoiceMessage[];
  files: FileMessage[];
  users: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
  }>;
  totalResults: number;
  searchTime: number;
  relevance: number;
}

export interface AdvancedSearchFilter {
  messageType: string;
  dateRange: string;
  sender: string;
  hasAttachments: boolean;
  hasMentions: boolean;
  keywords: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    mentions: boolean;
    reactions: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowMentions: boolean;
  };
  suppressedChannels?: string[];
  suppressedUsers?: string[];
  senderPriority?: { [key: string]: number };
}

export interface FilePreview {
  file: File;
  preview: string;
}

export interface FilePreviewData {
  file: File;
  type: string;
  content?: any;
}
