import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Eye, 
  Edit, 
  Clock,
  Shield,
  Flag,
  History,
  RefreshCw,
  Download,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Bell,
  Mail,
  Phone,
  Globe,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Activity,
  Zap,
  Target,
  Award,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  MessageCircle,
  Hash,
  AtSign,
  DollarSign,
  CreditCard,
  Receipt,
  Package,
  Truck,
  Home,
  Building,
  MapPin,
  Navigation,
  Compass,
  Globe2,
  Map,
  Layers,
  Grid,
  List,
  Columns,
  Rows,
  Layout,
  Sidebar,
  Menu,
  X,
  Plus,
  Minus,
  Divide,
  Percent,
  Infinity,
  Pi,
  Sigma,
  Function,
  Variable,
  Code,
  Terminal,
  Command,
  Power,
  PowerOff,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Printer,
  Scanner,
  Camera,
  Video,
  VideoOff,
  Image,
  File,
  Folder,
  FolderOpen,
  Archive,
  Book,
  BookOpen,
  Newspaper
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import RevertHistory from './RevertHistory';

interface AdminRevertHistoryProps {
  currentUser: any;
}

const AdminRevertHistory: React.FC<AdminRevertHistoryProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReverts: 0,
    pendingReviews: 0,
    approvedReverts: 0,
    rejectedReverts: 0,
    investigationRequired: 0,
    todayReverts: 0,
    thisWeekReverts: 0,
    thisMonthReverts: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Toplam geri alma sayısı
      const { count: totalReverts } = await supabase
        .from('ticket_version_reverts')
        .select('*', { count: 'exact', head: true });

      // Bekleyen incelemeler
      const { count: pendingReviews } = await supabase
        .from('ticket_version_reverts')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'pending');

      // Onaylanan geri almalar
      const { count: approvedReverts } = await supabase
        .from('ticket_version_reverts')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'approved');

      // Reddedilen geri almalar
      const { count: rejectedReverts } = await supabase
        .from('ticket_version_reverts')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'rejected');

      // İnceleme gerekli
      const { count: investigationRequired } = await supabase
        .from('ticket_version_reverts')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'investigation_required');

      // Bugünkü geri almalar
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayReverts } = await supabase
        .from('ticket_version_reverts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Bu haftaki geri almalar
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      const { count: thisWeekReverts } = await supabase
        .from('ticket_version_reverts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisWeek.toISOString());

      // Bu ayki geri almalar
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const { count: thisMonthReverts } = await supabase
        .from('ticket_version_reverts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString());

      setStats({
        totalReverts: totalReverts || 0,
        pendingReviews: pendingReviews || 0,
        approvedReverts: approvedReverts || 0,
        rejectedReverts: rejectedReverts || 0,
        investigationRequired: investigationRequired || 0,
        todayReverts: todayReverts || 0,
        thisWeekReverts: thisWeekReverts || 0,
        thisMonthReverts: thisMonthReverts || 0
      });
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
      toast.error('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">İstatistikler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin - Geri Alma Geçmişi
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tüm geri alma işlemlerini izleyin ve yönetin
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Yenile</span>
        </button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Geri Alma
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalReverts}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <RotateCcw className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bekleyen İnceleme
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.pendingReviews}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Onaylanan
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.approvedReverts}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Reddedilen
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.rejectedReverts}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Zaman bazlı istatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bugün
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.todayReverts}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bu Hafta
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.thisWeekReverts}
              </p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bu Ay
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.thisMonthReverts}
              </p>
            </div>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Uyarı kartı */}
      {stats.pendingReviews > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">
                Bekleyen İncelemeler
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                {stats.pendingReviews} adet geri alma işlemi inceleme bekliyor. Lütfen bu işlemleri gözden geçirin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Geri alma geçmişi bileşeni */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tüm Geri Alma İşlemleri
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Sistemdeki tüm geri alma işlemlerini görüntüleyin ve yönetin
          </p>
        </div>
        <div className="p-6">
          <RevertHistory isAdmin={true} />
        </div>
      </div>

      {/* Güvenlik notları */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Güvenlik ve Denetim
            </h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
              <p>• Tüm geri alma işlemleri kalıcı olarak kaydedilir ve silinemez</p>
              <p>• Her geri alma işlemi için detaylı log tutulur</p>
              <p>• Şüpheli işlemler için inceleme sistemi mevcuttur</p>
              <p>• Admin panelinde tüm işlemler görüntülenebilir</p>
              <p>• Kötü niyetli kullanıcılar için caydırıcı önlemler alınmıştır</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRevertHistory;
