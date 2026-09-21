import RawAsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { attendanceApi, authApi, bannerApi } from '../services/api';

const memoryStore = {};
const AsyncStorage = {
  getItem: async (key) => {
    try {
      return await RawAsyncStorage.getItem(key);
    } catch (e) {
      return memoryStore[key] || null;
    }
  },
};

const FALLBACK_BANNERS = [
  {
    id: 'f1',
    title: 'Selamat Datang di AbsensiOne',
    subtitle: 'Sistem Presensi Online Puskesmas',
    color: '#2563eb',
    type: 'info',
  },
  {
    id: 'f2',
    title: 'Jangan Lupa Absen',
    subtitle: 'Absen masuk sebelum jam 07:30 WIB',
    color: '#0891b2',
    type: 'info',
  },
];

export function useHomeData() {
  const [userData, setUserData] = useState(null);
  const [banners, setBanners] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [monthlyRecap, setMonthlyRecap] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(true);

  const loadCachedUser = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('userData');
      if (jsonValue != null) setUserData(JSON.parse(jsonValue));
    } catch (e) {
      console.log('Cache error:', e);
    }
  };

  const loadAll = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [meRes, bannersRes] = await Promise.allSettled([
        authApi.me(),
        bannerApi.list(),
      ]);

      if (meRes.status === 'fulfilled') {
        const freshUser =
          meRes.value.data?.user || meRes.value.data?.data?.user;
        if (freshUser) {
          setUserData(freshUser);
          await RawAsyncStorage.setItem(
            'userData',
            JSON.stringify(freshUser)
          ).catch(() => {});
        }
      }

      if (bannersRes.status === 'fulfilled') {
        const list =
          bannersRes.value.data?.data ?? bannersRes.value.data ?? [];
        setBanners(
          Array.isArray(list) && list.length > 0 ? list : FALLBACK_BANNERS
        );
      } else {
        setBanners(FALLBACK_BANNERS);
      }

      const [todayRes, recapRes] = await Promise.allSettled([
        attendanceApi.today(),
        attendanceApi.monthlyRecap(),
      ]);

      if (todayRes.status === 'fulfilled') {
        const data = todayRes.value.data?.data ?? todayRes.value.data;
        setTodayAttendance(data?.id ? data : null);
      } else {
        setTodayAttendance(null);
      }

      if (recapRes.status === 'fulfilled') {
        const data = recapRes.value.data?.data ?? recapRes.value.data;
        setMonthlyRecap(data || null);
      } else {
        setMonthlyRecap(null);
      }
    } catch (e) {
      console.log('Load all error:', e.response?.data || e.message);
    } finally {
      setLoading(false);
      setLoadingBanners(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCachedUser();
    loadAll();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll(true);
  }, []);

  return {
    userData,
    banners,
    todayAttendance,
    monthlyRecap,
    loading,
    refreshing,
    loadingBanners,
    onRefresh,
    reload: () => loadAll(true),
  };
}