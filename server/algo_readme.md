### 1. Les Données Universelles (Enums)

Ce sont les listes figées dans le code Java. Elles sont valables pour n'importe quel être humain ou n'importe quel sport.

* **`Intensity` (Intensité de l'effort) :** Valeurs : `FAIBLE`, `MOYENNE`, `ELEVEE`.
* **`Constraint` (Contraintes physiques / Blessures à éviter) :** Valeurs : `GENOUX`, `CHEVILLES`, `DOS`, `EPAULES`, `AUCUNE`.

---

### 2. Les Référentiels Métier (`@Entity`)

Ce sont de vraies tables en base de données. L'administrateur de LevelUP pourra en rajouter à l'infini. Chaque élément est relié à un sport précis.

* **`Sport`** : `Long id`, `String nom`.
* **`Role` (Poste / Type de joueur) :** `Long id`, `String nom`, `@ManyToOne Sport sport`.
* **`Equipment` (Matériel) :** `Long id`, `String nom`, `@ManyToOne Sport sport`.
* **`Goal` (Objectif) :** `Long id`, `String nom`, `@ManyToOne Sport sport`.

---

### 3. Les Entités Centrales (`@Entity`)

C'est le cœur de l'application : l'Utilisateur et le Catalogue d'exercices.

**`User` (Le Profil Utilisateur)**

* `Long id`, `String email`, `String password`
* `@ManyToOne Sport sportChoisi`
* `@ManyToOne Role poste`
* `@ManyToMany List<Equipment> materielPossede`
* `@ElementCollection List<Constraint> blessures`

**`Exercise` (L'Exercice issu du CSV)**

* `Long id`, `String nom`, `String descriptionDetaillee`
* `int dureeMin`, `float series`, `String repTemps`
* `@ManyToOne Sport sport`
* `@ManyToMany List<Role> typesDeJoueur`
* `@ManyToMany List<Equipment> materielNecessaire`
* `@ManyToMany List<Goal> objectifs`
* `@Enumerated(EnumType.STRING) Intensity intensite`
* `@ElementCollection List<Constraint> contraintesPhysiques`

---

### 4. Le Résultat de l'Algorithme (`@Entity`)

C'est ce qui est sauvegardé et renvoyé au front-end React.

**`Program` (Le Plan Global)**

* `Long id`, `LocalDate dateCreation`, `@ManyToOne User user`
* `@OneToMany List<Session> sessions`

**`Session` (La Séance d'un jour précis)**

* `Long id`, `int jourNumero`, `@ManyToOne Program program`
* `@ManyToMany List<Exercise> exercices`

---

### 5. L'Algorithme de Matching (Comment choisir les meilleurs exos)

C'est la logique métier (le `@Service` dans Spring Boot) qui relie l'`User` aux `Exercise` pour créer la `Session`. Il fonctionne en 3 étapes :

**A. Les 3 Règles de Filtre (Éliminatoire)**
On part de toute la base de données, et on élimine impitoyablement ce qui est impossible ou dangereux :

1. **Filtre du Sport :** L'exercice DOIT appartenir au `sportChoisi` par l'utilisateur.
2. **Filtre du Matériel :** La liste `materielPossede` de l'utilisateur DOIT contenir TOUS les éléments de la liste `materielNecessaire` de l'exercice. (S'il manque un plot, on jette l'exo).
3. **Filtre de Sécurité :** La liste `contraintesPhysiques` de l'exercice ne DOIT PAS avoir de point commun avec la liste `blessures` de l'utilisateur.

**B. La Pondération (Le calcul du score)**
Sur les exercices restants (qui sont 100% réalisables et sûrs), on attribue des points pour trouver les plus pertinents :

* **+10 points (Le Rôle/Poste) :** Si la liste `typesDeJoueur` de l'exercice contient le `poste` exact de l'utilisateur, c'est le jackpot. Ça garantit que l'exo correspond à sa réalité sur le terrain.
* **+5 points (L'Objectif) :** Si l'exercice travaille un `objectifPrincipal` que l'utilisateur a coché vouloir améliorer dans le formulaire.
* **+2 points (Feedback) :** (Pour la V2) Si l'utilisateur a déjà bien noté ce style d'exercice dans le passé.

**C. Le Résultat (Création de la séance)**

1. L'algorithme trie la liste des exercices filtrés par ordre de score décroissant (les plus hauts scores en premier).
2. Il "coupe" la liste pour ne garder que les **5 à 7 premiers exercices** (selon la durée souhaitée).
3. Il insère ces exercices dans une nouvelle entité `Session`, la rattache au `Program` de l'utilisateur, et sauvegarde le tout en base de données.
