import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { getActiveProfileId } from "../lib/active-profile";

interface FavoriteField {
  id: string;
  title: string;
  status: string;
  region: string;
  commune: string;
  price: number;
  areaSqm: number;
  operationType: string;
  medias: { url: string; thumbnailUrl?: string }[];
  profile: { id: string; displayName: string; photoUrl?: string };
}

interface FavoriteProduction {
  id: string;
  name: string;
  status: string;
  category: string;
  offerType: string;
  price: number;
  quantityAvailable: number;
  quantityUnit: string;
  region: string;
  medias: { url: string; thumbnailUrl?: string }[];
  profile: { id: string; displayName: string; photoUrl?: string };
}

export interface Favorite {
  id: string;
  profileId: string;
  fieldId?: string;
  productionId?: string;
  field?: FavoriteField | null;
  production?: FavoriteProduction | null;
  createdAt: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await apiFetch<Favorite[]>("/api/favorites");
    if (err) {
      setError(err);
    } else {
      setFavorites(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const isFavorite = (type: "field" | "production", id: string): boolean => {
    if (type === "field") {
      return favorites.some((f) => f.fieldId === id);
    }
    return favorites.some((f) => f.productionId === id);
  };

  const toggleFavorite = async (type: "field" | "production", id: string): Promise<boolean> => {
    const isCurrentlyFavorite = isFavorite(type, id);

    if (isCurrentlyFavorite) {
      // Retirer des favoris
      const { error: err } = await apiFetch(
        `/api/favorites?${type}Id=${id}`,
        { method: "DELETE" }
      );

      if (err) {
        setError(err);
        return false;
      }

      // Mettre à jour l'état local
      setFavorites((prev) =>
        prev.filter((f) =>
          type === "field" ? f.fieldId !== id : f.productionId !== id
        )
      );
      return false; // Plus un favori
    } else {
      // Ajouter aux favoris
      const profileId = await getActiveProfileId();
      if (!profileId) {
        setError("Profil actif introuvable");
        return false;
      }

      const body = type === "field" ? { fieldId: id } : { productionId: id };

      const { data, error: err } = await apiFetch<Favorite>("/api/favorites", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (err) {
        // Si c'est déjà un favori (409), on recharge juste
        if (err.includes("409") || err.toLowerCase().includes("already")) {
          await load();
          return true;
        }
        setError(err);
        return false;
      }

      if (data) {
        setFavorites((prev) => [data, ...prev]);
      }
      return true; // Maintenant un favori
    }
  };

  return {
    favorites,
    loading,
    error,
    isFavorite,
    toggleFavorite,
    reload: load,
  };
}
