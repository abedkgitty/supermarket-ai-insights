import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are MercatoMind's AI assistant, specialized in supermarket analytics. You have access to the following database schema:

TABLES:
1. products (id, name, sku, cost_price, selling_price, stock_quantity, min_stock_level, category_id, aisle_id, supplier, shelf_position, created_at, updated_at)
2. sales (id, product_id, quantity, total_amount, sale_date, created_at)
3. categories (id, name, icon, color, created_at)
4. aisles (id, name, aisle_number, position_x, position_y, width, height, created_at)
5. financial_summary (id, month, total_sales, total_costs, total_profit, total_items_sold, created_at)
6. ai_predictions (id, product_id, prediction_month, predicted_revenue, predicted_demand, confidence_score, created_at)

RULES:
1. ONLY answer questions related to supermarket data, products, sales, inventory, categories, aisles, and analytics.
2. If asked something unrelated (politics, weather, general knowledge, etc.), politely decline and redirect to supermarket topics.
3. When a question requires data, generate a safe SELECT SQL query. Never generate INSERT, UPDATE, DELETE, DROP, or any modifying statements.
4. Always wrap SQL in a JSON response format.

RESPONSE FORMAT:
For data queries, respond with JSON:
{
  "type": "query",
  "sql": "SELECT ... FROM ...",
  "explanation": "Brief explanation of what this query does"
}

For summaries or explanations (no query needed):
{
  "type": "summary",
  "response": "Your detailed response here"
}

For out-of-scope questions:
{
  "type": "declined",
  "response": "I'm MercatoMind's assistant, focused on supermarket analytics. I can help you with product information, sales data, inventory levels, and business insights. What would you like to know about your store?"
}`;

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

    // Build messages array with history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
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
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, aiContent];
      parsedResponse = JSON.parse(jsonMatch[1] || aiContent);
    } catch {
      // If parsing fails, treat as summary
      parsedResponse = { type: "summary", response: aiContent };
    }

    // If it's a query, execute it
    if (parsedResponse.type === "query" && parsedResponse.sql) {
      // Security check - only allow SELECT
      const sqlLower = parsedResponse.sql.toLowerCase().trim();
      if (!sqlLower.startsWith("select")) {
        return new Response(
          JSON.stringify({
            type: "error",
            response: "For security reasons, only SELECT queries are allowed.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Execute the query
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      
      // Use raw SQL via rpc or direct query
      const { data, error } = await supabase.rpc('execute_readonly_query', { 
        query_text: parsedResponse.sql 
      }).maybeSingle();

      if (error) {
        // Fallback: try to parse and execute via the client
        // For now, return the SQL for display
        return new Response(
          JSON.stringify({
            type: "query",
            sql: parsedResponse.sql,
            explanation: parsedResponse.explanation,
            results: null,
            error: "Query execution not available. SQL shown for reference.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          type: "query",
          sql: parsedResponse.sql,
          explanation: parsedResponse.explanation,
          results: data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return summary or declined response
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
