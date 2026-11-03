export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          is_shared: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          is_shared?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          is_shared?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: "todo" | "in_progress" | "done";
          priority: "low" | "medium" | "high";
          due_date: string | null;
          assignee_id: string | null;
          labels: string[];
          position: number;
          sprint_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          assignee_id?: string | null;
          labels?: string[];
          position?: number;
          sprint_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          assignee_id?: string | null;
          labels?: string[];
          position?: number;
          sprint_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey";
            columns: ["sprint_id"];
            isOneToOne: false;
            referencedRelation: "sprints";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: "viewer" | "editor" | "admin" | "reporter";
          invited_by: string | null;
          invited_at: string | null;
          joined_at: string | null;
          user_email: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: "viewer" | "editor" | "admin" | "reporter";
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string | null;
          user_email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: "viewer" | "editor" | "admin" | "reporter";
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string | null;
          user_email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          project_id: string;
          email: string;
          role: "viewer" | "editor" | "admin" | "reporter";
          invited_by: string;
          token: string;
          accepted_at: string | null;
          expires_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          email: string;
          role?: "viewer" | "editor" | "admin" | "reporter";
          invited_by: string;
          token: string;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          email?: string;
          role?: "viewer" | "editor" | "admin" | "reporter";
          invited_by?: string;
          token?: string;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      sprints: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          starts_on: string | null;
          ends_on: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          starts_on?: string | null;
          ends_on?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          starts_on?: string | null;
          ends_on?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          author_id?: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      task_activity: {
        Row: {
          id: string;
          task_id: string;
          actor_id: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          actor_id?: string | null;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          actor_id?: string | null;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_invitation: {
        Args: { p_token: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
