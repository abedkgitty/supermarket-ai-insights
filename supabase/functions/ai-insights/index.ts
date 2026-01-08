import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch real data from database
    const [productsRes, salesRes, financialsRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("*").order("selling_price", { ascending: false }).limit(20),
      supabase.from("sales").select("*, products(name, category_id, selling_price, cost_price)").order("sale_date", { ascending: false }).limit(100),
      supabase.from("financial_summary").select("*").order("month", { ascending: false }).limit(6),
      supabase.from("categories").select("*"),
    ]);

    const products = productsRes.data || [];
    const sales = salesRes.data || [];
    const financials = financialsRes.data || [];
    const categories = categoriesRes.data || [];

    // Calculate key metrics
    const totalRevenue = financials.reduce((sum, f) => sum + Number(f.total_sales), 0);
    const totalCosts = financials.reduce((sum, f) => sum + Number(f.total_costs), 0);
    const totalProfit = financials.reduce((sum, f) => sum + Number(f.profit), 0);
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Calculate category performance
    const categoryPerformance = categories.map(cat => {
      const catSales = sales.filter(s => s.products?.category_id === cat.id);
      const revenue = catSales.reduce((sum, s) => sum + (s.quantity * Number(s.products?.selling_price || 0)), 0);
      return { name: cat.name, revenue, salesCount: catSales.length };
    }).sort((a, b) => b.revenue - a.revenue);

    // Find low stock products
    const lowStockProducts = products.filter(p => p.quantity_in_stock < 20).slice(0, 5);

    // Find high margin products
    const highMarginProducts = products
      .map(p => ({
        name: p.name,
        margin: ((Number(p.selling_price) - Number(p.cost_price)) / Number(p.selling_price) * 100).toFixed(1)
      }))
      .sort((a, b) => Number(b.margin) - Number(a.margin))
      .slice(0, 5);

    const dataContext = `
You are an AI business analyst for a supermarket. Analyze this data and provide actionable insights.

FINANCIAL SUMMARY (Last 6 months):
- Total Revenue: $${totalRevenue.toLocaleString()}
- Total Costs: $${totalCosts.toLocaleString()}
- Total Profit: $${totalProfit.toLocaleString()}
- Profit Margin: ${profitMargin}%

TOP PERFORMING CATEGORIES:
${categoryPerformance.slice(0, 5).map((c, i) => `${i + 1}. ${c.name}: $${c.revenue.toLocaleString()} (${c.salesCount} sales)`).join('\n')}

LOW STOCK ALERTS:
${lowStockProducts.map(p => `- ${p.name}: Only ${p.quantity_in_stock} units left`).join('\n') || 'No low stock items'}

HIGH MARGIN PRODUCTS:
${highMarginProducts.map(p => `- ${p.name}: ${p.margin}% margin`).join('\n')}

RECENT SALES TRENDS:
- Total recent transactions: ${sales.length}
- Average items per sale: ${(sales.reduce((sum, s) => sum + s.quantity, 0) / Math.max(sales.length, 1)).toFixed(1)}

Provide 4-5 specific, actionable business insights based on this data. Format as JSON array with objects containing "title", "description", "type" (one of: revenue, inventory, growth, warning), and "priority" (high, medium, low).
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a business intelligence AI. Always respond with valid JSON only, no markdown formatting." },
          { role: "user", content: dataContext },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "[]";
    
    // Parse the AI response - handle potential markdown code blocks
    let insights;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(cleanedContent);
    } catch {
      console.error("Failed to parse AI response:", content);
      insights = [
        {
          title: "Revenue Analysis",
          description: `Your profit margin is ${profitMargin}%. Consider optimizing high-margin products.`,
          type: "revenue",
          priority: "high"
        },
        {
          title: "Inventory Alert",
          description: `${lowStockProducts.length} products are running low on stock.`,
          type: "inventory",
          priority: lowStockProducts.length > 0 ? "high" : "low"
        }
      ];
    }

    return new Response(JSON.stringify({ 
      insights,
      metrics: {
        totalRevenue,
        totalCosts,
        totalProfit,
        profitMargin,
        topCategories: categoryPerformance.slice(0, 3),
        lowStockCount: lowStockProducts.length
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
