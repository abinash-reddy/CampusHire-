import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { companiesApi } from '../../services/api';

export default function CompanyManagement() {
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: 'IT / Software',
    tier: 'Dream',
    location: 'Bengaluru, India',
    website: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await companiesApi.getAll(params);
      if (res.success) {
        setCompanies(res.data?.companies || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError(err.message || 'Unable to load partner companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompanies();
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.name.trim()) return;

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        name: newCompany.name.trim(),
        industry: newCompany.industry,
        tier: newCompany.tier,
        location: newCompany.location.trim(),
        website: newCompany.website.trim() || undefined,
        contactPerson: {
          name: newCompany.contactName.trim() || undefined,
          email: newCompany.contactEmail.trim() || undefined,
          phone: newCompany.contactPhone.trim() || undefined,
        },
      };

      if (newCompany.contactEmail.trim()) {
        payload.contactEmail = newCompany.contactEmail.trim();
      }

      const res = await companiesApi.create(payload);
      if (res.success) {
        setSuccessMsg(`Company "${newCompany.name}" registered successfully!`);
        setIsAddModalOpen(false);
        setNewCompany({
          name: '',
          industry: 'IT / Software',
          tier: 'Dream',
          location: 'Bengaluru, India',
          website: '',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
        });
        fetchCompanies();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to create company:', err);
      setFormError(err.message || 'Failed to create partner company');
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
            <Building2 className="w-6 h-6 text-indigo-600" />
            Hiring Partner Companies
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain corporate recruiters, tiers, contact persons, and on-campus recruitment status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchCompanies} loading={loading}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
          >
            Add Partner Company
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by company name or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading partner companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Companies Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Add Partner Company" to onboard corporate recruiters to CampusHire.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((comp) => {
            const poc = comp.contactPerson || {};
            const email = poc.email || comp.contactEmail || 'N/A';
            const phone = poc.phone || 'N/A';
            const contactName = poc.name || 'Placement Coordinator';

            return (
              <div
                key={comp._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={comp.tier}>{comp.tier}</Badge>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {comp.isActive ? 'Active Partner' : 'Archived'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">{comp.name}</h3>
                  <p className="text-xs text-indigo-600 font-medium">{comp.industry}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{comp.location || 'India'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium truncate max-w-[150px]">
                    POC: {contactName}
                  </span>
                  {comp.website && (
                    <a
                      href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Hiring Partner Company"
          subtitle="Register an enterprise recruitment partner for on-campus drives"
        >
          <form onSubmit={handleAddCompany} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="e.g. Microsoft Corporation"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CTC Tier
                </label>
                <select
                  value={newCompany.tier}
                  onChange={(e) => setNewCompany({ ...newCompany, tier: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="SuperDream">SuperDream (&gt; 15 LPA)</option>
                  <option value="Dream">Dream (10 - 15 LPA)</option>
                  <option value="Normal">Normal (&lt; 10 LPA)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Location
                </label>
                <input
                  type="text"
                  value={newCompany.location}
                  onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={newCompany.website}
                  onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Recruiter Contact Details</h4>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={newCompany.contactName}
                  onChange={(e) => setNewCompany({ ...newCompany, contactName: e.target.value })}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newCompany.contactEmail}
                  onChange={(e) => setNewCompany({ ...newCompany, contactEmail: e.target.value })}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newCompany.contactPhone}
                  onChange={(e) => setNewCompany({ ...newCompany, contactPhone: e.target.value })}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Save Partner Company
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
