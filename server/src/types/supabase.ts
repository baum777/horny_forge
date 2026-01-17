// Minimal Supabase Database type definitions for type-safe queries
export interface Database {
  public: {
    Tables: {
      artifacts: {
        Row: {
          id: string;
          caption: string | null;
          author_handle: string | null;
          author_id: string;
          author_avatar: string | null;
          image_url: string;
          tags: string[];
          avg_rating: number | null;
          rating_count: number | null;
          report_count: number | null;
          hidden: boolean | null;
          brand_similarity: number | null;
          base_match_id: string | null;
          safety_checked_at: string | null;
          [key: string]: unknown;
        };
        Insert: {
          id: string;
          caption?: string | null;
          author_handle?: string | null;
          author_id: string;
          author_avatar?: string | null;
          image_url: string;
          tags: string[];
          avg_rating?: number | null;
          rating_count?: number | null;
          report_count?: number | null;
          hidden?: boolean | null;
          brand_similarity?: number | null;
          base_match_id?: string | null;
          safety_checked_at?: string | null;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          caption?: string | null;
          author_handle?: string | null;
          author_id?: string;
          author_avatar?: string | null;
          image_url?: string;
          tags?: string[];
          avg_rating?: number | null;
          rating_count?: number | null;
          report_count?: number | null;
          hidden?: boolean | null;
          brand_similarity?: number | null;
          base_match_id?: string | null;
          safety_checked_at?: string | null;
          [key: string]: unknown;
        };
      };
      user_stats: {
        Row: {
          user_id: string;
          level: number | null;
          xp_total: number | null;
          streak_days: number | null;
          last_active_at: string | null;
          [key: string]: unknown;
        };
        Insert: {
          user_id: string;
          level?: number | null;
          xp_total?: number | null;
          streak_days?: number | null;
          last_active_at?: string | null;
          [key: string]: unknown;
        };
        Update: {
          user_id?: string;
          level?: number | null;
          xp_total?: number | null;
          streak_days?: number | null;
          last_active_at?: string | null;
          [key: string]: unknown;
        };
      };
      forge_previews: {
        Row: {
          generation_id: string;
          user_id: string;
          base_id: string;
          preset: string;
          brand_similarity: number | null;
          base_match_id: string | null;
          safety_checked_at: string | null;
          [key: string]: unknown;
        };
        Insert: {
          generation_id: string;
          user_id: string;
          base_id: string;
          preset: string;
          brand_similarity?: number | null;
          base_match_id?: string | null;
          safety_checked_at?: string | null;
          [key: string]: unknown;
        };
        Update: {
          generation_id?: string;
          user_id?: string;
          base_id?: string;
          preset?: string;
          brand_similarity?: number | null;
          base_match_id?: string | null;
          safety_checked_at?: string | null;
          [key: string]: unknown;
        };
      };
      votes: {
        Row: {
          id: string;
          artifact_id: string;
          user_id: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          artifact_id: string;
          user_id: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          artifact_id?: string;
          user_id?: string;
          [key: string]: unknown;
        };
      };
      meme_ratings: {
        Row: {
          id: string;
          artifact_id: string;
          user_id: string;
          rating: number;
          created_at: string;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: {
          id?: string;
          artifact_id: string;
          user_id: string;
          rating: number;
          created_at?: string;
          updated_at?: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          artifact_id?: string;
          user_id?: string;
          rating?: number;
          created_at?: string;
          updated_at?: string;
          [key: string]: unknown;
        };
      };
    };
    Functions: {
      award_event: {
        Args: {
          p_event_id: string;
          p_actor_user_id: string;
          p_event_type: string;
          p_subject_id: string | null;
          p_source: string | null;
        };
        Returns: unknown;
      };
      check_and_consume_quota: {
        Args: {
          p_user_id: string;
          p_key: string;
          p_limit: number;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
        } | null;
      };
    };
  };
}

