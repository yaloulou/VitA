import { UserRole } from '../users/schemas/user.schema';

export type AuthenticatedUser = {
  id: string;
  phone: string;
  role: UserRole;
};
