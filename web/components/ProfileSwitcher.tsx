"use client";

import { useState, useEffect } from "react";
import { ProfileType } from "@/app/generated/prisma";
import { getActiveProfile, setActiveProfile, type ActiveProfile } from "@/lib/profile/active-profile";

interface Profile {
  id: string;
  type: ProfileType;
  displayName: string;
}

interface ProfileSwitcherProps {
  profiles: Profile[];
  onSwitch?: (profile: ActiveProfile) => void;
}

const PROFILE_ICONS: Record<ProfileType, string> = {
  OWNER: "📍",
  PRODUCER: "🌾",
  BUYER: "🛒",
  INVESTOR: "💰",
  PROVIDER: "🚜",
};

const PROFILE_LABELS: Record<ProfileType, string> = {
  OWNER: "Propriétaire",
  PRODUCER: "Producteur",
  BUYER: "Acheteur",
  INVESTOR: "Investisseur",
  PROVIDER: "Prestataire",
};

const PROFILE_COLORS: Record<ProfileType, string> = {
  OWNER: "bg-green-100 text-green-800 border-green-300",
  PRODUCER: "bg-amber-100 text-amber-800 border-amber-300",
  BUYER: "bg-blue-100 text-blue-800 border-blue-300",
  INVESTOR: "bg-purple-100 text-purple-800 border-purple-300",
  PROVIDER: "bg-orange-100 text-orange-800 border-orange-300",
};

export function ProfileSwitcher({ profiles, onSwitch }: ProfileSwitcherProps) {
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const current = getActiveProfile();
    if (current) {
      setActiveProfileState(current);
    } else if (profiles.length > 0) {
      // Définir le premier profil comme actif par défaut
      const defaultProfile = {
        id: profiles[0].id,
        type: profiles[0].type,
        displayName: profiles[0].displayName,
      };
      setActiveProfile(defaultProfile);
      setActiveProfileState(defaultProfile);
    }
  }, [profiles]);

  const handleSwitchProfile = (profile: Profile) => {
    const newActiveProfile: ActiveProfile = {
      id: profile.id,
      type: profile.type,
      displayName: profile.displayName,
    };

    setActiveProfile(newActiveProfile);
    setActiveProfileState(newActiveProfile);
    setIsOpen(false);

    if (onSwitch) {
      onSwitch(newActiveProfile);
    }
  };

  if (profiles.length === 0) {
    return null;
  }

  if (profiles.length === 1) {
    // Un seul profil, pas besoin de switcher
    const profile = profiles[0];
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${PROFILE_COLORS[profile.type]}`}>
        <span className="text-lg">{PROFILE_ICONS[profile.type]}</span>
        <span className="font-medium text-sm">{PROFILE_LABELS[profile.type]}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          activeProfile ? PROFILE_COLORS[activeProfile.type] : "bg-gray-100 text-gray-800 border-gray-300"
        } hover:shadow-md`}
      >
        {activeProfile && (
          <>
            <span className="text-lg">{PROFILE_ICONS[activeProfile.type]}</span>
            <span className="font-medium text-sm">{PROFILE_LABELS[activeProfile.type]}</span>
          </>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Changer de profil
              </p>
            </div>

            <div className="py-1">
              {profiles.map((profile) => {
                const isActive = activeProfile?.id === profile.id;

                return (
                  <button
                    key={profile.id}
                    onClick={() => handleSwitchProfile(profile)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      isActive ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{PROFILE_ICONS[profile.type]}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">
                          {profile.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {PROFILE_LABELS[profile.type]}
                        </p>
                      </div>
                      {isActive && (
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-2 border-t border-gray-200">
              <a
                href="/dashboard/profiles/add"
                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un profil
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
