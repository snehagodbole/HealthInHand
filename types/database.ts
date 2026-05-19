export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type FastingSession =
  Database["public"]["Tables"]["fasting_sessions"]["Row"];
export type SharedFast = Database["public"]["Tables"]["shared_fasts"]["Row"];
export type SharedFastParticipant =
  Database["public"]["Tables"]["shared_fast_participants"]["Row"];
export type SharedFastInvite =
  Database["public"]["Tables"]["shared_fast_invites"]["Row"];
export type WeightMeasurement =
  Database["public"]["Tables"]["weight_measurements"]["Row"];

export type FastingPlan = {
  label: string;
  fastingHours: number;
  eatingHours: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          fasting_plan: string | null;
          fasting_hours_goal: number | null;
          eating_hours_goal: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          fasting_plan?: string | null;
          fasting_hours_goal?: number | null;
          eating_hours_goal?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          fasting_plan?: string | null;
          fasting_hours_goal?: number | null;
          eating_hours_goal?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      fasting_sessions: {
        Row: {
          id: string;
          user_id: string;
          shared_fast_id: string | null;
          start_time: string;
          end_time: string | null;
          duration_minutes: number | null;
          status: "active" | "completed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shared_fast_id?: string | null;
          start_time?: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          status?: "active" | "completed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shared_fast_id?: string | null;
          start_time?: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          status?: "active" | "completed";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fasting_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      shared_fasts: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          start_time: string;
          fasting_hours_goal: number;
          status: "planned" | "active" | "completed" | "canceled";
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title?: string;
          start_time: string;
          fasting_hours_goal?: number;
          status?: "planned" | "active" | "completed" | "canceled";
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          start_time?: string;
          fasting_hours_goal?: number;
          status?: "planned" | "active" | "completed" | "canceled";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shared_fasts_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      shared_fast_participants: {
        Row: {
          id: string;
          shared_fast_id: string;
          user_id: string | null;
          role: "owner" | "member";
          status: "joined" | "left";
          joined_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shared_fast_id: string;
          user_id?: string | null;
          role?: "owner" | "member";
          status?: "joined" | "left";
          joined_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shared_fast_id?: string;
          user_id?: string | null;
          role?: "owner" | "member";
          status?: "joined" | "left";
          joined_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shared_fast_participants_shared_fast_id_fkey";
            columns: ["shared_fast_id"];
            isOneToOne: false;
            referencedRelation: "shared_fasts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_fast_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      shared_fast_invites: {
        Row: {
          id: string;
          shared_fast_id: string;
          invited_email: string | null;
          token: string;
          created_by: string;
          accepted_by: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shared_fast_id: string;
          invited_email?: string | null;
          token?: string;
          created_by: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shared_fast_id?: string;
          invited_email?: string | null;
          token?: string;
          created_by?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shared_fast_invites_shared_fast_id_fkey";
            columns: ["shared_fast_id"];
            isOneToOne: false;
            referencedRelation: "shared_fasts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_fast_invites_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_fast_invites_accepted_by_fkey";
            columns: ["accepted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      weight_measurements: {
        Row: {
          id: string;
          user_id: string;
          weight: number;
          unit: "lb" | "kg";
          measured_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight: number;
          unit?: "lb" | "kg";
          measured_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weight?: number;
          unit?: "lb" | "kg";
          measured_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "weight_measurements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_shared_fast_invite: {
        Args: {
          invite_token: string;
        };
        Returns: string;
      };
      create_shared_fast: {
        Args: {
          fast_title: string;
          fast_start_time: string;
          fast_fasting_hours_goal: number;
          invite_emails?: string[];
        };
        Returns: string;
      };
      get_shared_fast_invite: {
        Args: {
          invite_token: string;
        };
        Returns: {
          shared_fast_id: string;
          title: string;
          start_time: string;
          fasting_hours_goal: number;
          host_email: string | null;
          invited_email: string | null;
          accepted_at: string | null;
        }[];
      };
      is_shared_fast_member: {
        Args: {
          fast_id: string;
          member_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
