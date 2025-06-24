import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/app-store';
import { SERVICE_CATEGORIES } from '@/constants/services';
import * as Icons from 'lucide-react-native';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

export default function MechanicMapScreen() {
  const { serviceRequests, currentLocation } = useAppStore();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const activeRequests = serviceRequests.filter(r => 
    ['pending', 'quoted', 'accepted', 'in_progress'].includes(r.status) && r.location
  );

  const getServiceTitle = (type: string) => {
    return SERVICE_CATEGORIES.find(s => s.id === type)?.title || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'quoted': return Colors.primary;
      case 'accepted': return Colors.success;
      case 'in_progress': return Colors.mechanic;
      default: return Colors.textMuted;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const openInMaps = (latitude: number, longitude: number, address?: string) => {
    const label = address || 'Service Location';
    
    if (Platform.OS === 'web') {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      window.open(url, '_blank');
    } else {
      // For mobile, you would use Linking.openURL with platform-specific map URLs
      console.log('Open maps:', { latitude, longitude, label });
    }
  };

  if (activeRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icons.MapPin size={64} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Active Service Locations</Text>
        <Text style={styles.emptyText}>
          Service requests with locations will appear here once submitted.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mock Map Area */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Icons.Map size={48} color={Colors.textMuted} />
          <Text style={styles.mapPlaceholderText}>Interactive Map</Text>
          <Text style={styles.mapPlaceholderSubtext}>
            In production, this would show Google Maps with service location pins
          </Text>
        </View>

        {/* Current Location Indicator */}
        {currentLocation && (
          <View style={styles.currentLocationCard}>
            <Icons.Navigation size={16} color={Colors.mechanic} />
            <Text style={styles.currentLocationText}>
              Your Location: {currentLocation.address || 'Current Position'}
            </Text>
          </View>
        )}
      </View>

      {/* Service Requests List */}
      <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.listTitle}>Service Locations ({activeRequests.length})</Text>
        
        {activeRequests.map((request) => {
          const distance = currentLocation && request.location ? 
            calculateDistance(
              currentLocation.latitude, 
              currentLocation.longitude,
              request.location.latitude,
              request.location.longitude
            ) : null;

          return (
            <TouchableOpacity
              key={request.id}
              style={[
                styles.requestCard,
                selectedRequest === request.id && styles.requestCardSelected
              ]}
              onPress={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
            >
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle}>
                    {getServiceTitle(request.type)}
                  </Text>
                  <View style={styles.requestMeta}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
                    <Text style={styles.requestStatus}>{request.status.replace('_', ' ')}</Text>
                    {distance && (
                      <>
                        <Text style={styles.metaDivider}>•</Text>
                        <Text style={styles.requestDistance}>{distance.toFixed(1)} mi</Text>
                      </>
                    )}
                    {request.urgency === 'emergency' && (
                      <>
                        <Text style={styles.metaDivider}>•</Text>
                        <Icons.AlertTriangle size={12} color={Colors.error} />
                        <Text style={styles.emergencyText}>Emergency</Text>
                      </>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => request.location && openInMaps(
                    request.location.latitude,
                    request.location.longitude,
                    request.location.address
                  )}
                >
                  <Icons.Navigation size={20} color={Colors.mechanic} />
                </TouchableOpacity>
              </View>

              <View style={styles.locationInfo}>
                <Icons.MapPin size={14} color={Colors.textMuted} />
                <Text style={styles.locationText}>
                  {request.location?.address || `${request.location?.latitude.toFixed(4)}, ${request.location?.longitude.toFixed(4)}`}
                </Text>
              </View>

              {selectedRequest === request.id && (
                <View style={styles.requestDetails}>
                  <Text style={styles.requestDescription} numberOfLines={3}>
                    {request.description}
                  </Text>
                  
                  <View style={styles.requestActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icons.Phone size={16} color={Colors.mechanic} />
                      <Text style={styles.actionButtonText}>Call Customer</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton}>
                      <Icons.MessageCircle size={16} color={Colors.mechanic} />
                      <Text style={styles.actionButtonText}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  mapContainer: {
    height: 250,
    backgroundColor: Colors.card,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  currentLocationCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentLocationText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  requestsList: {
    flex: 1,
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  requestCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestCardSelected: {
    borderColor: Colors.mechanic,
    backgroundColor: Colors.mechanic + '10',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  requestStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  metaDivider: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  requestDistance: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emergencyText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  directionsButton: {
    padding: 8,
    backgroundColor: Colors.mechanic + '20',
    borderRadius: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 8,
  },
  requestDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mechanic + '20',
    borderWidth: 1,
    borderColor: Colors.mechanic,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  actionButtonText: {
    color: Colors.mechanic,
    fontSize: 12,
    fontWeight: '600',
  },
});