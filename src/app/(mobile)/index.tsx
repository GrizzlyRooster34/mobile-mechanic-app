import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function MobileHome() {
  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <StatusBar style="light" />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <View className="flex-row items-center justify-center mb-4">
            <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center mr-3">
              <Text className="text-white text-xl font-bold">H</Text>
            </View>
            <Text className="text-white text-2xl font-bold">Heinicus</Text>
          </View>
          <Text className="text-gray-300 text-center text-lg">
            AI-Powered Mobile Mechanic Services
          </Text>
        </View>

        {/* Hero Section */}
        <View className="px-6 mb-8">
          <View className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6">
            <Text className="text-white text-xl font-bold mb-2">
              Get Expert Mechanic Help Anywhere
            </Text>
            <Text className="text-blue-100 mb-4">
              Professional mobile mechanics with AI-powered diagnostics and support
            </Text>
            <Link href="/(mobile)/booking" asChild>
              <TouchableOpacity className="bg-white rounded-lg py-3 px-6">
                <Text className="text-blue-600 font-semibold text-center">
                  Book Service Now
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-8">
          <Text className="text-white text-xl font-bold mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <Link href="/(mobile)/customer" asChild>
              <TouchableOpacity className="bg-gray-800 rounded-xl p-4 w-[48%] mb-4">
                <View className="w-10 h-10 bg-green-600 rounded-lg items-center justify-center mb-3">
                  <Text className="text-white text-lg">👤</Text>
                </View>
                <Text className="text-white font-semibold mb-1">Customer Portal</Text>
                <Text className="text-gray-400 text-sm">Track services & chat</Text>
              </TouchableOpacity>
            </Link>
            
            <Link href="/(mobile)/mechanic" asChild>
              <TouchableOpacity className="bg-gray-800 rounded-xl p-4 w-[48%] mb-4">
                <View className="w-10 h-10 bg-orange-600 rounded-lg items-center justify-center mb-3">
                  <Text className="text-white text-lg">🔧</Text>
                </View>
                <Text className="text-white font-semibold mb-1">Mechanic Hub</Text>
                <Text className="text-gray-400 text-sm">AI diagnostics & tools</Text>
              </TouchableOpacity>
            </Link>
            
            <Link href="/(mobile)/chat" asChild>
              <TouchableOpacity className="bg-gray-800 rounded-xl p-4 w-[48%] mb-4">
                <View className="w-10 h-10 bg-purple-600 rounded-lg items-center justify-center mb-3">
                  <Text className="text-white text-lg">🤖</Text>
                </View>
                <Text className="text-white font-semibold mb-1">AI Assistant</Text>
                <Text className="text-gray-400 text-sm">Get instant help</Text>
              </TouchableOpacity>
            </Link>
            
            <TouchableOpacity className="bg-gray-800 rounded-xl p-4 w-[48%] mb-4">
              <View className="w-10 h-10 bg-red-600 rounded-lg items-center justify-center mb-3">
                <Text className="text-white text-lg">🚨</Text>
              </View>
              <Text className="text-white font-semibold mb-1">Emergency</Text>
              <Text className="text-gray-400 text-sm">24/7 urgent help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View className="px-6 mb-8">
          <Text className="text-white text-xl font-bold mb-4">Why Choose Heinicus?</Text>
          <View className="space-y-4">
            <View className="flex-row items-center bg-gray-800 rounded-xl p-4">
              <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center mr-4">
                <Text className="text-white text-lg">🤖</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold mb-1">AI-Powered Diagnostics</Text>
                <Text className="text-gray-400 text-sm">Advanced AI helps diagnose issues quickly and accurately</Text>
              </View>
            </View>
            
            <View className="flex-row items-center bg-gray-800 rounded-xl p-4">
              <View className="w-12 h-12 bg-green-600 rounded-full items-center justify-center mr-4">
                <Text className="text-white text-lg">📍</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold mb-1">Mobile Service</Text>
                <Text className="text-gray-400 text-sm">We come to you - home, office, or roadside</Text>
              </View>
            </View>
            
            <View className="flex-row items-center bg-gray-800 rounded-xl p-4">
              <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-4">
                <Text className="text-white text-lg">💳</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold mb-1">Secure Payments</Text>
                <Text className="text-gray-400 text-sm">Safe and secure payment processing with Stripe</Text>
              </View>
            </View>
            
            <View className="flex-row items-center bg-gray-800 rounded-xl p-4">
              <View className="w-12 h-12 bg-orange-600 rounded-full items-center justify-center mr-4">
                <Text className="text-white text-lg">⭐</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold mb-1">Expert Mechanics</Text>
                <Text className="text-gray-400 text-sm">Certified professionals with years of experience</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View className="px-6 pb-8">
          <View className="bg-gray-800 rounded-2xl p-6">
            <Text className="text-white text-xl font-bold text-center mb-2">
              Ready to Get Started?
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Book your first service or chat with our AI assistant
            </Text>
            <View className="flex-row space-x-4">
              <Link href="/(mobile)/booking" asChild>
                <TouchableOpacity className="flex-1 bg-blue-600 rounded-lg py-3">
                  <Text className="text-white font-semibold text-center">
                    Book Service
                  </Text>
                </TouchableOpacity>
              </Link>
              <Link href="/(mobile)/chat" asChild>
                <TouchableOpacity className="flex-1 bg-gray-700 rounded-lg py-3">
                  <Text className="text-white font-semibold text-center">
                    Chat with AI
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}