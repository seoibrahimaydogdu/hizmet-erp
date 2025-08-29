import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  department: string;
  joinDate: string;
  bio: string;
  avatar: string | null;
}

interface UserContextType {
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
}

const defaultProfile: UserProfile = {
  id: crypto.randomUUID(),
  name: 'Admin',
  email: 'ibrahim@workexe.co',
  phone: '+48501182962',
  company: 'Workexe',
  role: 'Genel Müdür',
  department: 'Genel Yönetim',
  joinDate: '2023-01-15',
  bio: 'Deneyimli sistem yöneticisi ve müşteri destek uzmanı. 5+ yıllık deneyim.',
  avatar: null
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(false);

  // Profil bilgilerini localStorage'dan yükle
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setUserProfile(parsedProfile);
      } catch (error) {
        console.error('Error loading profile from localStorage:', error);
        // Hata durumunda varsayılan profili kullan
        setUserProfile(defaultProfile);
      }
    }
  }, []);

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      // Simüle edilmiş API çağrısı - gerçek uygulamada burada Supabase'e kayıt yapılır
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedProfile = { ...userProfile, ...profile };
      setUserProfile(updatedProfile);
      
      // Profil bilgilerini localStorage'a kaydet
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      toast.success('Profil bilgileri başarıyla güncellendi');
    } catch (error) {
      toast.error('Profil güncellenirken hata oluştu');
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    userProfile,
    updateUserProfile,
    isLoading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
