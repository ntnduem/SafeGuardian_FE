import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Quyền truy cập vị trí bị từ chối.');
        setLoading(false);
        return;
      }

      // Lấy vị trí một lần ngay lập tức
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(current);
      setLoading(false);

      // Tiếp tục theo dõi vị trí
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        loc => setLocation(loc)
      );
    })();

    return () => { sub?.remove(); };
  }, []);

  return { location, loading, error };
}
