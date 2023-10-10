export interface User {
  id: string;
  name: string;
}

export interface Meeting {
  id: string;
  users: User[];
}
