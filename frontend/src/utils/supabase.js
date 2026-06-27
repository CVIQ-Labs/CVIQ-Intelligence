import { createClient } from '@supabase/supabase-js'


const SUPABASE_URL = 'https://chacqzhousgxyaxlipek.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoYWNxemhvdXNneHlheGxpcGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTkwNjksImV4cCI6MjA5Nzk3NTA2OX0.DCBfFOwlw7g23Jzj5YIMv1YWnwvvsq2QHmYKp8GdSx0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)