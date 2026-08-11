/**
 * Exemples de composants React pour utiliser les routes API Profils
 *
 * Ces exemples montrent comment :
 * - Créer un nouveau profil (onboarding)
 * - Lister les profils existants
 * - Changer de profil actif
 * - Modifier un profil
 * - Désactiver un profil
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// Types (synchronisés avec le backend)
// ─────────────────────────────────────────────────────────────────────────────

type ProfileType = 'OWNER' | 'PRODUCER' | 'BUYER' | 'INVESTOR' | 'PROVIDER';

interface Profile {
  id: string;
  type: ProfileType;
  displayName: string;
  photoUrl?: string;
  bio?: string;
  region?: string;
  department?: string;
  commune?: string;
  locality?: string;
  phoneVisible: boolean;
  activityArea?: string;
  verificationLevels: string[];
  avgResponseHours?: number;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Hook personnalisé pour gérer les profils
// ─────────────────────────────────────────────────────────────────────────────

function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les profils au montage du composant
  useEffect(() => {
    fetchProfiles();

    // Récupérer le profil actif depuis le localStorage
    const storedProfileId = localStorage.getItem('activeProfileId');
    if (storedProfileId) {
      setActiveProfileId(storedProfileId);
    }
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profiles', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des profils');
      }

      const data = await response.json();
      setProfiles(data.profiles);

      // Si aucun profil actif sélectionné, prendre le premier
      if (!activeProfileId && data.profiles.length > 0) {
        switchProfile(data.profiles[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const switchProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    localStorage.setItem('activeProfileId', profileId);
  };

  const createProfile = async (data: Partial<Profile>) => {
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du profil');
      }

      const result = await response.json();

      // Recharger la liste des profils
      await fetchProfiles();

      // Si c'est le premier profil, le définir comme actif
      if (result.hasCompletedOnboarding) {
        switchProfile(result.profile.id);
      }

      return result.profile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const updateProfile = async (profileId: string, data: Partial<Profile>) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      // Recharger la liste des profils
      await fetchProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      // Si on supprime le profil actif, basculer vers un autre
      if (profileId === activeProfileId) {
        const remaining = profiles.filter(p => p.id !== profileId);
        if (remaining.length > 0) {
          switchProfile(remaining[0].id);
        }
      }

      // Recharger la liste des profils
      await fetchProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const getActiveProfile = () => {
    return profiles.find(p => p.id === activeProfileId);
  };

  return {
    profiles,
    activeProfileId,
    activeProfile: getActiveProfile(),
    loading,
    error,
    switchProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    refetch: fetchProfiles,
  };
}

// Helper pour récupérer le token (à adapter selon votre système d'auth)
function getToken() {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1] || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Composant : Choix du profil (onboarding)
// ─────────────────────────────────────────────────────────────────────────────

export function OnboardingChoice() {
  const router = useRouter();
  const { createProfile } = useProfiles();

  const profileTypes = [
    {
      type: 'OWNER' as ProfileType,
      icon: '📍',
      title: 'J\'ai une terre à louer/vendre',
      subtitle: 'Propriétaire foncier',
    },
    {
      type: 'PRODUCER' as ProfileType,
      icon: '🌾',
      title: 'Je veux vendre ma production',
      subtitle: 'Producteur agricole',
    },
    {
      type: 'BUYER' as ProfileType,
      icon: '🛒',
      title: 'Je veux acheter des produits',
      subtitle: 'Acheteur',
    },
    {
      type: 'INVESTOR' as ProfileType,
      icon: '💰',
      title: 'Je cherche à investir',
      subtitle: 'Investisseur',
    },
    {
      type: 'PROVIDER' as ProfileType,
      icon: '🚜',
      title: 'J\'offre des services',
      subtitle: 'Prestataire agricole',
    },
  ];

  const handleSelectType = (type: ProfileType) => {
    // Rediriger vers le formulaire spécifique
    router.push(`/onboarding/${type.toLowerCase()}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Bienvenue !</h1>
      <p className="text-gray-600 mb-8">
        Que voulez-vous faire sur SunuAgri ?
      </p>

      <div className="space-y-4">
        {profileTypes.map((profile) => (
          <button
            key={profile.type}
            onClick={() => handleSelectType(profile.type)}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{profile.icon}</span>
              <div>
                <h3 className="font-semibold text-lg">{profile.title}</h3>
                <p className="text-gray-600">{profile.subtitle}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="mt-6 text-gray-600 hover:text-gray-900"
      >
        Continuer sans profil (navigation limitée)
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Composant : Formulaire Propriétaire (OWNER)
// ─────────────────────────────────────────────────────────────────────────────

export function OnboardingOwnerForm() {
  const router = useRouter();
  const { createProfile } = useProfiles();
  const [formData, setFormData] = useState({
    displayName: '',
    region: '',
    department: '',
    commune: '',
    locality: '',
    photoUrl: '',
    bio: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await createProfile({
        type: 'OWNER',
        displayName: formData.displayName,
        region: formData.region,
        department: formData.department || undefined,
        commune: formData.commune,
        locality: formData.locality || undefined,
        photoUrl: formData.photoUrl || undefined,
        bio: formData.bio || undefined,
      });

      // Rediriger vers le dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du profil');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profil Propriétaire</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nom complet ou raison sociale *
          </label>
          <input
            type="text"
            required
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Moussa Diop"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Région *</label>
          <select
            required
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">Sélectionnez une région</option>
            <option value="Dakar">Dakar</option>
            <option value="Thiès">Thiès</option>
            <option value="Diourbel">Diourbel</option>
            <option value="Fatick">Fatick</option>
            <option value="Kaolack">Kaolack</option>
            <option value="Kolda">Kolda</option>
            <option value="Louga">Louga</option>
            <option value="Matam">Matam</option>
            <option value="Saint-Louis">Saint-Louis</option>
            <option value="Sédhiou">Sédhiou</option>
            <option value="Tambacounda">Tambacounda</option>
            <option value="Kaffrine">Kaffrine</option>
            <option value="Kédougou">Kédougou</option>
            <option value="Ziguinchor">Ziguinchor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Département</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Thiès"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Commune *</label>
          <input
            type="text"
            required
            value={formData.commune}
            onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Thiès Ouest"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Localité</label>
          <input
            type="text"
            value={formData.locality}
            onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Mbour 2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bio (optionnel)</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Décrivez votre activité..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {submitting ? 'Création en cours...' : 'Créer mon profil'}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Composant : Liste des profils + changement de profil actif
// ─────────────────────────────────────────────────────────────────────────────

export function ProfileSwitcher() {
  const { profiles, activeProfileId, switchProfile, loading } = useProfiles();

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Mes profils</h2>

      <div className="space-y-3">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => switchProfile(profile.id)}
            className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
              profile.id === activeProfileId
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{getProfileIcon(profile.type)}</span>
                  <span className="font-semibold">{profile.displayName}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getProfileTypeLabel(profile.type)}
                </p>
              </div>
              {profile.id === activeProfileId && (
                <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                  Actif
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Helpers
function getProfileIcon(type: ProfileType): string {
  const icons: Record<ProfileType, string> = {
    OWNER: '📍',
    PRODUCER: '🌾',
    BUYER: '🛒',
    INVESTOR: '💰',
    PROVIDER: '🚜',
  };
  return icons[type];
}

function getProfileTypeLabel(type: ProfileType): string {
  const labels: Record<ProfileType, string> = {
    OWNER: 'Propriétaire foncier',
    PRODUCER: 'Producteur agricole',
    BUYER: 'Acheteur',
    INVESTOR: 'Investisseur',
    PROVIDER: 'Prestataire agricole',
  };
  return labels[type];
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Composant : Utilisation du profil actif pour créer un champ
// ─────────────────────────────────────────────────────────────────────────────

export function CreateFieldButton() {
  const { activeProfile, activeProfileId } = useProfiles();
  const router = useRouter();

  const handleCreateField = async () => {
    if (!activeProfile || activeProfile.type !== 'OWNER') {
      alert('Vous devez avoir un profil Propriétaire pour publier un champ');
      return;
    }

    // Envoyer la requête avec le header X-Active-Profile
    const response = await fetch('/api/fields', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'X-Active-Profile': activeProfileId!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Mon nouveau champ',
        description: 'Description...',
        operationType: 'SEASONAL_RENT',
        region: activeProfile.region,
        commune: activeProfile.commune,
        areaSqm: 10000,
        price: 500000,
      }),
    });

    if (response.ok) {
      router.push('/dashboard/fields');
    } else {
      const error = await response.json();
      alert(error.message);
    }
  };

  return (
    <button
      onClick={handleCreateField}
      disabled={!activeProfile || activeProfile.type !== 'OWNER'}
      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      + Publier un champ
    </button>
  );
}
