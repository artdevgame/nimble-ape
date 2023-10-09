import { User as UserObjectRef } from "../graphql/types";

type User = typeof UserObjectRef.$inferType;

export type AuthenticatedUser = { id: string; name: string } | null;

export class UserService {
  constructor(
    private db: D1Database,
    private authenticatedUser: AuthenticatedUser
  ) {}

  isAuthenticated() {
    return Boolean(this.authenticatedUser);
  }

  getAuthenticatedUser() {
    if (!this.authenticatedUser) return null;
    return this.getUserWithId(this.authenticatedUser.id);
  }

  getUserWithId(id: string) {
    return this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(id)
      .first<User>();
  }

  async upsertUser(user: Partial<Omit<User, "id">> = {}) {
    if (!this.authenticatedUser) return null;

    const authenticatedUser = await this.getAuthenticatedUser();
    const name =
      user.name || authenticatedUser?.name || this.authenticatedUser.name;

    await this.db
      .prepare("REPLACE INTO users (id, name) VALUES (?, ?)")
      .bind(this.authenticatedUser.id, name)
      .run();
    return (await this.getAuthenticatedUser()) as User;
  }
}
