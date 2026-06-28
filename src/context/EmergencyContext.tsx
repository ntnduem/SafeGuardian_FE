import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Modal } from 'react-native';
import CountdownScreen from '../screens/emergency/CountdownScreen';
import AlertSentScreen from '../screens/emergency/AlertSentScreen';
import { UserStore } from '../store/userStore';
import { sendSimulationAlert, sendAccidentAlert, createAccidentEvent } from '../config/api';

type EmergencyState = 'idle' | 'countdown' | 'alertSent';

interface EmergencyContextType {
  state: EmergencyState;
  triggerAccident: (acceleration?: number) => void;
  cancelEmergency: () => void;
}

const EmergencyContext = createContext<EmergencyContextType>({
  state: 'idle',
  triggerAccident: () => {},
  cancelEmergency: () => {},
});

export const useEmergency = () => useContext(EmergencyContext);

interface AlertInfo {
  alertId: string | null;
  latitude: number;
  longitude: number;
  acceleration: number;
}

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EmergencyState>('idle');
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    alertId: null, latitude: 0, longitude: 0, acceleration: 0,
  });
  const accelerationRef = useRef<number>(0);

  const triggerAccident = useCallback((acceleration = 0) => {
    accelerationRef.current = acceleration;
    setState('countdown');
  }, []);

  const cancelEmergency = useCallback(() => {
    setState('idle');
  }, []);

  // Được gọi từ CountdownScreen khi đếm ngược kết thúc
  const onCountdownEnd = useCallback(async (lat: number, lng: number, accel: number) => {
    try {
      const userId = await UserStore.getUserId();
      if (!userId) return;

      // Ghi nhận event
      await createAccidentEvent({
        userId, eventType: 'STRONG_IMPACT',
        acceleration: accel, threshold: 25.0,
        latitude: lat, longitude: lng,
      });

      // Gửi alert (simulation hoặc accident)
      const res = accel > 0
        ? await sendAccidentAlert(userId, null, lat, lng, accel)
        : await sendSimulationAlert(userId, lat, lng);

      const alertId = res.data?.data?.id ?? null;
      setAlertInfo({ alertId, latitude: lat, longitude: lng, acceleration: accel });
      setState('alertSent');
    } catch (e) {
      console.error('Emergency alert error:', e);
      setState('alertSent');
    }
  }, []);

  return (
    <EmergencyContext.Provider value={{ state, triggerAccident, cancelEmergency }}>
      {children}

      {/* Countdown Modal */}
      <Modal visible={state === 'countdown'} animationType="slide" statusBarTranslucent>
        <CountdownScreen
          acceleration={accelerationRef.current}
          onSafe={cancelEmergency}
          onTimeout={onCountdownEnd}
        />
      </Modal>

      {/* Alert Sent Modal */}
      <Modal visible={state === 'alertSent'} animationType="fade" statusBarTranslucent>
        <AlertSentScreen
          alertId={alertInfo.alertId}
          latitude={alertInfo.latitude}
          longitude={alertInfo.longitude}
          onDismiss={() => setState('idle')}
        />
      </Modal>
    </EmergencyContext.Provider>
  );
}
