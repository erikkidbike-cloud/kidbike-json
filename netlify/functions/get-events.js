const { createClient } = require('@supabase/supabase-js');

// Initialiseer Supabase met omgevingsvariabelen
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

exports.handler = async (event, context) => {
  // Zorg ervoor dat het frontend vanaf andere domeinen data kan opvragen (CORS)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Haal alle actieve evenementen op inclusief de locatiedetails
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        link,
        start_time,
        end_time,
        source,
        meta,
        locations (id, name, address, latitude, longitude)
      `)
      .order('start_time', { ascending: true });

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
