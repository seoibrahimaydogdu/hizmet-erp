import React, { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { CheckCircle, AlertCircle, Loader2, Database, HardDrive } from 'lucide-react';

interface DataMigrationProps {
  onComplete?: () => void;
}

const DataMigration: React.FC<DataMigrationProps> = ({ onComplete }) => {
  const { user, migrateFromLocalStorage } = useSupabase();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localStorageData, setLocalStorageData] = useState<any>({});

  // LocalStorage'daki verileri kontrol et
  useEffect(() => {
    const data = {
      theme: localStorage.getItem('theme'),
      uiuxSettings: localStorage.getItem('uiuxSettings'),
      notificationSettings: localStorage.getItem('notificationSettings'),
      shownNotifications: localStorage.getItem('shownNotifications'),
      hasShownWelcomeNotifications: localStorage.getItem('hasShownWelcomeNotifications'),
      userProfile: localStorage.getItem('userProfile'),
      appSettings: localStorage.getItem('appSettings'),
      customerNotificationPrefs: (() => {
        const prefs: Record<string, string | null> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('notification_prefs_')) {
            const customerId = key.replace('notification_prefs_', '');
            prefs[customerId] = localStorage.getItem(key);
          }
        }
        return prefs;
      })()
    };

    setLocalStorageData(data);
  }, []);

  // Veri taşıma işlemini başlat
  const startMigration = async () => {
    if (!user) {
      setError('Kullanıcı giriş yapmamış');
      return;
    }

    setIsMigrating(true);
    setMigrationStatus('migrating');
    setError(null);

    try {
      await migrateFromLocalStorage();
      setMigrationStatus('completed');
      
      // LocalStorage'dan verileri temizle
      localStorage.removeItem('theme');
      localStorage.removeItem('uiuxSettings');
      localStorage.removeItem('notificationSettings');
      localStorage.removeItem('shownNotifications');
      localStorage.removeItem('hasShownWelcomeNotifications');
      
      // Verileri güncelle
      setLocalStorageData({});
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setMigrationStatus('error');
      setError(err instanceof Error ? err.message : 'Veri taşıma hatası');
    } finally {
      setIsMigrating(false);
    }
  };

  // LocalStorage'da veri var mı kontrol et
  const hasLocalStorageData = Object.values(localStorageData).some(value => value !== null);

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Giriş Yapılmamış
            </h3>
            <p className="text-sm text-yellow-700">
              Veri taşıma işlemi için önce giriş yapmanız gerekiyor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasLocalStorageData) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="text-sm font-medium text-green-800">
              Veri Taşıma Gerekli Değil
            </h3>
            <p className="text-sm text-green-700">
              LocalStorage'da taşınacak veri bulunamadı.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <Database className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Veri Taşıma Gerekli
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            LocalStorage'daki verileriniz Supabase'e taşınacak. Bu işlem sadece bir kez yapılacak.
          </p>

          {/* LocalStorage Verileri */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-blue-800 mb-2">Taşınacak Veriler:</h4>
            <div className="space-y-1">
              {localStorageData.theme && (
                <div className="flex items-center space-x-2 text-xs text-blue-700">
                  <HardDrive className="h-3 w-3" />
                  <span>Tema Ayarları</span>
                </div>
              )}
              {localStorageData.uiuxSettings && (
                <div className="flex items-center space-x-2 text-xs text-blue-700">
                  <HardDrive className="h-3 w-3" />
                  <span>UI/UX Ayarları</span>
                </div>
              )}
              {localStorageData.notificationSettings && (
                <div className="flex items-center space-x-2 text-xs text-blue-700">
                  <HardDrive className="h-3 w-3" />
                  <span>Bildirim Ayarları</span>
                </div>
              )}
              {localStorageData.shownNotifications && (
                <div className="flex items-center space-x-2 text-xs text-blue-700">
                  <HardDrive className="h-3 w-3" />
                  <span>Bildirim Geçmişi</span>
                </div>
              )}
            </div>
          </div>

          {/* Durum Göstergesi */}
          {migrationStatus === 'migrating' && (
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Veriler taşınıyor...</span>
            </div>
          )}

          {migrationStatus === 'completed' && (
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Veriler başarıyla taşındı!</span>
            </div>
          )}

          {migrationStatus === 'error' && (
            <div className="flex items-center space-x-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Taşıma Butonu */}
          {migrationStatus === 'idle' && (
            <button
              onClick={startMigration}
              disabled={isMigrating}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMigrating ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Taşınıyor...</span>
                </div>
              ) : (
                'Verileri Taşı'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataMigration;
