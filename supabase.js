import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnqjhmkuwjmaumbukpxg.supabase.co';
const supabaseAnonKey = 'sb_publishable_dD60jnGCmn1ez_2D8z_7Cw_3Xi2cY53';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);