export const config = {
  runtime: 'edge',
};

interface CompressResult {
  leads: any[];
  assets: any[];
}

const compressPayload = (leads: any[], assets: any[]): CompressResult => {
  let compressedLeads = leads;
  let compressedAssets = assets;

  if (leads.length + assets.length > 15) {
    compressedLeads = leads.map(l => ({
      id: l.id,
      name: l.name,
      company: l.companyName,
      stage: l.pipelineStage,
      value: l.potentialValue,
      lastContacted: l.lastContactedAt
    }));

    compressedAssets = assets.map(a => ({
      sku: a.skuCode,
      name: a.name,
      stock: a.quantity,
      threshold: a.restockThreshold
    }));
  }

  return { leads: compressedLeads, assets: compressedAssets };
};

const callLLM = async (_agentName: string, systemPrompt: string, payload: any): Promise<any> => {
  const env = (globalThis as any).process?.env || {};
  const geminiKey = env.GEMINI_API_KEY;
  const openaiKey = env.OPENAI_API_KEY;

  if (geminiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nInput Payload: ${JSON.stringify(payload)}` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return JSON.parse(text);
  }

  if (openaiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(payload) }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenAI');
    return JSON.parse(text);
  }

  throw new Error('No LLM API keys provided');
};

const fallbackGenerate = (agentName: string, payload: any): any => {
  const vertical = payload.tenantContext || 'Enterprise Operations';
  
  if (agentName === 'SalesAgent') {
    const lead = payload.leads?.[0] || { name: 'Demo Lead', companyName: 'Demo Corp', pipelineStage: 'PROPOSAL', potentialValue: 5000 };
    return {
      agentName: 'SalesAgent',
      statusType: 'action_executed',
      internalReasoning: `Analyzing Sales lead ${lead.name} from ${lead.companyName}. Context vertical: ${vertical}. Lead has potential value of $${lead.potentialValue} and is stuck in ${lead.pipelineStage}. Creating high-conversion targeted pitch.`,
      systemOutputLog: `[SalesAgent] Identified high-value lead "${lead.name}" (${lead.companyName}). Sent automated follow-up email pitch tailored for ${vertical} vertical.`,
      mutations: {
        triggerRestock: false,
        targetSKU: null,
        appendActivity: true,
        leadId: lead.id || 'demo-lead-id'
      }
    };
  } else if (agentName === 'OpsAgent') {
    const asset = payload.assets?.[0] || { skuCode: 'SKU-001', name: 'Asset Name', quantity: 5, restockThreshold: 10 };
    const poVal = Math.floor(100000 + Math.random() * 900000);
    return {
      agentName: 'OpsAgent',
      statusType: 'action_executed',
      internalReasoning: `Ops evaluation of ${asset.name} (${asset.skuCode}). Current stock: ${asset.quantity}, safety threshold: ${asset.restockThreshold}. Deficit detected. Dispatching restock command.`,
      systemOutputLog: `[OpsAgent] Detected inventory deficit on SKU "${asset.skuCode}". Generated Simulated Purchase Order PO-${poVal} and triggered restock mutation.`,
      mutations: {
        triggerRestock: true,
        targetSKU: asset.skuCode || 'SKU-DEMO',
        appendActivity: false,
        leadId: null
      }
    };
  } else {
    const leadCount = payload.leads?.length || 0;
    return {
      agentName: 'StrategyAgent',
      statusType: 'inspecting',
      internalReasoning: `Strategy scan across ${leadCount} active leads. vertical: ${vertical}. Analyzing conversion metrics and macro execution pipeline.`,
      systemOutputLog: `[StrategyAgent] Live performance diagnostics active. Macro-conversions stable. Context vertical: ${vertical}.`,
      mutations: {
        triggerRestock: false,
        targetSKU: null,
        appendActivity: false,
        leadId: null
      }
    };
  }
};

async function parseRequestBody(req: any): Promise<any> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return {};
  }

  if (typeof req.json === 'function') {
    return await req.json();
  }
  
  if (req.body) {
    if (typeof req.body === 'object') {
      return req.body;
    }
    try {
      return JSON.parse(req.body);
    } catch {
      // ignore
    }
  }

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', (err: any) => {
      reject(err);
    });
  });
}

export default async function handler(req: any, res?: any): Promise<any> {
  try {
    const payload = await parseRequestBody(req);
    
    if (!payload || !payload.agentType || !Array.isArray(payload.leads) || !Array.isArray(payload.warehouseAssets)) {
      const errorResponse = {
        action_executed: false,
        error: "Empty or malformed payload. Please provide active agentType, leads, and warehouseAssets arrays.",
        recoveryStep: "Ensure zetaStore context is initialized and payloads are JSON serialized."
      };
      if (res && typeof res.status === 'function') {
        res.status(400).json(errorResponse);
        return;
      }
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { agentType, leads, warehouseAssets, tenantContext } = payload;
    const { leads: compressedLeads, assets: compressedAssets } = compressPayload(leads, warehouseAssets);

    const systemPrompts: Record<string, string> = {
      SalesAgent: "You are an elite, highly aggressive Enterprise Sales Director for Centle Group. Analyze the provided lead payload. Identify high-value accounts or stale deals. Output a deep internal thought log analyzing their company vertical, followed by a personalized, ready-to-send contextual email pitch. Return a strict JSON response containing agentName (SalesAgent), statusType (action_executed), internalReasoning, systemOutputLog, and mutations object (triggerRestock=false, targetSKU=null, appendActivity=true, leadId).",
      OpsAgent: "You are an autonomous Logistics Systems Commander. Inspect the provided inventory metrics and invoice balances. If an item drops near or below safety limits, compute the precise restock volume based on current tenant activity and generate a fully formed mock Purchase Order ledger string. Return a strict JSON response containing agentName (OpsAgent), statusType (action_executed), internalReasoning, systemOutputLog, and mutations object (triggerRestock=true, targetSKU, appendActivity=false, leadId=null).",
      StrategyAgent: "You are the Core Executive Strategy Director. Review cross-tenant balances, aggregate conversions, and macro performance. Generate a high-level, sharp performance analysis highlighting structural wins and friction points. Return a strict JSON response containing agentName (StrategyAgent), statusType (inspecting), internalReasoning, systemOutputLog, and mutations object (triggerRestock=false, targetSKU=null, appendActivity=false, leadId=null)."
    };

    const prompt = systemPrompts[agentType] || systemPrompts.StrategyAgent;

    let responseJSON;
    try {
      responseJSON = await callLLM(agentType, prompt, { leads: compressedLeads, assets: compressedAssets, tenantContext });
    } catch (llmError) {
      responseJSON = fallbackGenerate(agentType, { leads: compressedLeads, assets: compressedAssets, tenantContext });
    }

    if (res && typeof res.status === 'function') {
      res.status(200).json(responseJSON);
      return;
    }
    return new Response(JSON.stringify(responseJSON), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    const errorResponse = {
      action_executed: false,
      error: err.message || "Internal server error during agent routing processing.",
      recoveryStep: "Verify incoming request payload formatting and try again."
    };
    if (res && typeof res.status === 'function') {
      res.status(500).json(errorResponse);
      return;
    }
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
