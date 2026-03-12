import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fptmcwmpqgbguhrkgage.supabase.co";
const supabaseAnonKey = "sb_publishable_IMnAtefIjVvJfiUEf8M6pg_72RUGXm5";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
