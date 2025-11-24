import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Supabase connection initialized:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...'
});

export const TEST_MODE = false;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StickerEntry {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  package_name: string;
  package_price: number;
  order_id: string;
  position_number: number;
  created_at: string;
  payment_status: 'pending' | 'completed' | 'failed';
  transaction_number?: string;
}
