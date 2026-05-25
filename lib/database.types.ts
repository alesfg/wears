export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string | null;
          category: string | null;
          price: number;
          purchased_at: string;
          image_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand?: string | null;
          category?: string | null;
          price: number;
          purchased_at: string;
          image_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["items"]["Insert"]>;
        Relationships: [];
      };
      wears: {
        Row: {
          id: string;
          item_id: string;
          user_id: string;
          worn_at: string;
          occasion: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          user_id: string;
          worn_at?: string;
          occasion?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wears"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Item = Database["public"]["Tables"]["items"]["Row"];
export type Wear = Database["public"]["Tables"]["wears"]["Row"];
export type ItemInsert = Database["public"]["Tables"]["items"]["Insert"];
export type WearInsert = Database["public"]["Tables"]["wears"]["Insert"];

export interface ItemWithWears extends Item {
  wears: Wear[];
  cpw: number;
}
