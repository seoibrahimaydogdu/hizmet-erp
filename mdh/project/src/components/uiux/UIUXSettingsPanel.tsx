import React from 'react';
import { Settings, X, Palette, Eye, Bell, Zap } from 'lucide-react';

interface UIUXSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  onUpdateSettings: (settings: any) => void;
  onReset?: () => void;
}

const UIUXSettingsPanel: React.FC<UIUXSettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReset
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">UI/UX Ayarları</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Tema Ayarları */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                Tema Ayarları
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.darkMode || false}
                      onChange={(e) => onUpdateSettings({ ...settings, darkMode: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Karanlık tema</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.compactMode || false}
                      onChange={(e) => onUpdateSettings({ ...settings, compactMode: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Kompakt görünüm</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Görünüm Ayarları */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Görünüm Ayarları
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.animations || true}
                      onChange={(e) => onUpdateSettings({ ...settings, animations: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Animasyonları göster</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.reducedMotion || false}
                      onChange={(e) => onUpdateSettings({ ...settings, reducedMotion: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Hareket azaltma</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.highContrast || false}
                      onChange={(e) => onUpdateSettings({ ...settings, highContrast: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Yüksek kontrast</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.largeText || false}
                      onChange={(e) => onUpdateSettings({ ...settings, largeText: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Büyük metin</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Font Boyutu */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Font Boyutu</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="fontSize"
                    value="small"
                    checked={settings?.fontSize === 'small'}
                    onChange={(e) => onUpdateSettings({ ...settings, fontSize: e.target.value })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Küçük</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="fontSize"
                    value="medium"
                    checked={settings?.fontSize === 'medium'}
                    onChange={(e) => onUpdateSettings({ ...settings, fontSize: e.target.value })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Orta</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="fontSize"
                    value="large"
                    checked={settings?.fontSize === 'large'}
                    onChange={(e) => onUpdateSettings({ ...settings, fontSize: e.target.value })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Büyük</span>
                </label>
              </div>
            </div>

            {/* Mesaj Aralığı */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Mesaj Aralığı</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="messageSpacing"
                    value="tight"
                    checked={settings?.messageSpacing === 'tight'}
                    onChange={(e) => onUpdateSettings({ ...settings, messageSpacing: e.target.value })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Sıkı</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="messageSpacing"
                    value="normal"
                    checked={settings?.messageSpacing === 'normal'}
                    onChange={(e) => onUpdateSettings({ ...settings, messageSpacing: e.target.value })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Normal</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="messageSpacing"
                    value="loose"
                    checked={settings?.messageSpacing === 'loose'}
                    onChange={(e) => onUpdateSettings({ ...settings, messageSpacing: e.target.value })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Geniş</span>
                </label>
              </div>
            </div>

            {/* Performans Ayarları */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Performans Ayarları
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.enableCaching || true}
                      onChange={(e) => onUpdateSettings({ ...settings, enableCaching: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Önbellek kullan</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.lazyLoading || true}
                      onChange={(e) => onUpdateSettings({ ...settings, lazyLoading: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Lazy loading</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bildirim Ayarları */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Bildirim Ayarları
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.soundNotifications || true}
                      onChange={(e) => onUpdateSettings({ ...settings, soundNotifications: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ses bildirimleri</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings?.desktopNotifications || false}
                      onChange={(e) => onUpdateSettings({ ...settings, desktopNotifications: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Desktop bildirimleri</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sıfırlama Butonu */}
            {onReset && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onReset}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Ayarları Sıfırla
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIUXSettingsPanel;
