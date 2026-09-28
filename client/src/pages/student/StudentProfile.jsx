import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Award,
  Code2,
  FolderGit2,
  Globe,
  Link2,
  Mail,
  Phone,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function StudentProfile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [profileData, setProfileData] = useState({
    name: '',
    rollNumber: '',
    department: '',
    batchYear: 2026,
    cgpa: 0,
    tenthPercentage: 0,
    twelfthOrDiplomaPercentage: 0,
    activeBacklogs: 0,
    historyBacklogs: 0,
    phone: '',
    email: '',
    skills: [],
    programmingLanguages: [],
    githubUrl: '',
    linkedinUrl: '',
    projects: [],
    placementStatus: 'Unplaced',
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await studentApi.getProfile();
        if (isMounted && res.success && res.data) {
          const d = res.data;
          setProfileData({
            name: d.user?.name || user?.name || '',
            rollNumber: d.rollNumber || '',
            department: d.department || '',
            batchYear: d.batchYear || 2026,
            cgpa: d.cgpa || 0,
            tenthPercentage: d.tenthPercentage || 0,
            twelfthOrDiplomaPercentage: d.twelfthOrDiplomaPercentage || 0,
            activeBacklogs: d.activeBacklogs || 0,
            historyBacklogs: d.historyBacklogs || 0,
            phone: d.phone || '',
            email: d.user?.email || user?.email || '',
            skills: d.skills || [],
            programmingLanguages: d.programmingLanguages || [],
            githubUrl: d.githubUrl || '',
            linkedinUrl: d.linkedinUrl || '',
            projects: d.projects || [],
            placementStatus: d.placementStatus || 'Unplaced',
          });
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch student profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await studentApi.updateProfile({
        phone: profileData.phone,
        skills: profileData.skills,
        programmingLanguages: profileData.programmingLanguages,
        githubUrl: profileData.githubUrl,
        linkedinUrl: profileData.linkedinUrl,
      });

      if (res.success) {
        setIsEditing(false);
        setSavedSuccess(true);
        if (refreshUser) refreshUser();
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-indigo-500/20">
            {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{profileData.name}</h2>
              <Badge variant={profileData.placementStatus === 'Placed' ? 'SELECTED' : 'neutral'}>
                {profileData.placementStatus}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Roll No: <span className="font-semibold text-slate-700">{profileData.rollNumber}</span> • {profileData.department} • Batch of {profileData.batchYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-in fade-in">
              <CheckCircle className="w-4 h-4" />
              Profile Updated!
            </span>
          )}
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="emerald" size="sm" icon={Save} loading={saving} onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Contact & Skills
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Academic Info & Verified Records */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Academic Credentials (TPO Verified) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Academic Verification</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Cumulative CGPA</span>
              <span className="font-bold text-slate-900">{profileData.cgpa} / 10.0</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Active Backlogs</span>
              <span className="font-bold text-emerald-600">{profileData.activeBacklogs}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">History Backlogs</span>
              <span className="font-bold text-slate-900">{profileData.historyBacklogs}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">10th Std Percentage</span>
              <span className="font-bold text-slate-900">{profileData.tenthPercentage || 'N/A'}%</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">12th / Diploma %</span>
              <span className="font-bold text-slate-900">{profileData.twelfthOrDiplomaPercentage || 'N/A'}%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500">
            🔒 Academic records (CGPA, backlogs, department) are verified by the College Placement Office.
          </div>
        </div>

        {/* Center & Right Columns: Skills & Contact */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Contact & Professional Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email</label>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-slate-800">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{profileData.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="+91 9876543210"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-slate-800">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{profileData.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">GitHub Profile</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={profileData.githubUrl}
                    onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://github.com/username"
                  />
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-800 truncate">
                    {profileData.githubUrl ? (
                      <a href={profileData.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                        {profileData.githubUrl}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">LinkedIn Profile</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={profileData.linkedinUrl}
                    onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-800 truncate">
                    {profileData.linkedinUrl ? (
                      <a href={profileData.linkedinUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                        {profileData.linkedinUrl}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Technical Skills</h3>
              </div>
              <span className="text-xs text-slate-400">{profileData.skills.length} skills</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {profileData.skills.length === 0 ? (
                <p className="text-xs text-slate-400">No skills added yet. Click Edit to add skills.</p>
              ) : (
                profileData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-rose-600"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              )}
            </div>

            {isEditing && (
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new skill (e.g. React, Node.js, Python)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <Button type="submit" size="sm" variant="outline" icon={Plus}>
                  Add
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
