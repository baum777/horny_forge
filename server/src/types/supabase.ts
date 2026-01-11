// Minimal Supabase Database type definitions for type-safe queries
export interface Database {
  public: {
    Tables: {
      artifacts: {
        Row: {
          id: string;
          caption: string | null;
          author_handle: string | null;
          image_url: string;
          [key: string]: unknown;
        };
        Insert: {
          id: string;
          caption?: string | null;
          author_handle?: string | null;
          image_url: string;
          [key: string]: unknown;
        };
        Update: {
          id?: string;
          caption?: string | null;
          author_handle?: string | null;
          image_url?: string;
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
          p_subject_id: string;
          p_source: string;
        };
        Returns: unknown;
      };
    };
  };
}

