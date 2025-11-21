/**
 * Home Screen
 * 
 * Main dashboard for AggieBuddie app
 * Provides navigation to key features:
 * - Upload schedule
 * - View schedule
 * - Activity preferences
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function HomeScreen() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Upload Schedule',
      description: 'Import your class schedule from .ics file',
      icon: 'cloud-upload-outline',
      route: '/fileUpload',
      color: Colors.primary,
      available: true,
    },
    {
      title: 'View Schedule',
      description: 'See your classes and activities',
      icon: 'calendar-outline',
      route: '/schedule',
      color: Colors.accent,
      available: true,
    },
    {
      title: 'Activity Preferences',
      description: 'Set your workout and activity preferences',
      icon: 'settings-outline',
      route: '/activityPreferences',
      color: Colors.maroon,
      available: true, // Phase 3.3 now complete!
    },
  ];

  const handleNavigate = (route, available) => {
    if (!available) {
      // Show alert for unavailable features
      alert('This feature is coming soon!');
      return;
    }
    router.push(route);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AggieBuddie</Text>
        <Text style={styles.headerSubtitle}>Your Smart Campus Activity Planner</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Ionicons name="fitness-outline" size={48} color={Colors.primary} />
          <Text style={styles.welcomeTitle}>Welcome!</Text>
          <Text style={styles.welcomeText}>
            Let's optimize your free time between classes with smart gym suggestions.
          </Text>
        </View>

        {/* Navigation Bar */}
        <View style={styles.navBar}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.navButton}
              onPress={() => handleNavigate(item.route, item.available)}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.navButtonText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Start Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Quick Start Guide</Text>
          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Upload your class schedule (.ics file)</Text>
          </View>
          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Assign building locations to your classes</Text>
          </View>
          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Set your activity preferences</Text>
          </View>
          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Get smart gym suggestions for your free time!</Text>
          </View>
        </View>

        {/* Development Status */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text.light,
    opacity: 0.9,
  },

  // Content
  content: {
    padding: 20,
  },

  // Welcome card
  welcomeCard: {
    backgroundColor: Colors.backgroundLight,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Navigation Bar
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  navButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },

  // Guide card
  guideCard: {
    backgroundColor: Colors.surfaceBlue,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: Colors.text.light,
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    paddingTop: 4,
  },

});