# Guide de Test - Écrans d'Onboarding

## Prérequis

1. **Serveur backend** : Assurez-vous que le serveur Next.js tourne sur `http://localhost:3000` (ou l'URL configurée dans `EXPO_PUBLIC_API_URL`)
2. **Expo Dev Client** : Installez l'app de développement custom
   ```bash
   cd mobile
   npx expo run:android  # ou npx expo run:ios
   ```
3. **Variables d'environnement** : Vérifiez `.env.local` dans le dossier mobile
   ```
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3000  # Pour émulateur Android
   # ou
   EXPO_PUBLIC_API_URL=http://192.168.1.X:3000  # Pour appareil physique
   ```

## Scénarios de Test

### 1. Test du flux complet d'onboarding

**Objectif** : Vérifier que l'utilisateur est correctement redirigé après l'inscription.

**Étapes** :
1. Lancez l'application
2. Cliquez sur "Créer un compte"
3. Remplissez le formulaire d'inscription (téléphone + mot de passe)
4. Entrez le code OTP reçu
5. **Résultat attendu** : Redirection automatique vers `/onboarding/`
6. L'écran de choix de profil s'affiche avec 5 options

**Points de vérification** :
- ✅ Redirection automatique (pas de flash d'écran vide)
- ✅ Les 5 cartes de profil sont visibles
- ✅ Les icônes et descriptions sont correctes
- ✅ Le lien "Continuer sans profil" est présent en bas

---

### 2. Test du formulaire Propriétaire

**Objectif** : Vérifier la validation et la soumission du formulaire.

**Étapes** :
1. Depuis l'écran de choix, cliquez sur "J'ai une terre à louer/vendre"
2. Tentez de soumettre sans remplir les champs
3. **Résultat attendu** : Messages d'erreur sous les champs requis
4. Remplissez le formulaire :
   - Nom : "Moussa Diop"
   - Photo : Testez caméra ET galerie
   - Région : Sélectionnez "Thiès"
   - Département : Sélectionnez "Thiès"
   - Commune : Sélectionnez "Thiès Ouest"
   - Localité : "Mbour 2" (optionnel)
5. Cliquez sur "Créer mon profil"
6. **Résultat attendu** : Redirection vers `/(app)/(tabs)` + Toast de succès

**Points de vérification** :
- ✅ Validation en temps réel (erreurs disparaissent quand corrigées)
- ✅ Bouton désactivé pendant le chargement
- ✅ Picker de région ouvre une modal avec liste complète
- ✅ Upload de photo fonctionne (prévisualisation visible)
- ✅ Bouton retour fonctionne
- ✅ AsyncStorage contient `activeProfileId` et `hasCompletedOnboarding: true`

**Vérification AsyncStorage** :
```javascript
// Dans Chrome DevTools (console du Metro bundler)
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.getItem('activeProfileId');
await AsyncStorage.getItem('hasCompletedOnboarding');
```

---

### 3. Test du formulaire Producteur

**Objectif** : Vérifier la multi-sélection des zones d'intervention.

**Étapes** :
1. Depuis l'écran de choix, cliquez sur "Je veux vendre ma production"
2. Remplissez :
   - Nom : "Awa Sène"
   - Activité principale : "Cultures maraîchères"
   - Région : "Thiès"
   - Commune : "Thiès Nord"
3. Testez la multi-sélection des zones :
   - Cliquez sur "Dakar" → devient vert
   - Cliquez sur "Thiès" → devient vert
   - Cliquez sur "Dakar" à nouveau → redevient gris (désélection)
4. Soumettez le formulaire

**Points de vérification** :
- ✅ Les chips changent de couleur au clic
- ✅ On peut sélectionner plusieurs zones
- ✅ On peut désélectionner une zone
- ✅ La sélection est vide par défaut
- ✅ Le formulaire se soumet même sans zones sélectionnées (optionnel)

---

### 4. Test du formulaire Prestataire

**Objectif** : Vérifier la validation stricte des services (requis).

**Étapes** :
1. Depuis l'écran de choix, cliquez sur "J'offre des services agricoles"
2. Remplissez nom et région uniquement
3. Tentez de soumettre sans sélectionner de services
4. **Résultat attendu** : Message d'erreur "Sélectionnez au moins un service"
5. Sélectionnez au moins 1 service
6. **Résultat attendu** : Erreur disparaît, soumission possible

**Points de vérification** :
- ✅ Validation stricte des services
- ✅ Message d'erreur clair et visible
- ✅ Erreur disparaît dès qu'un service est sélectionné

---

### 5. Test des composants isolés

#### Composant Picker

**Test manuel** :
```tsx
// Testez dans un écran isolé
<Picker
  label="Test Picker"
  placeholder="Sélectionner..."
  value={value}
  options={[
    { label: "Option 1", value: "opt1" },
    { label: "Option 2", value: "opt2" },
  ]}
  onValueChange={setValue}
  error="Erreur de test"
/>
```

**Vérifications** :
- ✅ Clic ouvre une modal
- ✅ Modal affiche toutes les options
- ✅ Sélection d'une option ferme la modal et met à jour la valeur
- ✅ Le bouton "✕" ferme la modal
- ✅ Clic en dehors de la modal la ferme
- ✅ L'option sélectionnée affiche un checkmark ✓
- ✅ Message d'erreur affiché sous le trigger

#### Composant ImagePickerField

**Test manuel** :
```tsx
<ImagePickerField
  label="Test Image"
  value={imageUri}
  onValueChange={setImageUri}
/>
```

**Vérifications** :
- ✅ Clic affiche une alerte avec 3 options (Prendre photo / Galerie / Annuler)
- ✅ "Prendre photo" demande permission caméra
- ✅ "Galerie" demande permission photos
- ✅ Image sélectionnée s'affiche en prévisualisation
- ✅ Bouton "Modifier" permet de changer l'image
- ✅ Bouton "✕" supprime l'image

---

### 6. Test de gestion d'erreur réseau

**Objectif** : Vérifier que l'app gère correctement les erreurs API.

**Simulation d'erreurs** :
1. **Serveur arrêté** : Stoppez le serveur Next.js et tentez de créer un profil
   - **Résultat attendu** : Message "Erreur réseau" ou "Erreur lors de la création du profil"
2. **Token expiré** : Supprimez le token dans SecureStore et tentez de créer un profil
   - **Résultat attendu** : Message "Non authentifié" ou redirection vers login
3. **Profil en double** : Créez un profil OWNER, puis tentez d'en créer un autre
   - **Résultat attendu** : Message "Vous avez déjà un profil de type OWNER"

**Code pour simuler** :
```javascript
// Supprimer le token
import * as SecureStore from 'expo-secure-store';
await SecureStore.deleteItemAsync('sunuagri_token');

// Vérifier l'AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear(); // Réinitialiser
```

---

### 7. Test d'accessibilité

**Objectif** : Vérifier que l'app est utilisable avec TalkBack/VoiceOver.

**Sur Android** :
1. Activez TalkBack : Paramètres > Accessibilité > TalkBack
2. Naviguez dans l'app avec le lecteur d'écran
3. Vérifiez que tous les éléments sont annoncés correctement

**Points de vérification** :
- ✅ Les boutons annoncent leur label et leur rôle
- ✅ Les champs de formulaire annoncent leur label
- ✅ Les erreurs sont annoncées comme "alert"
- ✅ Les checkboxes (chips) annoncent leur état (coché/décoché)

---

### 8. Test de performance

**Objectif** : Vérifier que l'app reste fluide.

**Outils** :
- Activez "Show Perf Monitor" dans le menu Expo Dev
- Surveillez les FPS pendant la navigation

**Points de vérification** :
- ✅ Pas de lag lors de l'ouverture des modals
- ✅ Multi-sélection des chips fluide
- ✅ Upload de photo ne bloque pas l'UI
- ✅ Pas de memory leak (vérifiez avec Flipper)

---

## Debugging

### Logs utiles

```javascript
// Dans vos composants
console.log('Form data:', { displayName, region, commune });
console.log('Errors:', errors);
console.log('Selected zones:', selectedZones);
```

### Inspecter AsyncStorage

```bash
# Via adb (Android)
adb shell run-as com.sunuagri.mobile
cd files
ls
cat RKStorage/sunuagri_token
```

### Inspecter les requêtes réseau

Utilisez React Native Debugger ou Flipper pour voir les requêtes API en temps réel.

---

## Checklist de test complète

### Fonctionnel
- [ ] Redirection automatique après inscription
- [ ] Validation des champs requis
- [ ] Validation spécifique par type de profil
- [ ] Multi-sélection des chips (zones, services, produits)
- [ ] Upload de photo (caméra + galerie)
- [ ] Soumission du formulaire
- [ ] Redirection vers dashboard après succès
- [ ] Option "Continuer sans profil"

### Navigation
- [ ] Bouton retour fonctionne
- [ ] Navigation entre les écrans d'onboarding
- [ ] Deep linking fonctionne (si implémenté)

### Gestion d'erreur
- [ ] Erreur réseau gérée
- [ ] Token invalide géré
- [ ] Profil en double géré
- [ ] Upload photo trop grande géré
- [ ] Validation Zod côté backend

### UX
- [ ] Animations fluides
- [ ] Feedback visuel au chargement
- [ ] Messages d'erreur clairs
- [ ] Pas de flash d'écran blanc
- [ ] Keyboard dismiss au submit

### Accessibilité
- [ ] Labels corrects
- [ ] Roles corrects
- [ ] Hints informatifs
- [ ] Support TalkBack/VoiceOver

---

## Commandes utiles

```bash
# Lancer l'app
cd mobile
npx expo start

# Réinitialiser le cache
npx expo start -c

# Build dev client
npx expo run:android

# Logs en temps réel
npx expo start --android
# Puis appuyez sur 'j' pour ouvrir les logs
```

---

## Bugs connus / Limitations

1. **Expo Go incompatible** : Utilisez `expo-dev-client` (déjà configuré)
2. **Upload photo sur émulateur** : Utilisez un appareil physique pour tester l'appareil photo
3. **AsyncStorage vs backend** : En cas de désynchronisation, effacez AsyncStorage et reconnectez-vous
4. **Picker Android** : Le composant Picker custom peut avoir un léger délai d'ouverture sur Android (normal)

---

## Support

En cas de problème :
1. Vérifiez les logs Metro bundler
2. Vérifiez les logs de l'appareil (Logcat pour Android)
3. Vérifiez que l'API backend est accessible depuis l'appareil
4. Testez avec `curl` depuis l'appareil :
   ```bash
   curl http://192.168.1.X:3000/api/auth/me
   ```
