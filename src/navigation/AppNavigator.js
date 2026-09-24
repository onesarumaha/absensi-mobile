import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EmployeeFormScreen from '../screens/EmployeeFormScreen';
import EmployeeListScreen from '../screens/EmployeeListScreen';
import LoginScreen from '../screens/LoginScreen';
import RadiusSettingScreen from '../screens/RadiusSettingScreen';
import SetupPhotoScreen from '../screens/SetupPhotoScreen';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SetupPhoto" component={SetupPhotoScreen} />
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="RadiusSetting" component={RadiusSettingScreen} />
        <Stack.Screen name="EmployeeList" component={EmployeeListScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="EmployeeForm" component={EmployeeFormScreen} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}