import { useState, useEffect } from 'react';
import { FirebaseService } from '@/services/firebase-service';
import { User } from '@/types/auth';
import { ServiceRequest, Quote, ChatMessage } from '@/types/service';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseService = FirebaseService.getInstance();

  useEffect(() => {
    // In production: firebase.auth().onAuthStateChanged()
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      const user = await firebaseService.signUp(email, password, userData);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sign up failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const user = await firebaseService.signIn(email, password);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  };

  const signOut = async () => {
    try {
      await firebaseService.signOut();
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sign out failed' };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
}

export function useFirebaseServiceRequests(userId: string) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const firebaseService = FirebaseService.getInstance();

  useEffect(() => {
    if (userId) {
      loadRequests();
    }
  }, [userId]);

  const loadRequests = async () => {
    try {
      const requests = await firebaseService.getServiceRequests(userId);
      setRequests(requests);
    } catch (error) {
      console.error('Failed to load service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (request: ServiceRequest) => {
    try {
      const id = await firebaseService.createServiceRequest(request);
      setRequests(prev => [...prev, { ...request, id }]);
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create request' };
    }
  };

  const updateRequest = async (requestId: string, updates: Partial<ServiceRequest>) => {
    try {
      await firebaseService.updateServiceRequest(requestId, updates);
      setRequests(prev => prev.map(req => req.id === requestId ? { ...req, ...updates } : req));
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update request' };
    }
  };

  return {
    requests,
    loading,
    createRequest,
    updateRequest,
    refreshRequests: loadRequests,
  };
}

export function useFirebaseChat(serviceRequestId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const firebaseService = FirebaseService.getInstance();

  useEffect(() => {
    if (serviceRequestId) {
      // Set up real-time listener
      const unsubscribe = firebaseService.subscribeToMessages(serviceRequestId, (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      });

      return unsubscribe;
    }
  }, [serviceRequestId]);

  const sendMessage = async (message: ChatMessage) => {
    try {
      const id = await firebaseService.sendMessage(message);
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
    }
  };

  return {
    messages,
    loading,
    sendMessage,
  };
}