import React, { useState } from 'react';
import { User, Mail, Phone, Building, Calendar, Camera, Save, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+90 555 123 4567',
    company: 'Destek Merkezi A.Ş.',
    role: 'Sistem Yöneticisi',
    department: 'Bilgi İşlem',
    joinDate: '2023-01-15',
    bio: 'Deneyimli sistem yöneticisi ve müşteri destek uzmanı. 5+ yıllık deneyim.',
    avatar: null as string | null
  });

  const handleSave = () => {
    // Profil kaydetme işlemi burada yapılacak
    setIsEditing(false);
    // toast.success('Profil güncellendi');
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile({ ...profile, avatar: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil Bilgileri</h1>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Kaydet
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Düzenle
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <div className="text-center">
              <div className="relative inline-block">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white dark:border-gray-700 shadow-lg">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                {profile.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{profile.role}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">{profile.department}</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ad Soyad
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white">{profile.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-posta
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white">{profile.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefon
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white">{profile.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Şirket
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Building className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white">{profile.company}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                {isEditing ? (
                  <select
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Sistem Yöneticisi">Sistem Yöneticisi</option>
                    <option value="Destek Uzmanı">Destek Uzmanı</option>
                    <option value="Müdür">Müdür</option>
                    <option value="Temsilci">Temsilci</option>
                  </select>
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white">{profile.role}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Katılım Tarihi
                </label>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(profile.joinDate), 'dd MMMM yyyy', { locale: tr })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hakkında
              </label>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">156</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Çözülen Talepler</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">4.9</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ortalama Puan</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">2.1h</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ortalama Yanıt Süresi</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Son Aktiviteler</h3>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white">Talep #12345 çözümlendi</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">2 saat önce</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white">Yeni müşteri eklendi</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">4 saat önce</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white">Sistem ayarları güncellendi</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">1 gün önce</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;