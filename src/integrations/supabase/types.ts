export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          countries: string[] | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          cta_text_ar: string | null
          ends_at: string | null
          id: string
          image_position_x: number | null
          image_position_y: number | null
          image_url: string
          image_zoom: number | null
          is_active: boolean | null
          page_content: string | null
          page_content_ar: string | null
          page_slug: string | null
          page_title_ar: string | null
          sort_order: number | null
          starts_at: string | null
          subtitle: string | null
          subtitle_ar: string | null
          title: string
          title_ar: string
        }
        Insert: {
          countries?: string[] | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          cta_text_ar?: string | null
          ends_at?: string | null
          id?: string
          image_position_x?: number | null
          image_position_y?: number | null
          image_url: string
          image_zoom?: number | null
          is_active?: boolean | null
          page_content?: string | null
          page_content_ar?: string | null
          page_slug?: string | null
          page_title_ar?: string | null
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          subtitle_ar?: string | null
          title: string
          title_ar: string
        }
        Update: {
          countries?: string[] | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          cta_text_ar?: string | null
          ends_at?: string | null
          id?: string
          image_position_x?: number | null
          image_position_y?: number | null
          image_url?: string
          image_zoom?: number | null
          is_active?: boolean | null
          page_content?: string | null
          page_content_ar?: string | null
          page_slug?: string | null
          page_title_ar?: string | null
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          subtitle_ar?: string | null
          title?: string
          title_ar?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          countries: string[] | null
          created_at: string
          description: string | null
          hero_image: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          countries?: string[] | null
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          countries?: string[] | null
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          countries: string[] | null
          created_at: string
          description_ar: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_ar: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          countries?: string[] | null
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_ar: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          countries?: string[] | null
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_ar?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_value: number | null
          starts_at: string | null
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number | null
          starts_at?: string | null
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_value?: number | null
          starts_at?: string | null
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line1: string
          city: string
          created_at: string
          customer_id: string | null
          id: string
          is_default: boolean
          label: string
          notes: string | null
          phone: string
          recipient_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          city: string
          created_at?: string
          customer_id?: string | null
          id?: string
          is_default?: boolean
          label?: string
          notes?: string | null
          phone?: string
          recipient_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          city?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          is_default?: boolean
          label?: string
          notes?: string | null
          phone?: string
          recipient_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_carts: {
        Row: {
          abandoned_at: string | null
          cart_value: number
          converted_order_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          id: string
          item_count: number
          items: Json
          last_activity_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abandoned_at?: string | null
          cart_value?: number
          converted_order_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          item_count?: number
          items?: Json
          last_activity_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abandoned_at?: string | null
          cart_value?: number
          converted_order_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          item_count?: number
          items?: Json
          last_activity_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_carts_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favorites: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_favorites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          id: string
          last_logout_at: string | null
          last_seen_at: string | null
          name: string
          phone: string
          region: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          id?: string
          last_logout_at?: string | null
          last_seen_at?: string | null
          name: string
          phone: string
          region?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          id?: string
          last_logout_at?: string | null
          last_seen_at?: string | null
          name?: string
          phone?: string
          region?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      delivery_companies: {
        Row: {
          base_fee: number
          country: string
          created_at: string
          delivery_days: string | null
          id: string
          is_active: boolean | null
          name: string
          service_scope: string | null
        }
        Insert: {
          base_fee?: number
          country?: string
          created_at?: string
          delivery_days?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          service_scope?: string | null
        }
        Update: {
          base_fee?: number
          country?: string
          created_at?: string
          delivery_days?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          service_scope?: string | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          section_key: string
          sort_order: number
          title: string | null
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_key: string
          sort_order?: number
          title?: string | null
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_key?: string
          sort_order?: number
          title?: string | null
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_skus: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          price: number | null
          product_id: string
          quality: string | null
          size: string | null
          sku: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number | null
          product_id: string
          quality?: string | null
          size?: string | null
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number | null
          product_id?: string
          quality?: string | null
          size?: string | null
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_skus_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          category_ids: string[] | null
          created_at: string
          description: string | null
          discount_type: string | null
          discount_value: number | null
          ends_at: string | null
          id: string
          is_active: boolean
          product_ids: string[] | null
          starts_at: string | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          category_ids?: string[] | null
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          product_ids?: string[] | null
          starts_at?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          category_ids?: string[] | null
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          product_ids?: string[] | null
          starts_at?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_company_id: string | null
          delivery_fee: number
          discount_amount: number
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_status: string
          sales_agent_id: string | null
          source: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_company_id?: string | null
          delivery_fee?: number
          discount_amount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_status?: string
          sales_agent_id?: string | null
          source?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_company_id?: string | null
          delivery_fee?: number
          discount_amount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_status?: string
          sales_agent_id?: string | null
          source?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_company_id_fkey"
            columns: ["delivery_company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          code: string
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_costs: {
        Row: {
          cost_price: number
          product_id: string
          updated_at: string
        }
        Insert: {
          cost_price?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          cost_price?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          body: string | null
          created_at: string
          customer_id: string | null
          id: string
          product_id: string
          rating: number
          status: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id: string
          rating: number
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string
          rating?: number
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          accessories: Json | null
          audience: string | null
          brand: string | null
          brand_id: string | null
          category: string | null
          category_id: string | null
          color_variants: Json
          cost_price: number | null
          countries: string[] | null
          created_at: string
          description: string | null
          description_ar: string | null
          discount: number | null
          features: Json | null
          has_quality_variants: boolean
          has_sizes: boolean | null
          home_collections: string[]
          id: string
          images: string[] | null
          in_stock: boolean | null
          is_active: boolean | null
          is_best_seller: boolean | null
          is_featured: boolean | null
          name: string
          name_ar: string
          original_price: number | null
          price: number | null
          quality_variants: Json
          return_policy: string | null
          section_ids: string[] | null
          size_price_rule_id: string | null
          sizes: string[] | null
          slug: string
          sort_order: number | null
          specs: Json
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          accessories?: Json | null
          audience?: string | null
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          color_variants?: Json
          cost_price?: number | null
          countries?: string[] | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          discount?: number | null
          features?: Json | null
          has_quality_variants?: boolean
          has_sizes?: boolean | null
          home_collections?: string[]
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          name: string
          name_ar: string
          original_price?: number | null
          price?: number | null
          quality_variants?: Json
          return_policy?: string | null
          section_ids?: string[] | null
          size_price_rule_id?: string | null
          sizes?: string[] | null
          slug: string
          sort_order?: number | null
          specs?: Json
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          accessories?: Json | null
          audience?: string | null
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          color_variants?: Json
          cost_price?: number | null
          countries?: string[] | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          discount?: number | null
          features?: Json | null
          has_quality_variants?: boolean
          has_sizes?: boolean | null
          home_collections?: string[]
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          name?: string
          name_ar?: string
          original_price?: number | null
          price?: number | null
          quality_variants?: Json
          return_policy?: string | null
          section_ids?: string[] | null
          size_price_rule_id?: string | null
          sizes?: string[] | null
          slug?: string
          sort_order?: number | null
          specs?: Json
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_size_price_rule_id_fkey"
            columns: ["size_price_rule_id"]
            isOneToOne: false
            referencedRelation: "size_price_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_agents: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_default_website: boolean
          name: string
          platform: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default_website?: boolean
          name: string
          platform?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default_website?: boolean
          name?: string
          platform?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: string | null
          content_ar: string | null
          key: string
          metadata: Json
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_ar?: string | null
          key: string
          metadata?: Json
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_ar?: string | null
          key?: string
          metadata?: Json
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      size_price_rules: {
        Row: {
          adjustments: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          adjustments?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          adjustments?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
