import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
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
    </Stack>
  );
}