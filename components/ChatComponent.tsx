import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { ChatMessage } from '@/types/service';
import { useAppStore } from '@/stores/app-store';
import * as Icons from 'lucide-react-native';

interface ChatComponentProps {
  serviceRequestId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserType: 'customer' | 'mechanic';
}

export function ChatComponent({ serviceRequestId, currentUserId, currentUserName, currentUserType }: ChatComponentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Mock messages for demo - in real app this would come from Firestore
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        serviceRequestId,
        senderId: 'mechanic-1',
        senderName: 'Mike (Mechanic)',
        senderType: 'mechanic',
        message: 'Hi! I received your service request. I can be there within 2 hours. Does that work for you?',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        isRead: true,
      },
      {
        id: '2',
        serviceRequestId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderType: currentUserType,
        message: 'Yes, that works perfectly! Thank you.',
        timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
        isRead: true,
      },
      {
        id: '3',
        serviceRequestId,
        senderId: 'mechanic-1',
        senderName: 'Mike (Mechanic)',
        senderType: 'mechanic',
        message: 'Great! I am on my way. I will send you a message when I arrive.',
        timestamp: new Date(Date.now() - 2400000), // 40 minutes ago
        isRead: true,
      },
    ];
    setMessages(mockMessages);
  }, [serviceRequestId, currentUserId, currentUserName, currentUserType]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      serviceRequestId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderType: currentUserType,
      message: newMessage.trim(),
      timestamp: new Date(),
      isRead: false,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setIsSending(false);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const isMyMessage = (message: ChatMessage) => {
    return message.senderId === currentUserId;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Icons.MessageCircle size={20} color={Colors.primary} />
        <Text style={styles.headerTitle}>Chat with Mechanic</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              isMyMessage(message) ? styles.myMessageWrapper : styles.otherMessageWrapper,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                isMyMessage(message) ? styles.myMessage : styles.otherMessage,
              ]}
            >
              {!isMyMessage(message) && (
                <Text style={styles.senderName}>{message.senderName}</Text>
              )}
              <Text style={[
                styles.messageText,
                isMyMessage(message) ? styles.myMessageText : styles.otherMessageText,
              ]}>
                {message.message}
              </Text>
              <Text style={[
                styles.messageTime,
                isMyMessage(message) ? styles.myMessageTime : styles.otherMessageTime,
              ]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          <Icons.Send size={20} color={(!newMessage.trim() || isSending) ? Colors.textMuted : Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.black,
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: Colors.black,
    opacity: 0.7,
  },
  otherMessageTime: {
    color: Colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surface,
  },
});