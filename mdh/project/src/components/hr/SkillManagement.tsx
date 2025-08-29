import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Brain,
  Award,
  TrendingUp,
  Users,
  Target,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  PieChart,
  BarChart3,
  Zap,
  BookOpen,
  Code,
  Palette,
  Globe,
  Shield,
  Settings,
  Lightbulb
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  category: string;
  level: string;
  description?: string;
  employees_count?: number;
  demand_level?: string;
  created_at?: string;
}

interface SkillFormData {
  name: string;
  category: string;
  level: string;
  description?: string;
}

interface SkillManagementProps {
  skills: Skill[];
  onSkillUpdate: () => void;
}

const SkillManagement: React.FC<SkillManagementProps> = ({ skills, onSkillUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showEditSkill, setShowEditSkill] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillFormData, setSkillFormData] = useState<SkillFormData>({
    name: '',
    category: '',
    level: 'beginner',
    description: ''
  });

  const skillCategories = ['Programlama', 'Frontend', 'Backend', 'DevOps', 'Cloud', 'Soft Skills', 'Satış', 'İnsan Kaynakları', 'Sistem Yönetimi'];
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Başlangıç';
      case 'intermediate': return 'Orta';
      case 'advanced': return 'İleri';
      case 'expert': return 'Uzman';
      default: return level;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'intermediate': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'advanced': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expert': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Programlama': return <Code className="w-5 h-5" />;
      case 'Frontend': return <Palette className="w-5 h-5" />;
      case 'Backend': return <Settings className="w-5 h-5" />;
      case 'DevOps': return <Zap className="w-5 h-5" />;
      case 'Cloud': return <Globe className="w-5 h-5" />;
      case 'Soft Skills': return <Users className="w-5 h-5" />;
      case 'Satış': return <TrendingUp className="w-5 h-5" />;
      case 'İnsan Kaynakları': return <Shield className="w-5 h-5" />;
      case 'Sistem Yönetimi': return <Settings className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || skill.category === categoryFilter;
    const matchesLevel = !levelFilter || skill.level === levelFilter;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleAddSkill = async () => {
    try {
      const { error } = await supabase
        .from('skills')
        .insert([skillFormData]);

      if (error) throw error;

      setShowAddSkill(false);
      setSkillFormData({
        name: '',
        category: '',
        level: 'beginner',
        description: ''
      });
      onSkillUpdate();
    } catch (error) {
      console.error('Beceri eklenirken hata:', error);
    }
  };

  const handleEditSkill = async () => {
    if (!selectedSkill) return;

    try {
      const { error } = await supabase
        .from('skills')
        .update(skillFormData)
        .eq('id', selectedSkill.id);

      if (error) throw error;

      setShowEditSkill(false);
      setSelectedSkill(null);
      onSkillUpdate();
    } catch (error) {
      console.error('Beceri güncellenirken hata:', error);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Bu beceriyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onSkillUpdate();
    } catch (error) {
      console.error('Beceri silinirken hata:', error);
    }
  };

  const handleEditSkillClick = (skill: Skill) => {
    setSelectedSkill(skill);
    setSkillFormData({
      name: skill.name,
      category: skill.category,
      level: skill.level,
      description: skill.description || ''
    });
    setShowEditSkill(true);
  };

  // İstatistikler hesaplama
  const totalSkills = skills.length;
  const expertSkills = skills.filter(s => s.level === 'expert').length;
  const advancedSkills = skills.filter(s => s.level === 'advanced').length;
  const intermediateSkills = skills.filter(s => s.level === 'intermediate').length;
  const beginnerSkills = skills.filter(s => s.level === 'beginner').length;

  // Kategori bazlı dağılım
  const categoryDistribution = skillCategories.map(category => ({
    category,
    count: skills.filter(s => s.category === category).length,
    expertRatio: skills.filter(s => s.category === category && s.level === 'expert').length
  }));

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Beceri</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSkills}</p>
            </div>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900 dark:to-violet-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uzman Seviye</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{expertSkills}</p>
            </div>
            <div className="p-2 bg-purple-500 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">İleri Seviye</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{advancedSkills}</p>
            </div>
            <div className="p-2 bg-green-500 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Orta Seviye</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{intermediateSkills}</p>
            </div>
            <div className="p-2 bg-yellow-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Beceri ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Kategoriler</option>
              {skillCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Seviyeler</option>
              {skillLevels.map(level => (
                <option key={level} value={level}>{getLevelLabel(level)}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowAddSkill(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Beceri Ekle</span>
          </button>
        </div>
      </div>

      {/* Kategori Bazlı Beceri Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryDistribution.map((categoryData) => (
          <div key={categoryData.category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  {getCategoryIcon(categoryData.category)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {categoryData.category}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {categoryData.count} beceri
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {categoryData.count}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Toplam
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Uzman Oranı</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {categoryData.count > 0 ? Math.round((categoryData.expertRatio / categoryData.count) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${categoryData.count > 0 ? (categoryData.expertRatio / categoryData.count) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Beceri Seviye Dağılımı Grafiği */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
          Beceri Seviye Dağılımı
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{beginnerSkills}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Başlangıç</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalSkills > 0 ? Math.round((beginnerSkills / totalSkills) * 100) : 0}%
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{intermediateSkills}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Orta</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalSkills > 0 ? Math.round((intermediateSkills / totalSkills) * 100) : 0}%
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{advancedSkills}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">İleri</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalSkills > 0 ? Math.round((advancedSkills / totalSkills) * 100) : 0}%
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{expertSkills}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Uzman</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalSkills > 0 ? Math.round((expertSkills / totalSkills) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Beceri Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Beceri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Seviye
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSkills.map((skill) => (
                <tr key={skill.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                          <Brain className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {skill.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded mr-2">
                        {getCategoryIcon(skill.category)}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{skill.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(skill.level)}`}>
                      {getLevelLabel(skill.level)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {skill.description || 'Açıklama yok'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSkillClick(skill)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Beceri Ekleme Modal */}
      {showAddSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Beceri Ekle</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Beceri Adı"
                value={skillFormData.name}
                onChange={(e) => setSkillFormData({...skillFormData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <select
                value={skillFormData.category}
                onChange={(e) => setSkillFormData({...skillFormData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Kategori Seçin</option>
                {skillCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={skillFormData.level}
                onChange={(e) => setSkillFormData({...skillFormData, level: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="beginner">Başlangıç</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
                <option value="expert">Uzman</option>
              </select>
              <textarea
                placeholder="Açıklama (Opsiyonel)"
                value={skillFormData.description}
                onChange={(e) => setSkillFormData({...skillFormData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddSkill(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleAddSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beceri Düzenleme Modal */}
      {showEditSkill && selectedSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Beceri Düzenle</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Beceri Adı"
                value={skillFormData.name}
                onChange={(e) => setSkillFormData({...skillFormData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <select
                value={skillFormData.category}
                onChange={(e) => setSkillFormData({...skillFormData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Kategori Seçin</option>
                {skillCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={skillFormData.level}
                onChange={(e) => setSkillFormData({...skillFormData, level: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="beginner">Başlangıç</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
                <option value="expert">Uzman</option>
              </select>
              <textarea
                placeholder="Açıklama (Opsiyonel)"
                value={skillFormData.description}
                onChange={(e) => setSkillFormData({...skillFormData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditSkill(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleEditSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillManagement;
