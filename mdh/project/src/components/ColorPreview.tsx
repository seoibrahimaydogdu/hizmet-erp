import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ColorPreview: React.FC = () => {
  const { primaryColor } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ana Renk Önizlemesi
        </h3>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
           Seçilen ana renk: <span className="font-mono text-primary">{primaryColor}</span>
           {primaryColor !== '#3b82f6' && (
             <span className="text-xs text-gray-500 ml-2">
               (Varsayılan: <span className="font-mono">#3b82f6</span>)
             </span>
           )}
         </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Buton Örnekleri */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Butonlar</h4>
            <div className="space-y-2">
                             <button className="w-full px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
                 Primary Button
               </button>
               <button className="w-full px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-800 rounded-lg text-sm font-medium transition-colors">
                 Secondary Button
               </button>
               <button className="w-full px-4 py-2 border-2 border-primary text-primary hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors">
                 Outline Button
               </button>
            </div>
          </div>

          {/* Link Örnekleri */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Linkler</h4>
            <div className="space-y-2">
                             <a href="#" className="block text-primary hover:text-primary-600 font-medium transition-colors">
                 Primary Link
               </a>
               <a href="#" className="block text-primary-600 hover:text-primary-700 font-medium transition-colors">
                 Secondary Link
               </a>
               <a href="#" className="block text-primary-500 hover:text-primary-600 font-medium transition-colors">
                 Tertiary Link
               </a>
            </div>
          </div>

          {/* Badge Örnekleri */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Badge'ler</h4>
            <div className="space-y-2">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                 Primary Badge
               </span>
               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                 Secondary Badge
               </span>
               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 border-primary text-primary">
                 Outline Badge
               </span>
            </div>
          </div>

                     {/* Input Örnekleri */}
           <div className="space-y-3">
             <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Elemanları</h4>
             <div className="space-y-2">
               <input 
                 type="text" 
                 placeholder="Örnek input" 
                 className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
               />
               <select className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                 <option>Seçenek 1</option>
                 <option>Seçenek 2</option>
                 <option>Seçenek 3</option>
               </select>
             </div>
           </div>

          {/* Alert Örnekleri */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Alert'ler</h4>
            <div className="space-y-2">
                             <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                 <p className="text-sm text-primary-800">Primary Alert</p>
               </div>
               <div className="p-3 bg-primary-100 border border-primary-300 rounded-lg">
                 <p className="text-sm text-primary-900">Secondary Alert</p>
               </div>
            </div>
          </div>

          {/* Card Örnekleri */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Kartlar</h4>
            <div className="space-y-2">
                             <div className="p-4 border-2 border-primary rounded-lg">
                 <h5 className="font-medium text-primary">Primary Card</h5>
                 <p className="text-sm text-primary-700">Bu kart ana renk kullanıyor</p>
               </div>
               <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
                 <h5 className="font-medium text-primary-800">Light Card</h5>
                 <p className="text-sm text-primary-600">Bu kart açık ton kullanıyor</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renk Paleti */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Renk Paleti</h4>
        <div className="grid grid-cols-5 gap-2">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-50 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">50</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">100</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-200 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">200</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-300 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">300</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-400 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">400</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-500 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">500</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-600 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">600</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-700 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">700</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-800 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">800</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-900 rounded-lg border border-gray-200 mx-auto mb-1"></div>
            <p className="text-xs text-gray-600">900</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPreview;
