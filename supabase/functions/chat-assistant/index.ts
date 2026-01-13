import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are MercatoMind's AI assistant for supermarket analytics.

DATABASE SCHEMA (ONLY these 6 tables exist - do NOT reference any other tables):

1. products
   - id (uuid, primary key)
   - name (text)
   - sku (text)
   - cost_price (numeric)
   - selling_price (numeric)
   - stock_quantity (integer)
   - min_stock_level (integer)
   - category_id (uuid, foreign key to categories.id)
   - aisle_id (uuid, foreign key to aisles.id)
   - supplier (text)
   - shelf_position (integer)
   - created_at, updated_at (timestamp)

2. sales
   - id (uuid, primary key)
   - product_id (uuid, foreign key to products.id)
   - quantity (integer)
   - total_amount (numeric)
   - sale_date (date)
   - created_at (timestamp)

3. categories
   - id (uuid, primary key)
   - name (text)
   - icon (text)
   - color (text)
   - created_at (timestamp)

4. aisles
   - id (uuid, primary key)
   - name (text)
   - aisle_number (integer)
   - position_x, position_y, width, height (integer)
   - created_at (timestamp)

5. financial_summary
   - id (uuid, primary key)
   - month (date)
   - total_sales (numeric)
   - total_costs (numeric)
   - total_profit (numeric)
   - total_items_sold (integer)
   - created_at (timestamp)

6. ai_predictions
   - id (uuid, primary key)
   - product_id (uuid, foreign key to products.id)
   - prediction_month (date)
   - predicted_revenue (numeric)
   - predicted_demand (integer)
   - confidence_score (numeric)
   - created_at (timestamp)

CRITICAL RULES:
1. ONLY use the 6 tables listed above. Tables like "users", "customers", "orders", "inventory" DO NOT EXIST.
2. ONLY answer questions about: products, sales, inventory, categories, aisles, financial data, predictions.
3. For unrelated questions (politics, weather, general knowledge), decline politely.
4. Generate ONLY SELECT queries. Never INSERT, UPDATE, DELETE, DROP.
5. Use proper JOINs: products.category_id = categories.id, products.aisle_id = aisles.id, sales.product_id = products.id
6. Always add LIMIT (max 50) to prevent large result sets.

EXAMPLE VALID QUERIES:
- Products with low stock: SELECT name, stock_quantity, min_stock_level FROM products WHERE stock_quantity < min_stock_level LIMIT 20
- Total sales per product: SELECT p.name, SUM(s.quantity) as qty_sold, SUM(s.total_amount) as revenue FROM sales s JOIN products p ON s.product_id = p.id GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 20
- Products in category: SELECT p.name, p.selling_price, c.name as category FROM products p JOIN categories c ON p.category_id = c.id LIMIT 20
- Recent sales: SELECT s.sale_date, s.quantity, s.total_amount, p.name FROM sales s JOIN products p ON s.product_id = p.id ORDER BY s.sale_date DESC LIMIT 20
- Monthly financials: SELECT month, total_sales, total_costs, total_profit FROM financial_summary ORDER BY month DESC LIMIT 12

IMPORTANT COLUMN NOTES:
- sales table has: quantity (units sold), total_amount (money earned) - NOT "total_sold"
- products table has: stock_quantity (current stock), selling_price, cost_price - NOT "price"
- Use SUM(s.quantity) for total units sold, SUM(s.total_amount) for total revenue

RESPONSE FORMAT (always valid JSON):
For queries: {"type": "query", "sql": "SELECT ...", "explanation": "Brief explanation"}
For summaries: {"type": "summary", "response": "Your response"}
For off-topic: {"type": "declined", "response": "I can only help with store data like products, sales, and inventory. What would you like to know?"}`;

async function executeQuery(supabase: any, sql: string): Promise<{ data: any; error: string | null }> {
  // Parse the SQL to determine which table and what to select
  const sqlLower = sql.toLowerCase().trim();
  
  // Security: only allow SELECT
  if (!sqlLower.startsWith("select")) {
    return { data: null, error: "Only SELECT queries are allowed" };
  }

  try {
    // Use Postgres function to run read-only query
    const { data, error } = await supabase.rpc('run_readonly_query', { sql_query: sql });
    
    if (error) {
      // Fallback: try direct table queries for simple cases
      return await executeSimpleQuery(supabase, sql);
    }
    
    return { data, error: null };
  } catch (e) {
    return await executeSimpleQuery(supabase, sql);
  }
}

async function executeSimpleQuery(supabase: any, sql: string): Promise<{ data: any; error: string | null }> {
  const sqlLower = sql.toLowerCase();
  
  try {
    // Extract table name
    const fromMatch = sqlLower.match(/from\s+(\w+)/);
    if (!fromMatch) {
      return { data: null, error: "Could not parse table name" };
    }
    
    const tableName = fromMatch[1];
    const allowedTables = ['products', 'sales', 'categories', 'aisles', 'financial_summary', 'ai_predictions'];
    
    if (!allowedTables.includes(tableName)) {
      return { data: null, error: "Table not allowed" };
    }

    // Build query
    let query = supabase.from(tableName).select('*');
    
    // Check for LIMIT
    const limitMatch = sqlLower.match(/limit\s+(\d+)/);
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    } else {
      query = query.limit(20); // Default limit
    }

    // Check for ORDER BY
    const orderMatch = sql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
    if (orderMatch) {
      const column = orderMatch[1];
      const ascending = orderMatch[2]?.toLowerCase() !== 'desc';
      query = query.order(column, { ascending });
    }

    const { data, error } = await query;
    
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Query execution failed" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Build messages array with history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10),
      { role: "user", content: message },
    ];

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let parsedResponse;
    try {
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, aiContent];
      parsedResponse = JSON.parse(jsonMatch[1] || aiContent);
    } catch {
      parsedResponse = { type: "summary", response: aiContent };
    }

    // If it's a query, execute it
    if (parsedResponse.type === "query" && parsedResponse.sql) {
      const { data, error } = await executeQuery(supabase, parsedResponse.sql);
      
      return new Response(
        JSON.stringify({
          type: "query",
          sql: parsedResponse.sql,
          explanation: parsedResponse.explanation,
          results: data,
          resultsError: error,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
