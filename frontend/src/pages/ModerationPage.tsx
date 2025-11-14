import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { moderationAPI } from '@/lib/api';
import { ArrowLeft, AlertTriangle, Users, Shield, Activity } from 'lucide-react';
import type { Report } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [reportsRes, statsRes] = await Promise.all([
        moderationAPI.getReports(filter),
        moderationAPI.getStats(),
      ]);
      setReports(reportsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading moderation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReport = async (reportId: string, status: string) => {
    try {
      await moderationAPI.updateReport(reportId, status);
      loadData();
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      SPAM: 'Spam',
      HARASSMENT: 'Harcèlement',
      INAPPROPRIATE_CONTENT: 'Contenu inapproprié',
      IMPERSONATION: 'Usurpation d\'identité',
      OTHER: 'Autre',
    };
    return labels[reason] || reason;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            to="/chat"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au chat
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Shield className="w-8 h-8 text-primary-600" />
              <span>Modération</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Gérer les signalements et modérer la communauté
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Signalements en attente</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.pendingReports}
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total signalements</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalReports}
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-gray-900 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Actions de modération</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.totalActions}
                  </p>
                </div>
                <Activity className="w-10 h-10 text-purple-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilisateurs actifs</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.activeUsers}
                  </p>
                </div>
                <Users className="w-10 h-10 text-green-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Signalements</h2>

              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('PENDING')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'PENDING'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  En attente
                </button>
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'ALL'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-12 text-center text-gray-500">
                Chargement...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun signalement</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                          {getReasonLabel(report.reason)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(
                            new Date(report.createdAt),
                            'dd MMM yyyy à HH:mm',
                            { locale: fr }
                          )}
                        </span>
                      </div>

                      <p className="text-gray-900 mb-2">
                        <span className="font-medium">Signalé par:</span>{' '}
                        {report.reporter?.username || 'Utilisateur inconnu'}
                      </p>
                      <p className="text-gray-900 mb-2">
                        <span className="font-medium">Utilisateur signalé:</span>{' '}
                        {report.reported?.username || 'Utilisateur inconnu'}
                      </p>

                      {report.description && (
                        <p className="text-gray-600 text-sm mt-2">
                          {report.description}
                        </p>
                      )}
                    </div>

                    {report.status === 'PENDING' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() =>
                            handleUpdateReport(report.id, 'REVIEWED')
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          En cours
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateReport(report.id, 'RESOLVED')
                          }
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Résolu
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateReport(report.id, 'DISMISSED')
                          }
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
