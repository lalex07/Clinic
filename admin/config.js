/* Admin app config — BROWSER-SAFE values only.
 * The anon key + project URL are designed to be public; RLS is the security gate.
 * NEVER put the service-role key or a GitHub PAT here. */
window.SUPABASE_CONFIG = {
  url: 'https://ysnrrkpusgdgzwkywddu.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbnJya3B1c2dkZ3p3a3l3ZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mjk5MTIsImV4cCI6MjA5NjMwNTkxMn0.pZbXVHYOa9yc4kOjwN2DtSkWIUV7SFDfPHrysjcPQ58',
  // Optional: name of the deployed Edge Function that triggers regeneration.
  // Leave as-is; if not deployed, the Publish button explains the manual fallback.
  regenFunction: 'regen-team',
};
