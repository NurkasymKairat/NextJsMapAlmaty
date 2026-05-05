export type PublicUser = {
  id: string;
  username: string;
  color: string;
};

export type Memory = {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  association: string;
  order_index: number;
  created_at: string;
  username: string;
  color: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

export type Comment = {
  id: string;
  memory_id: string;
  user_id: string;
  text: string;
  created_at: string;
  username: string;
  color: string;
};
