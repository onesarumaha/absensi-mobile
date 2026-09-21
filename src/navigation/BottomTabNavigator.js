import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import HomeScreen from '../screens/HomeScreen';
import LeaveRequestScreen from '../screens/LeaveRequestScreen';
import RadiusSettingScreen from '../screens/RadiusSettingScreen';

const Tab = createBottomTabNavigator();

const VISIBLE_TABS = [
  { name: 'Home',       label: 'Beranda',      icon: 'home-outline',      lib: 'ion', component: HomeScreen },
  { name: 'Absen',      label: 'Absen',        icon: 'fingerprint',       lib: 'mci', component: AttendanceScreen, center: true },
  { name: 'Attendance', label: 'Data Absensi', icon: 'chart-box-outline', lib: 'mci', component: AttendanceHistoryScreen },
];

/* Tab yang TERSEMBUNYI dari navbar, tapi tetap punya tab bar */
const HIDDEN_TABS = [
  { name: 'LeaveRequest', component: LeaveRequestScreen },
  { name: 'RadiusSetting', component: RadiusSettingScreen },
];

/* Custom Tab Bar — hanya render VISIBLE_TABS */
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        { height: 70 + insets.bottom, paddingBottom: insets.bottom + 4 },
      ]}
    >
      {state.routes
        .filter((route) => VISIBLE_TABS.some((t) => t.name === route.name))
        .map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === index;
          const tab = VISIBLE_TABS.find((t) => t.name === route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          /* Tombol tengah (Absen) */
          if (tab.center) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.85}
                style={styles.centerWrap}
              >
                <View style={styles.centerBtn}>
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={36}
                    color="#ffffff"
                  />
                </View>
                <Text style={styles.centerLabel}>{tab.label}</Text>
              </TouchableOpacity>
            );
          }

          const IconComp = tab.lib === 'ion' ? Ionicons : MaterialCommunityIcons;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <IconComp
                name={tab.icon}
                size={22}
                color={isFocused ? '#2563eb' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? '#2563eb' : '#94a3b8' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Tab yang muncul di navbar */}
      {VISIBLE_TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}  // ini akan dioverride oleh custom tabBar
        />
      ))}

      {/* Tab tersembunyi dari navbar — tapi tetap dapat tab bar di bawah */}
      {HIDDEN_TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarButton: () => null,      // ← sembunyikan tombol di navbar
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    alignItems: 'flex-start',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
    gap: 3,
  },
  label: { fontSize: 10, fontWeight: '600' },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: -34,
  },
  centerBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#ffffff',
    shadowColor: '#2563eb',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 4,
  },
});