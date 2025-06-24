import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { Contact, Vehicle } from '@/types/service';
import * as Icons from 'lucide-react-native';

export default function CustomerProfileScreen() {
  const { contact, vehicles, setContact, addVehicle, removeVehicle } = useAppStore();
  const { user, logout } = useAuthStore();
  
  // Contact form state
  const [firstName, setFirstName] = useState(contact?.firstName || user?.firstName || '');
  const [lastName, setLastName] = useState(contact?.lastName || user?.lastName || '');
  const [phone, setPhone] = useState(contact?.phone || user?.phone || '');
  const [email, setEmail] = useState(contact?.email || user?.email || '');
  const [address, setAddress] = useState(contact?.address || '');
  
  // Vehicle form state
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleMileage, setVehicleMileage] = useState('');

  const handleSaveContact = () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const contactData: Contact = {
      id: contact?.id || Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || undefined,
    };

    setContact(contactData);
    Alert.alert('Success', 'Contact information saved.');
  };

  const handleAddVehicle = () => {
    if (!vehicleMake.trim() || !vehicleModel.trim() || !vehicleYear.trim()) {
      Alert.alert('Error', 'Please fill in make, model, and year.');
      return;
    }

    const year = parseInt(vehicleYear);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      Alert.alert('Error', 'Please enter a valid year.');
      return;
    }

    const vehicle: Vehicle = {
      id: Date.now().toString(),
      make: vehicleMake.trim(),
      model: vehicleModel.trim(),
      year,
      color: vehicleColor.trim() || undefined,
      mileage: vehicleMileage.trim() ? parseInt(vehicleMileage) : undefined,
    };

    addVehicle(vehicle);
    
    // Reset form
    setVehicleMake('');
    setVehicleModel('');
    setVehicleYear('');
    setVehicleColor('');
    setVehicleMileage('');
    setShowVehicleForm(false);
    
    Alert.alert('Success', 'Vehicle added to your profile.');
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    Alert.alert(
      'Remove Vehicle',
      'Are you sure you want to remove this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeVehicle(vehicleId) },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* User Info Header */}
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Icons.User size={12} color={Colors.primary} />
              <Text style={styles.roleText}>Customer</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icons.LogOut size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="John"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Doe"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="john@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St, City, State"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <Button
            title="Save Contact Info"
            onPress={handleSaveContact}
            style={styles.saveButton}
          />
        </View>

        {/* Vehicles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Vehicles</Text>
            <Button
              title="Add Vehicle"
              variant="outline"
              size="small"
              onPress={() => setShowVehicleForm(true)}
            />
          </View>

          {vehicles.length === 0 ? (
            <View style={styles.emptyVehicles}>
              <Icons.Car size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No vehicles added yet</Text>
              <Text style={styles.emptySubtext}>
                Add your vehicle information to help us provide better service
              </Text>
            </View>
          ) : (
            <View style={styles.vehiclesList}>
              {vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleCard}>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleTitle}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Text>
                    {vehicle.color && (
                      <Text style={styles.vehicleDetail}>Color: {vehicle.color}</Text>
                    )}
                    {vehicle.mileage && (
                      <Text style={styles.vehicleDetail}>Mileage: {vehicle.mileage.toLocaleString()}</Text>
                    )}
                  </View>
                  <Button
                    title="Remove"
                    variant="outline"
                    size="small"
                    onPress={() => handleRemoveVehicle(vehicle.id)}
                    textStyle={{ color: Colors.error }}
                    style={{ borderColor: Colors.error }}
                  />
                </View>
              ))}
            </View>
          )}

          {showVehicleForm && (
            <View style={styles.vehicleForm}>
              <Text style={styles.formTitle}>Add New Vehicle</Text>
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Make *</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleMake}
                    onChangeText={setVehicleMake}
                    placeholder="Toyota"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Model *</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                    placeholder="Camry"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Year *</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleYear}
                    onChangeText={setVehicleYear}
                    placeholder="2020"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Color</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleColor}
                    onChangeText={setVehicleColor}
                    placeholder="Silver"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mileage</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleMileage}
                  onChangeText={setVehicleMileage}
                  placeholder="50000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowVehicleForm(false)}
                  style={styles.formButton}
                />
                <Button
                  title="Add Vehicle"
                  onPress={handleAddVehicle}
                  style={styles.formButton}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  emptyVehicles: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  vehiclesList: {
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  vehicleDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  vehicleForm: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
  },
});