export type Role = 'mj' | 'joueur';

export interface UserProfile {
  id: string;
  displayName: string;
  role: Role;
}
