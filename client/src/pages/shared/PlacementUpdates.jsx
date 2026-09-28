import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Search,
  AlertCircle,
  Calendar,
  User,
  Tag,
  RefreshCw,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { updatesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PlacementUpdates() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'tpo';

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [newUpdate, setNewUpdate] = useState({
    title: '',
    category: 'IMPORTANT',
    priority: 'HIGH',
    description: '',
  });

  const categories = ['ALL', 'IMPORTANT', 'RECRUITMENT', 'INTERVIEW', 'RESULT', 'GENERAL'];

  useEffect(() => {
    fetchUpdates();
  }, [selectedCategory]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await updatesApi.getAll(params);
      if (res.success) {
        setUpdates(res.data?.updates || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch placement updates:', err);
      setError(err.message || 'Unable to load updates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUpdates();
  };

  const handleCreateUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdate.title.trim() || !newUpdate.description.trim()) {
      setFormError('Please provide both announcement title and description');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        title: newUpdate.title.trim(),
        category: newUpdate.category,
        priority: newUpdate.priority,
        description: newUpdate.description.trim(),
      };

      const res = await updatesApi.create(payload);
      if (res.success) {
        setSuccessMsg('Announcement published successfully to placement notice board!');
        setIsCreateModalOpen(false);
        setNewUpdate({
          title: '',
          category: 'IMPORTANT',
          priority: 'HIGH',
          description: '',
        });
        fetchUpdates();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to publish announcement:', err);
      setFormError(err.message || 'Failed to create placement bulletin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            Placement Notice Board & Updates
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official announcements, schedule changes, and recruitment bulletins from the TPO Cell
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Post Announcement
            </Button>
          )}
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchUpdates} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search bulletins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </div>

      {/* Notice Cards List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading placement bulletins...</p>
        </div>
      ) : updates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80 space-y-3">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Announcements Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no published bulletins matching your category or search criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => {
            const formattedDate = update.publishedAt
              ? new Date(update.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent';

            const authorName = update.createdBy?.name || 'TPO Office';

            return (
              <div
                key={update._id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all hover:shadow-md ${
                  update.priority === 'URGENT'
                    ? 'border-red-200 bg-gradient-to-r from-red-50/20 via-white to-white'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={update.category}>{update.category}</Badge>
                    {update.priority === 'URGENT' && (
                      <Badge variant="URGENT">URGENT</Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  {update.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {update.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    Published by {authorName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Publish Bulletin Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Publish Official Placement Bulletin"
          subtitle="Broadcast important recruitment announcements and circulars to students"
        >
          <form onSubmit={handleCreateUpdate} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Schedule Changes for Technical Round"
                value={newUpdate.title}
                onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={newUpdate.category}
                  onChange={(e) => setNewUpdate({ ...newUpdate, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="IMPORTANT">IMPORTANT</option>
                  <option value="COMPANY">COMPANY</option>
                  <option value="RECRUITMENT">RECRUITMENT</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                  <option value="RESULT">RESULT</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority Level *
                </label>
                <select
                  value={newUpdate.priority}
                  onChange={(e) => setNewUpdate({ ...newUpdate, priority: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Announcement Description *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Write the full announcement details, instructions, and venue guidelines..."
                value={newUpdate.description}
                onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Plus}
                loading={submitting}
              >
                Publish Notice
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
