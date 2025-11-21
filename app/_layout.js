import { Stack } from 'expo-router';
import { UserProvider } from '../contexts/UserContext';

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack
        screenOptions={{
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Login',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="home" 
          options={{ 
            title: 'Home',
            headerBackVisible: false,
          }} 
        />
        <Stack.Screen 
          name="fileUpload" 
          options={{ 
            title: 'Upload Schedule',
            headerShown: false  // Using custom header in component
          }} 
        />
        <Stack.Screen 
          name="buildingPicker" 
          options={{ 
            title: 'Assign Buildings',
            headerShown: false  // Using custom header in component
          }} 
        />
        <Stack.Screen 
          name="activityPreferences" 
          options={{ 
            title: 'Activity Preferences',
            headerShown: false  // Using custom header in component
          }} 
        />
        <Stack.Screen 
          name="schedule" 
          options={{ 
            title: 'Schedule',
            headerShown: false  // Custom UI in component
          }} 
        />
        <Stack.Screen 
          name="event" 
          options={{ 
            title: 'Event Details',
            headerShown: false  // Using custom header in component
          }} 
        />
      </Stack>
    </UserProvider>
  );
}